import { useEffect, useMemo, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Globe,
  GripVertical,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

const platformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "site", label: "Site" },
];

const PLATFORM_META = {
  instagram: {
    label: "Instagram",
    Icon: Link2,
    primaryFieldLabel: "Perfil",
    primaryPlaceholder: "@perfil",
  },
  facebook: {
    label: "Facebook",
    Icon: Link2,
    primaryFieldLabel: "URL",
    primaryPlaceholder: "https://...",
  },
  tiktok: {
    label: "TikTok",
    Icon: Link2,
    primaryFieldLabel: "Perfil",
    primaryPlaceholder: "@perfil",
  },
  youtube: {
    label: "YouTube",
    Icon: Link2,
    primaryFieldLabel: "Perfil",
    primaryPlaceholder: "@perfil",
  },
  site: {
    label: "Site",
    Icon: Globe,
    primaryFieldLabel: "URL",
    primaryPlaceholder: "https://...",
  },
};

function normalizeHandle(value) {
  return String(value || "").trim().replace(/^@+/, "").replace(/\s+/g, "");
}

function isHandlePlatform(platform) {
  return (
    platform === "instagram" ||
    platform === "youtube" ||
    platform === "tiktok"
  );
}

function getPlatformMeta(platform = "") {
  const normalizedPlatform = String(platform || "").trim().toLowerCase();
  return PLATFORM_META[normalizedPlatform] || PLATFORM_META.instagram;
}

function getPlatformLabel(platform = "") {
  return getPlatformMeta(platform).label;
}

function buildSecondaryUrl(platform, handle, fallbackUrl = "") {
  const normalizedHandle = normalizeHandle(handle);

  if (platform === "instagram") {
    return normalizedHandle
      ? `https://www.instagram.com/${normalizedHandle}/`
      : "";
  }

  if (platform === "tiktok") {
    return normalizedHandle
      ? `https://www.tiktok.com/@${normalizedHandle}`
      : "";
  }

  if (platform === "youtube") {
    return normalizedHandle
      ? `https://www.youtube.com/@${normalizedHandle}`
      : "";
  }

  return String(fallbackUrl || "").trim();
}

function getPrimaryFieldValue(link = {}) {
  if (isHandlePlatform(link.platform || "")) {
    return String(link.handle || "").trim();
  }

  return String(link.url || "").trim();
}

function buildEditableSecondaryLinkSnapshot(link = {}) {
  return JSON.stringify({
    platform: String(link.platform || "instagram").trim().toLowerCase(),
    title: String(link.title || ""),
    handle: String(link.handle || ""),
    url: String(link.url || ""),
    isActive: link.isActive !== false,
  });
}

function hasPatchChanges(link = {}, patch = {}) {
  return (
    buildEditableSecondaryLinkSnapshot({ ...link, ...patch }) !==
    buildEditableSecondaryLinkSnapshot(link)
  );
}

function buildFieldPatch(link = {}, field, value) {
  if (field === "title") {
    return { title: value };
  }

  if (isHandlePlatform(link.platform || "")) {
    const nextHandle = normalizeHandle(value);
    return {
      handle: nextHandle,
      url: buildSecondaryUrl(link.platform, nextHandle),
    };
  }

  return {
    url: value,
  };
}

function createPlatformChangePatch(link = {}, nextPlatform) {
  const normalizedNextPlatform = String(nextPlatform || "instagram")
    .trim()
    .toLowerCase();
  const currentPlatform = String(link.platform || "instagram")
    .trim()
    .toLowerCase();
  const nextUsesHandle = isHandlePlatform(normalizedNextPlatform);
  const currentUsesHandle = isHandlePlatform(currentPlatform);
  const currentTitle = String(link.title || "").trim();

  if (nextUsesHandle) {
    const nextHandle = currentUsesHandle ? normalizeHandle(link.handle) : "";

    return {
      platform: normalizedNextPlatform,
      title: currentTitle || getPlatformLabel(normalizedNextPlatform),
      handle: nextHandle,
      url: buildSecondaryUrl(normalizedNextPlatform, nextHandle),
    };
  }

  return {
    platform: normalizedNextPlatform,
    title: currentTitle || getPlatformLabel(normalizedNextPlatform),
    handle: "",
    url: currentUsesHandle ? "" : String(link.url || "").trim(),
  };
}

export default function SecondaryLinkItemRowV2({
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
  const platformMeta = getPlatformMeta(link.platform);
  const primaryValue = getPrimaryFieldValue(link);
  const Icon = platformMeta.Icon;
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
    setMenuSaving(false);
    setMenuError("");
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

  function resetFieldState() {
    setEditingField(null);
    setDraftValue("");
    setFieldError("");
  }

  function startEditing(field) {
    if (savingField || menuSaving) {
      return;
    }

    setMenuOpen(false);
    setMenuError("");
    setFieldError("");
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
      const message =
        error.message || "Nao foi possivel salvar o link secundario.";

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

  async function commitCurrentField() {
    if (!editingField) {
      return;
    }

    await commitPatch(buildFieldPatch(link, editingField, draftValue), {
      source: "field",
      field: editingField,
    });
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

  async function handlePlatformChange(event) {
    await commitPatch(createPlatformChangePatch(link, event.target.value), {
      source: "menu",
      closeMenu: true,
    });
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
        aria-label={`Reordenar ${link.title || "link secundario"}`}
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
                    onChange={(event) => setDraftValue(event.target.value)}
                    onKeyDown={handleFieldKeyDown}
                    onBlur={handleFieldBlur}
                    placeholder="Rotulo"
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
                    {link.title || "Rotulo"}
                  </strong>
                  <button
                    type="button"
                    className="link-card__field-action"
                    onClick={() => startEditing("title")}
                    aria-label={`Editar rotulo de ${link.title || getPlatformLabel(link.platform)}`}
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
                    onChange={(event) => setDraftValue(event.target.value)}
                    onKeyDown={handleFieldKeyDown}
                    onBlur={handleFieldBlur}
                    placeholder={platformMeta.primaryPlaceholder}
                    disabled={Boolean(savingField)}
                  />
                  {fieldError ? (
                    <span className="link-card__field-error">{fieldError}</span>
                  ) : null}
                </div>
              ) : (
                <>
                  <span
                    className={`link-card__field-value${primaryValue ? "" : " is-placeholder"}`}
                  >
                    {primaryValue || platformMeta.primaryFieldLabel}
                  </span>
                  <button
                    type="button"
                    className="link-card__field-action"
                    onClick={() => startEditing("value")}
                    aria-label={`Editar ${platformMeta.primaryFieldLabel.toLowerCase()} de ${link.title || getPlatformLabel(link.platform)}`}
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
              ariaLabel={`Alterar visibilidade de ${link.title || getPlatformLabel(link.platform)}`}
              disabled={Boolean(savingField || menuSaving)}
            />
            <button
              type="button"
              className="link-card__icon-action is-danger"
              onClick={onDelete}
              aria-label={`Excluir ${link.title || getPlatformLabel(link.platform)}`}
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
                {platformMeta.label}
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div className="link-card__popover">
                <label className="field">
                  <span>Plataforma</span>
                  <select
                    className="ui-select"
                    value={link.platform || "instagram"}
                    onChange={handlePlatformChange}
                    disabled={menuSaving}
                  >
                    {platformOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {menuError ? (
                  <span className="link-card__field-error">{menuError}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
