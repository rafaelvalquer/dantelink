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
import {
  PRIMARY_LINK_PLATFORM_OPTIONS,
  buildSecondaryLinkUrl,
  getSecondaryPlatformLabel,
  getSecondaryPlatformMeta,
  isSecondaryHandlePlatform,
  normalizeSecondaryEmail,
  normalizeSecondaryHandle,
  normalizeSecondaryPhone,
} from "./linkPickerCatalog.js";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

const typeOptions = [
  { value: "link", label: "Link" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "location", label: "Localização" },
  { value: "shop-preview", label: "Prévia da loja" },
];

const WHATSAPP_DEFAULT_MESSAGE =
  "Olá! Vim pela sua página pública e gostaria de mais informações.";

const LINK_TYPE_META = {
  link: {
    label: "Link",
    Icon: Link2,
    primaryFieldLabel: "URL",
    primaryPlaceholder: "https://...",
    usesPrimaryField: true,
  },
  whatsapp: {
    label: "WhatsApp",
    Icon: MessageCircle,
    primaryFieldLabel: "Numero do WhatsApp",
    primaryPlaceholder: "5511999999999",
    usesPrimaryField: true,
  },
  location: {
    label: "Localização",
    Icon: MapPin,
    primaryFieldLabel: "Endereço",
    primaryPlaceholder: "Digite o endereço para ver sugestões",
    usesPrimaryField: true,
  },
  "shop-preview": {
    label: "Prévia da loja",
    Icon: ShoppingBag,
    primaryFieldLabel: "Preview da loja",
    primaryPlaceholder: "",
    usesPrimaryField: false,
  },
};

function isPlatformLink(link = {}) {
  return (
    String(link?.type || "").trim().toLowerCase() === "link" &&
    String(link?.platform || "").trim() !== ""
  );
}

function getTypeMeta(link = {}) {
  if (isPlatformLink(link)) {
    return getSecondaryPlatformMeta(link.platform);
  }

  const normalizedType = String(link?.type || "").trim().toLowerCase();
  return LINK_TYPE_META[normalizedType] || LINK_TYPE_META.link;
}

function isUrlType(type = "") {
  const normalizedType = String(type || "").trim().toLowerCase();
  return normalizedType === "link";
}

function getPrimaryFieldValue(link = {}) {
  const linkType = String(link.type || "").trim().toLowerCase();

  if (linkType === "link" && String(link.platform || "").trim()) {
    const platform = String(link.platform || "").trim().toLowerCase();

    if (platform === "email") {
      return normalizeSecondaryEmail(link.url || "");
    }

    if (platform === "phone") {
      return normalizeSecondaryPhone(link.url || "");
    }

    if (isSecondaryHandlePlatform(platform)) {
      return String(link.handle || "").trim();
    }

    return String(link.url || "").trim();
  }

  if (linkType === "whatsapp") {
    return String(link.phone || "").trim();
  }

  if (linkType === "location") {
    return String(link.address || "").trim();
  }

  return String(link.url || "").trim();
}

function sortActiveShopProducts(products = []) {
  return [...(products || [])]
    .filter((product) => product?.isActive)
    .sort((left, right) => Number(left?.order ?? 0) - Number(right?.order ?? 0));
}

function ShopPreviewGrid({ products = [] }) {
  const previewItems = sortActiveShopProducts(products).slice(0, 4);
  const mosaicCount = previewItems.length || 4;
  const cells = previewItems.length
    ? previewItems
    : Array.from({ length: 4 }, (_, index) => ({ id: `placeholder-${index}` }));

  return (
    <div className="link-card__shop-preview">
      <div
        className={[
          "link-card__shop-preview-grid",
          `is-count-${mosaicCount}`,
        ].join(" ")}
      >
        {cells.map((product, index) => (
          <div
            key={product.id || index}
            className={[
              "link-card__shop-preview-cell",
              mosaicCount === 3 && index === 0 ? "is-featured" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title || "Produto da loja"} />
            ) : (
              <div className="link-card__shop-preview-placeholder">
                <ShoppingBag size={18} aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="link-card__shop-preview-copy">
        <strong>Ver loja completa</strong>
        <span>
          {previewItems.length} {previewItems.length === 1 ? "produto" : "produtos"}
        </span>
      </div>
    </div>
  );
}

function buildEditableLinkSnapshot(link = {}) {
  return JSON.stringify({
    title: String(link.title || ""),
    type: String(link.type || "link").trim().toLowerCase(),
    platform: String(link.platform || "").trim().toLowerCase(),
    handle: String(link.handle || "").trim(),
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

  if (linkType === "link" && String(link.platform || "").trim()) {
    const platform = String(link.platform || "").trim().toLowerCase();

    if (isSecondaryHandlePlatform(platform)) {
      const nextHandle = normalizeSecondaryHandle(value, platform);
      return {
        handle: nextHandle,
        url: buildSecondaryLinkUrl(platform, nextHandle),
      };
    }

    if (platform === "email") {
      const normalizedEmail = normalizeSecondaryEmail(value);
      return {
        handle: "",
        url: buildSecondaryLinkUrl("email", "", normalizedEmail),
      };
    }

    if (platform === "phone") {
      const normalizedPhone = normalizeSecondaryPhone(value);
      return {
        handle: "",
        url: buildSecondaryLinkUrl("phone", "", normalizedPhone),
      };
    }

    return {
      handle: "",
      url: value,
    };
  }

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
      platform: "",
      handle: "",
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
      platform: "",
      handle: "",
      phone: "",
      message: "",
      address: currentType === "location" ? String(link.address || "") : "",
      placeId: currentType === "location" ? String(link.placeId || "") : "",
      showMap: currentType === "location" ? link.showMap === true : false,
    };
  }

  if (normalizedNextType === "shop-preview") {
    return {
      type: "shop-preview",
      url: "",
      platform: "",
      handle: "",
      phone: "",
      message: "",
      address: "",
      placeId: "",
      showMap: false,
    };
  }

  return {
    type: normalizedNextType,
    url: isUrlType(currentType) ? String(link.url || "") : "",
    platform: currentType === "link" ? String(link.platform || "").trim().toLowerCase() : "",
    handle:
      currentType === "link" && isSecondaryHandlePlatform(link.platform || "")
        ? normalizeSecondaryHandle(link.handle || "", link.platform || "")
        : "",
    phone: "",
    message: "",
    address: "",
    placeId: "",
    showMap: false,
  };
}

function createPlatformChangePatch(link = {}, nextPlatform) {
  const normalizedNextPlatform = String(nextPlatform || "").trim().toLowerCase();
  const currentPlatform = String(link.platform || "").trim().toLowerCase();
  const nextUsesHandle = isSecondaryHandlePlatform(normalizedNextPlatform);
  const currentUsesHandle = isSecondaryHandlePlatform(currentPlatform);
  const currentTitle = String(link.title || "").trim();
  const currentTypeMeta = getTypeMeta(link);
  const shouldReplaceTitle =
    !currentTitle ||
    currentTitle === "Link" ||
    currentTitle === currentTypeMeta.label;

  if (!normalizedNextPlatform) {
    return {
      type: "link",
      platform: "",
      handle: "",
      title: shouldReplaceTitle ? "Link" : currentTitle,
      url:
        currentUsesHandle || currentPlatform === "email" || currentPlatform === "phone"
          ? ""
          : String(link.url || "").trim(),
    };
  }

  if (nextUsesHandle) {
    const nextHandle = currentUsesHandle
      ? normalizeSecondaryHandle(link.handle, currentPlatform)
      : "";

    return {
      type: "link",
      platform: normalizedNextPlatform,
      title: shouldReplaceTitle
        ? getSecondaryPlatformLabel(normalizedNextPlatform)
        : currentTitle,
      handle: nextHandle,
      url: buildSecondaryLinkUrl(normalizedNextPlatform, nextHandle),
    };
  }

  return {
    type: "link",
    platform: normalizedNextPlatform,
    title: shouldReplaceTitle
      ? getSecondaryPlatformLabel(normalizedNextPlatform)
      : currentTitle,
    handle: "",
    url:
      normalizedNextPlatform === "email"
        ? buildSecondaryLinkUrl(
            "email",
            "",
            currentPlatform === "email"
              ? normalizeSecondaryEmail(link.url || "")
              : "",
          )
        : normalizedNextPlatform === "phone"
          ? buildSecondaryLinkUrl(
              "phone",
              "",
              currentPlatform === "phone"
                ? normalizeSecondaryPhone(link.url || "")
                : "",
            )
          : currentUsesHandle || currentPlatform === "email" || currentPlatform === "phone"
            ? ""
            : String(link.url || "").trim(),
  };
}


export default function LinkItemRowV2({
  link,
  shopProducts = [],
  onCommit,
  onDelete,
  onToggle,
  onMenuOpenChange,
  isHighlighted = false,
  dragDescriptionId,
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
  const rowRef = useRef(null);
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
  const typeMeta = getTypeMeta(link);
  const primaryValue = getPrimaryFieldValue(link);
  const Icon = typeMeta.Icon;
  const isShopPreview = link.type === "shop-preview";
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
    if (!isHighlighted) {
      return;
    }

    rowRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [isHighlighted]);

  function setRefs(node) {
    rowRef.current = node;
    setNodeRef(node);
  }

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
          setAutocompleteError("Nenhum endereço encontrado.");
        }
      } catch (error) {
        if (isCancelled || requestSequenceRef.current !== currentRequest) {
          return;
        }

        setSuggestions([]);
        setAutocompleteError(
          error.message || "Não foi possível buscar endereços.",
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

    if (field === "value" && isShopPreview) {
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
      const message = error.message || "Não foi possível salvar o link.";

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

  async function handlePlatformChange(event) {
    await commitPatch(createPlatformChangePatch(link, event.target.value), {
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
      ref={setRefs}
      className={`item-row item-row--sortable link-card${isDragging ? " is-dragging" : ""}${menuOpen ? " is-menu-open" : ""}${isHighlighted ? " is-highlighted" : ""}`}
      style={sortableStyle}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className={`item-row__drag-handle${isInteractionLocked ? " is-disabled" : ""}`}
        aria-label={`Reordenar ${link.title || "link"}`}
        aria-describedby={dragDescriptionId}
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
                    placeholder="Título"
                    aria-label="Editar título do link"
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
                    {link.title || "Título"}
                  </strong>
                  <button
                    type="button"
                    className="link-card__field-action"
                    onClick={() => startEditing("title")}
                    aria-label={`Editar título de ${link.title || "link"}`}
                    disabled={Boolean(savingField || menuSaving)}
                  >
                    <Pencil size={14} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>

            <div className="link-card__field-row link-card__field-row--value">
              {isShopPreview ? (
                <ShopPreviewGrid products={shopProducts} />
              ) : editingField === "value" ? (
                <div className="link-card__field-editor">
                  <Input
                    ref={inputRef}
                    className="link-card__inline-input"
                    value={draftValue}
                    onChange={handleFieldInputChange}
                    onKeyDown={handleFieldKeyDown}
                    onBlur={handleFieldBlur}
                    placeholder={typeMeta.primaryPlaceholder}
                    aria-label={typeMeta.primaryFieldLabel}
                    disabled={Boolean(savingField)}
                  />
                  {loadingSuggestions ? (
                    <div className="item-row__helper">Buscando sugestões...</div>
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
                            role="option"
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
                    aria-label={`Editar ${typeMeta.primaryFieldLabel.toLowerCase()} de ${link.title || typeMeta.label || "link"}`}
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
                    aria-label="Tipo do link"
                    disabled={menuSaving}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {link.type === "shop-preview" ? (
                  <div className="item-row__helper">
                    A prévia da loja usa automaticamente as imagens dos produtos ativos e leva para o catálogo público.
                  </div>
                ) : null}

                {link.type === "link" ? (
                  <label className="field">
                    <span>Plataforma</span>
                    <select
                      className="ui-select"
                      value={link.platform || ""}
                      onChange={handlePlatformChange}
                      aria-label="Plataforma do link"
                      disabled={menuSaving}
                    >
                      {PRIMARY_LINK_PLATFORM_OPTIONS.map((option) => (
                        <option key={option.value || "generic"} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {menuError ? (
                  <span className="link-card__field-error">{menuError}</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {link.type === "location" ? (
            <div className="link-card__map-toggle">
              <Switch
                checked={Boolean(link.showMap)}
                onChange={(nextChecked) => {
                  void handleShowMapChange(nextChecked);
                }}
                label="Mostrar mapa"
                className="link-card__map-toggle-switch"
                disabled={Boolean(menuSaving || savingField)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
