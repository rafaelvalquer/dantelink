import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Trash2, X } from "lucide-react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import SectionCard from "./SectionCard.jsx";

const TITLE_LIMIT = 30;
const BIO_LIMIT = 160;

function AvatarModal({
  open,
  currentAvatarUrl,
  onClose,
  onApplyUrl,
  onRemove,
  onUpload,
  isUploading = false,
}) {
  const [mode, setMode] = useState("menu");
  const [urlDraft, setUrlDraft] = useState(currentAvatarUrl || "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    setMode("menu");
    setUrlDraft(currentAvatarUrl || "");

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentAvatarUrl, onClose]);

  if (!open) return null;

  async function handleFileSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    await onUpload(file);
    event.target.value = "";
  }

  function handleApplyUrl() {
    onApplyUrl(urlDraft.trim());
  }

  return (
    <div className="avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
      <div className="avatar-modal__backdrop" onClick={onClose} />
      <div className="avatar-modal__panel">
        <div className="avatar-modal__header">
          <h3 id="avatar-modal-title">Imagem de perfil</h3>
          <button
            type="button"
            className="avatar-modal__close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {mode === "menu" ? (
          <div className="avatar-modal__actions">
            <input
              ref={fileInputRef}
              className="avatar-modal__file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
            />

            <button
              type="button"
              className="avatar-modal__action avatar-modal__action--primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <span className="avatar-modal__action-icon">
                <ImagePlus size={20} />
              </span>
              <span className="avatar-modal__action-copy">
                <strong>{isUploading ? "Enviando imagem..." : "Selecionar imagem"}</strong>
                <small>Escolha uma imagem do seu computador.</small>
              </span>
            </button>

            <button
              type="button"
              className="avatar-modal__action"
              onClick={() => setMode("url")}
            >
              <span className="avatar-modal__action-icon">
                <Link2 size={20} />
              </span>
              <span className="avatar-modal__action-copy">
                <strong>Usar URL</strong>
                <small>Informe um link direto para a imagem.</small>
              </span>
            </button>

            <button
              type="button"
              className="avatar-modal__action"
              onClick={onRemove}
            >
              <span className="avatar-modal__action-icon is-danger">
                <Trash2 size={20} />
              </span>
              <span className="avatar-modal__action-copy">
                <strong>Remover avatar atual</strong>
                <small>Limpa a imagem do perfil imediatamente.</small>
              </span>
            </button>
          </div>
        ) : (
          <div className="avatar-modal__url-form">
            <label className="field field--full">
              <span>URL da imagem</span>
              <Input
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
                placeholder="https://..."
              />
            </label>

            <div className="avatar-modal__footer">
              <Button variant="ghost" onClick={() => setMode("menu")}>
                Voltar
              </Button>
              <Button onClick={handleApplyUrl}>Usar URL</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileDetailsModal({
  open,
  value,
  onClose,
  onChange,
  onSave,
  isSaving = false,
}) {
  const [draft, setDraft] = useState({
    title: "",
    slug: "",
    bio: "",
  });

  useEffect(() => {
    if (!open) return undefined;

    setDraft({
      title: String(value?.title || ""),
      slug: String(value?.slug || ""),
      bio: String(value?.bio || ""),
    });

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, value?.title, value?.slug, value?.bio, isSaving, onClose]);

  if (!open) return null;

  function handleDraftChange(field, nextValue) {
    setDraft((current) => ({
      ...current,
      [field]: nextValue,
    }));
  }

  async function handleSubmit() {
    const nextProfile = {
      ...value,
      title: draft.title,
      slug: draft.slug,
      bio: draft.bio,
    };

    onChange("title", nextProfile.title);
    onChange("slug", nextProfile.slug);
    onChange("bio", nextProfile.bio);
    const didSave = await onSave(nextProfile);
    if (didSave !== false) {
      onClose();
    }
  }

  return (
    <div
      className="profile-details-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-details-modal-title"
    >
      <div className="profile-details-modal__backdrop" onClick={isSaving ? undefined : onClose} />
      <div className="profile-details-modal__panel">
        <div className="profile-details-modal__header">
          <h3 id="profile-details-modal-title">Title and bio</h3>
          <button
            type="button"
            className="profile-details-modal__close"
            onClick={onClose}
            aria-label="Fechar modal"
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="profile-details-modal__body">
          <label className="field field--full">
            <span>Title</span>
            <Input
              value={draft.title}
              onChange={(event) => handleDraftChange("title", event.target.value)}
              placeholder="@mutantwear"
              maxLength={TITLE_LIMIT}
            />
            <span className="profile-details-modal__counter">
              {draft.title.length} / {TITLE_LIMIT}
            </span>
          </label>

          <label className="field field--full">
            <span>Slug</span>
            <Input
              value={draft.slug}
              onChange={(event) => handleDraftChange("slug", event.target.value)}
              placeholder="mutantwear"
            />
          </label>

          <label className="field field--full">
            <span>Bio</span>
            <Textarea
              value={draft.bio}
              onChange={(event) => handleDraftChange("bio", event.target.value)}
              placeholder="Viva a Mutacao."
              maxLength={BIO_LIMIT}
              rows={5}
            />
            <span className="profile-details-modal__counter">
              {draft.bio.length} / {BIO_LIMIT}
            </span>
          </label>
        </div>

        <div className="profile-details-modal__footer">
          <Button className="profile-details-modal__save" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileEditorCardV2({
  value,
  onChange,
  onSave,
  onUploadAvatar,
  isSaving = false,
  isUploadingAvatar = false,
}) {
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const avatarInitial =
    String(value.title || "M").trim().slice(0, 1).toUpperCase() || "M";
  const visibleTitle = String(value.title || "").trim() || "@seuusuario";
  const visibleSlug = String(value.slug || "").trim() || "seu-slug";
  const visibleBio =
    String(value.bio || "").trim() ||
    "Conte para as pessoas do que se trata a sua pagina.";

  function handleApplyAvatarUrl(nextUrl) {
    onChange("avatarUrl", nextUrl);
    setIsAvatarModalOpen(false);
  }

  function handleRemoveAvatar() {
    onChange("avatarUrl", "");
    setIsAvatarModalOpen(false);
  }

  async function handleUploadAvatar(file) {
    await onUploadAvatar(file);
    setIsAvatarModalOpen(false);
  }

  return (
    <>
      <SectionCard title="Perfil">
        <div className="profile-card__layout">
          <button
            type="button"
            className="profile-avatar-trigger"
            onClick={() => setIsAvatarModalOpen(true)}
          >
            {value.avatarUrl ? (
              <img
                className="profile-avatar-trigger__image"
                src={value.avatarUrl}
                alt={value.title || "Avatar do perfil"}
              />
            ) : (
              <span className="profile-avatar-trigger__placeholder">{avatarInitial}</span>
            )}
            <span className="profile-avatar-trigger__label">Alterar avatar</span>
          </button>

          <button
            type="button"
            className="profile-card__summary"
            onClick={() => setIsProfileModalOpen(true)}
            aria-label="Editar titulo, slug e bio"
          >
            <span className="profile-card__summary-eyebrow">Perfil publico</span>
            <span className="profile-card__summary-title">{visibleTitle}</span>
            <span className="profile-card__summary-slug">/{visibleSlug}</span>
            <span className="profile-card__summary-bio">{visibleBio}</span>
          </button>
        </div>
      </SectionCard>

      <AvatarModal
        open={isAvatarModalOpen}
        currentAvatarUrl={value.avatarUrl}
        onClose={() => setIsAvatarModalOpen(false)}
        onApplyUrl={handleApplyAvatarUrl}
        onRemove={handleRemoveAvatar}
        onUpload={handleUploadAvatar}
        isUploading={isUploadingAvatar}
      />

      <ProfileDetailsModal
        open={isProfileModalOpen}
        value={value}
        onClose={() => setIsProfileModalOpen(false)}
        onChange={onChange}
        onSave={onSave}
        isSaving={isSaving}
      />
    </>
  );
}
