import { useEffect, useMemo, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  GripVertical,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { searchLocationSuggestions } from "../../app/api.js";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

const typeOptions = [
  { value: "link", label: "Link" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "location", label: "Localizacao" },
  { value: "shop-preview", label: "Previa da loja" },
];

const WHATSAPP_DEFAULT_MESSAGE =
  "Ola! Vim pela sua pagina publica e gostaria de mais informacoes.";

const LINK_TYPE_META = {
  link: {
    label: "Link",
    Icon: Link2,
    primaryFieldLabel: "URL",
    primaryPlaceholder: "https://...",
  },
  whatsapp: {
    label: "WhatsApp",
    Icon: MessageCircle,
    primaryFieldLabel: "Numero do WhatsApp",
    primaryPlaceholder: "5511999999999",
  },
  location: {
    label: "Localizacao",
    Icon: MapPin,
    primaryFieldLabel: "Endereco",
    primaryPlaceholder: "Digite o endereco para ver sugestoes",
  },
  "shop-preview": {
    label: "Previa da loja",
    Icon: ShoppingBag,
    primaryFieldLabel: "URL da loja",
    primaryPlaceholder: "https://...",
  },
};

function getTypeMeta(type = "") {
  const normalizedType = String(type || "").trim().toLowerCase();
  return LINK_TYPE_META[normalizedType] || LINK_TYPE_META.link;
}

function isUrlType(type = "") {
  const normalizedType = String(type || "").trim().toLowerCase();
  return normalizedType === "link" || normalizedType === "shop-preview";
}

function getPrimaryFieldValue(link = {}) {
  const linkType = String(link.type || "").trim().toLowerCase();

  if (linkType === "whatsapp") {
    return String(link.phone || "").trim();
  }

  if (linkType === "location") {
    return String(link.address || "").trim();
  }

  return String(link.url || "").trim();
}

function buildEditableLinkSnapshot(link = {}) {
  return JSON.stringify({
    title: String(link.title || ""),
    type: String(link.type || "link").trim().toLowerCase(),
    url: String(link.url || ""),
    phone: String(link.phone || ""),
    message: String(link.message || ""),
    address: String(link.address || ""),
    placeId: String(link.placeId || ""),
    showMap: link.showMap === true,
    isActive: link.isActive !== false,
  });
}

function hasPatchChanges(link = {}, patch = {}) {
  return (
    buildEditableLinkSnapshot({ ...link, ...patch }) !==
    buildEditableLinkSnapshot(link)
  );
}

function buildFieldPatch(link = {}, field, value, locationPlaceId = "") {
  if (field === "title") {
    return { title: value };
  }

  const linkType = String(link.type || "").trim().toLowerCase();

  if (linkType === "whatsapp") {
    return {
      phone: value,
    };
  }

  if (linkType === "location") {
    return {
      address: value,
      placeId: locationPlaceId,
    };
  }

  return { url: value };
}

function createTypeChangePatch(link = {}, nextType) {
  const normalizedNextType = String(nextType || "link").trim().toLowerCase();
  const currentType = String(link.type || "").trim().toLowerCase();

  if (normalizedNextType === "whatsapp") {
    return {
      type: "whatsapp",
      url: "",
      address: "",
      placeId: "",
      showMap: false,
      phone: currentType === "whatsapp" ? String(link.phone || "") : "",
      message:
        currentType === "whatsapp"
          ? String(link.message || "") || WHATSAPP_DEFAULT_MESSAGE
          : WHATSAPP_DEFAULT_MESSAGE,
    };
  }

  if (normalizedNextType === "location") {
    return {
      type: "location",
      url: "",
      phone: "",
      message: "",
      address: currentType === "location" ? String(link.address || "") : "",
      placeId: currentType === "location" ? String(link.placeId || "") : "",
      showMap: currentType === "location" ? link.showMap === true : false,
    };
  }

  return {
    type: normalizedNextType,
    url: isUrlType(currentType) ? String(link.url || "") : "",
    phone: "",
    message: "",
    address: "",
    placeId: "",
    showMap: false,
  };
}


export default function LinkItemRowV2({
  link,
  onCommit,
  onDelete,
  onToggle,
  onMenuOpenChange,
}) {
  const [editingField, setEditingField] = useState(null);
  const [draftValue, setDraftValue] = useState("");
  const [savingField, setSavingField] = useState(null);
  const [fieldError, setFieldError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuError, setMenuError] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState("");
  const [locationDraftPlaceId, setLocationDraftPlaceId] = useState(
    String(link.placeId || ""),
  );
  const requestSequenceRef = useRef(0);
  const lastSuccessfulQueryRef = useRef("");
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const isInteractionLocked = Boolean(editingField || savingField || menuSaving);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: link.id,
    disabled: isInteractionLocked,
  });
  const typeMeta = getTypeMeta(link.type);
  const primaryValue = getPrimaryFieldValue(link);
  const Icon = typeMeta.Icon;
  const isEditingValue = editingField === "value";
  const isLocationValue = isEditingValue && link.type === "location";
  const sortableStyle = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  useEffect(() => {
    setEditingField(null);
    setDraftValue("");
    setSavingField(null);
    setFieldError("");
    setMenuOpen(false);
    setMenuError("");
    setSuggestions([]);
    setLoadingSuggestions(false);
    setAutocompleteError("");
    setLocationDraftPlaceId(String(link.placeId || ""));
    lastSuccessfulQueryRef.current = "";
    requestSequenceRef.current = 0;
  }, [link.id]);

  useEffect(() => {
    if (!editingField) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus?.();
      inputRef.current?.select?.();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [editingField]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function handleOutsideClick(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
        setMenuError("");
      }
    }

    window.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  useEffect(() => {
    onMenuOpenChange?.(menuOpen);
  }, [menuOpen, onMenuOpenChange]);

  useEffect(() => {
    if (!isLocationValue) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setAutocompleteError("");
      return undefined;
    }

    const query = String(draftValue || "").trim();

    if (query.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setAutocompleteError("");
      return undefined;
    }

    if (query === lastSuccessfulQueryRef.current) {
      return undefined;
    }

    const currentRequest = requestSequenceRef.current + 1;
    requestSequenceRef.current = currentRequest;
    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        setAutocompleteError("");
        const response = await searchLocationSuggestions(query);

        if (isCancelled || requestSequenceRef.current !== currentRequest) {
          return;
        }

        const nextSuggestions = response.suggestions || [];
        setSuggestions(nextSuggestions);
        lastSuccessfulQueryRef.current = query;

        if (!nextSuggestions.length) {
          setAutocompleteError("Nenhum endereco encontrado.");
        }
      } catch (error) {
        if (isCancelled || requestSequenceRef.current !== currentRequest) {
          return;
        }

        setSuggestions([]);
        setAutocompleteError(
          error.message || "Nao foi possivel buscar enderecos.",
        );
      } finally {
        if (!isCancelled && requestSequenceRef.current === currentRequest) {
          setLoadingSuggestions(false);
        }
      }
    }, 450);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [draftValue, isLocationValue]);

  function resetFieldState() {
    setEditingField(null);
    setDraftValue("");
    setFieldError("");
    setSuggestions([]);
    setLoadingSuggestions(false);
    setAutocompleteError("");
    setLocationDraftPlaceId(String(link.placeId || ""));
    lastSuccessfulQueryRef.current = "";
  }

  function startEditing(field) {
    if (savingField || menuSaving) {
      return;
    }

    setMenuOpen(false);
    setMenuError("");
    setFieldError("");
    setSuggestions([]);
    setAutocompleteError("");
    setLocationDraftPlaceId(String(link.placeId || ""));
    lastSuccessfulQueryRef.current = "";
    setEditingField(field);
    setDraftValue(field === "title" ? String(link.title || "") : primaryValue);
  }

  function cancelEditing() {
    if (savingField) {
      return;
    }

    resetFieldState();
  }

  async function commitPatch(
    patch,
    { source = "field", field = editingField, closeMenu = false } = {},
  ) {
    if (!hasPatchChanges(link, patch)) {
      if (source === "field") {
        resetFieldState();
      }

      if (closeMenu) {
        setMenuOpen(false);
        setMenuError("");
      }

      return true;
    }

    try {
      if (source === "field") {
        setSavingField(field);
        setFieldError("");
      } else {
        setMenuSaving(true);
        setMenuError("");
      }

      await onCommit(patch);

      if (source === "field") {
        resetFieldState();
      }

      if (closeMenu) {
        setMenuOpen(false);
        setMenuError("");
      }

      return true;
    } catch (error) {
      const message = error.message || "Nao foi possivel salvar o link.";

      if (source === "field") {
        setFieldError(message);
      } else {
        setMenuError(message);
      }

      return false;
    } finally {
      if (source === "field") {
        setSavingField(null);
      } else {
        setMenuSaving(false);
      }
    }
  }

  async function commitCurrentField(explicitPatch) {
    if (!editingField) {
      return;
    }

    const patch =
      explicitPatch ||
      buildFieldPatch(link, editingField, draftValue, locationDraftPlaceId);

    await commitPatch(patch, {
      source: "field",
      field: editingField,
    });
  }

  async function handleSelectSuggestion(suggestion) {
    const description = String(suggestion?.description || "").trim();
    const placeId = String(suggestion?.placeId || "").trim();

    setDraftValue(description);
    setLocationDraftPlaceId(placeId);
    setSuggestions([]);
    setAutocompleteError("");
    lastSuccessfulQueryRef.current = description;

    await commitCurrentField({
      address: description,
      placeId,
    });
  }

  function handleFieldInputChange(event) {
    const nextValue = event.target.value;
    setDraftValue(nextValue);

    if (isLocationValue) {
      setLocationDraftPlaceId("");
      setSuggestions([]);
      setAutocompleteError("");
      lastSuccessfulQueryRef.current = "";
    }
  }

  function handleFieldKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      void commitCurrentField();
    }
  }

  function handleFieldBlur() {
    if (!editingField || savingField) {
      return;
    }

    void commitCurrentField();
  }

  async function handleTypeChange(event) {
    const nextType = event.target.value;
    await commitPatch(createTypeChangePatch(link, nextType), {
      source: "menu",
      closeMenu: true,
    });
  }

  async function handleShowMapChange(nextChecked) {
    await commitPatch(
      {
        showMap: nextChecked,
      },
      {
        source: "menu",
      },
    );
  }

  return (
    <article
      ref={setNodeRef}
      className={`item-row item-row--sortable link-card${isDragging ? " is-dragging" : ""}${menuOpen ? " is-menu-open" : ""}`}
      style={sortableStyle}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={`item-row__drag-handle${isInteractionLocked ? " is-disabled" : ""}`}
        aria-label={`Reordenar ${link.title || "link"}`}
        disabled={isInteractionLocked}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} aria-hidden="true" />
      </button>

      <div className="item-row__content">
        <div className="link-card__top">
          <div className="link-card__copy">
            <div className="link-card__field-row">
              {editingField === "title" ? (
                <div className="link-card__field-editor">
                  <Input
                    ref={inputRef}
                    className="link-card__inline-input"
                    value={draftValue}
                    onChange={handleFieldInputChange}
                    onKeyDown={handleFieldKeyDown}
                    onBlur={handleFieldBlur}
                    placeholder="Titulo"
                    disabled={Boolean(savingField)}
                  />
                  {fieldError ? (
                    <span className="link-card__field-error">{fieldError}</span>
                  ) : null}
                </div>
              ) : (
                <>
                  <strong
                    className={`link-card__field-value link-card__field-value--title${link.title ? "" : " is-placeholder"}`}
                  >
                    {link.title || "Titulo"}
                  </strong>
                  <button
                    type="button"
                    className="link-card__field-action"
                    onClick={() => startEditing("title")}
                    aria-label={`Editar titulo de ${link.title || "link"}`}
                    disabled={Boolean(savingField || menuSaving)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            <div className="link-card__field-row link-card__field-row--value">
              {editingField === "value" ? (
                <div className="link-card__field-editor">
                  <Input
                    ref={inputRef}
                    className="link-card__inline-input"
                    value={draftValue}
                    onChange={handleFieldInputChange}
                    onKeyDown={handleFieldKeyDown}
                    onBlur={handleFieldBlur}
                    placeholder={typeMeta.primaryPlaceholder}
                    disabled={Boolean(savingField)}
                  />
                  {loadingSuggestions ? (
                    <div className="item-row__helper">Buscando sugestoes...</div>
                  ) : null}
                  {autocompleteError ? (
                    <div className="item-row__helper item-row__helper--error">
                      {autocompleteError}
                    </div>
                  ) : null}
                  {suggestions.length ? (
                    <div className="item-row__suggestions" role="listbox">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.placeId || suggestion.description}
                          type="button"
                          className="item-row__suggestion"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            void handleSelectSuggestion(suggestion);
                          }}
                          disabled={Boolean(savingField)}
                        >
                          <strong>{suggestion.mainText || suggestion.description}</strong>
                          {suggestion.secondaryText ? (
                            <span>{suggestion.secondaryText}</span>
                          ) : (
                            <span>{suggestion.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {fieldError ? (
                    <span className="link-card__field-error">{fieldError}</span>
                  ) : null}
                </div>
              ) : (
                <>
                  <span
                    className={`link-card__field-value${primaryValue ? "" : " is-placeholder"}`}
                  >
                    {primaryValue || typeMeta.primaryFieldLabel}
                  </span>
                  <button
                    type="button"
                    className="link-card__field-action"
                    onClick={() => startEditing("value")}
                    aria-label={`Editar ${typeMeta.primaryFieldLabel.toLowerCase()} de ${link.title || "link"}`}
                    disabled={Boolean(savingField || menuSaving)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="link-card__actions">
            <Switch
              checked={Boolean(link.isActive)}
              onChange={onToggle}
              ariaLabel={`Alterar visibilidade de ${link.title || "link"}`}
              disabled={Boolean(savingField || menuSaving)}
            />
            <button
              type="button"
              className="link-card__icon-action is-danger"
              onClick={onDelete}
              aria-label={`Excluir ${link.title || "link"}`}
              disabled={Boolean(savingField || menuSaving)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="link-card__footer">
          <div className="link-card__meta-menu" ref={menuRef}>
            <button
              type="button"
              className={`link-card__meta-chip link-card__meta-button${menuOpen ? " is-open" : ""}`}
              onClick={() => {
                setMenuOpen((current) => !current);
                setMenuError("");
              }}
              disabled={isInteractionLocked}
            >
              <span className="link-card__meta-label">
                <Icon size={14} aria-hidden="true" />
                {typeMeta.label}
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div className="link-card__popover">
                <label className="field">
                  <span>Tipo do link</span>
                  <select
                    className="ui-select"
                    value={link.type || "link"}
                    onChange={handleTypeChange}
                    disabled={menuSaving}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {link.type === "location" ? (
                  <div className="link-card__popover-switch">
                    <Switch
                      checked={Boolean(link.showMap)}
                      onChange={(nextChecked) => {
                        void handleShowMapChange(nextChecked);
                      }}
                      label="Mostrar mapa"
                      disabled={menuSaving}
                    />
                  </div>
                ) : null}

                {menuError ? (
                  <span className="link-card__field-error">{menuError}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {link.type === "location" && link.showMap ? (
            <span className="link-card__meta-chip">Mapa ativo</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
