import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

const typeOptions = [
  { value: "link", label: "Link" },
  { value: "social", label: "Rede social" },
  { value: "shop-preview", label: "Previa da loja" },
];

const socialPlatformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
];

function normalizeHandle(value) {
  return String(value || "").trim().replace(/^@+/, "").replace(/\s+/g, "");
}

function isHandlePlatform(platform) {
  return platform === "instagram" || platform === "youtube" || platform === "tiktok";
}

function getPlatformLabel(platform) {
  return (
    socialPlatformOptions.find((option) => option.value === platform)?.label ||
    "Rede social"
  );
}

function buildSocialUrl(platform, handle, fallbackUrl = "") {
  const normalizedHandle = normalizeHandle(handle);

  if (platform === "instagram") {
    return normalizedHandle ? `https://www.instagram.com/${normalizedHandle}/` : "";
  }

  if (platform === "tiktok") {
    return normalizedHandle ? `https://www.tiktok.com/@${normalizedHandle}` : "";
  }

  if (platform === "youtube") {
    return normalizedHandle ? `https://www.youtube.com/@${normalizedHandle}` : "";
  }

  if (platform === "facebook") {
    return String(fallbackUrl || "");
  }

  return "";
}

export default function LinkItemRowV2({
  link,
  onChange,
  onSave,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}) {
  const isSocial = link.type === "social";
  const currentPlatform = isSocial ? link.platform || "instagram" : "";
  const handleBasedPlatform = isHandlePlatform(currentPlatform);
  const socialPreviewUrl = handleBasedPlatform
    ? buildSocialUrl(currentPlatform, link.handle)
    : "";

  function handleTypeChange(nextType) {
    if (nextType === "social") {
      const nextPlatform = link.platform || "instagram";
      const nextHandle = isHandlePlatform(nextPlatform)
        ? normalizeHandle(link.handle)
        : "";

      onChange({
        type: "social",
        platform: nextPlatform,
        handle: nextHandle,
        url: isHandlePlatform(nextPlatform)
          ? buildSocialUrl(nextPlatform, nextHandle)
          : link.url || "",
      });
      return;
    }

    onChange({
      type: nextType,
      platform: "",
      handle: "",
    });
  }

  function handlePlatformChange(nextPlatform) {
    const nextHandle = isHandlePlatform(nextPlatform)
      ? normalizeHandle(link.handle)
      : "";

    onChange({
      platform: nextPlatform,
      handle: nextHandle,
      url: isHandlePlatform(nextPlatform)
        ? buildSocialUrl(nextPlatform, nextHandle)
        : "",
      title: link.title || getPlatformLabel(nextPlatform),
    });
  }

  function handleSocialHandleChange(nextValue) {
    const nextHandle = normalizeHandle(nextValue);

    onChange({
      handle: nextHandle,
      url: buildSocialUrl(currentPlatform, nextHandle),
    });
  }

  return (
    <article className="item-row">
      <div className="item-row__header">
        <strong>{link.title || "Link sem titulo"}</strong>
        <div className="item-row__actions">
          <Button variant="ghost" size="sm" onClick={onMoveUp}>
            Subir
          </Button>
          <Button variant="ghost" size="sm" onClick={onMoveDown}>
            Descer
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Titulo</span>
          <Input
            value={link.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Tipo</span>
          <select
            className="ui-select"
            value={link.type || "link"}
            onChange={(event) => handleTypeChange(event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {isSocial ? (
          <label className="field">
            <span>Plataforma</span>
            <select
              className="ui-select"
              value={currentPlatform}
              onChange={(event) => handlePlatformChange(event.target.value)}
            >
              {socialPlatformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {isSocial && handleBasedPlatform ? (
          <label className="field field--full">
            <span>Perfil (@)</span>
            <Input
              value={link.handle || ""}
              onChange={(event) => handleSocialHandleChange(event.target.value)}
              placeholder="@rafaelvalquer"
            />
            <small className="field__hint">
              URL final: {socialPreviewUrl || "Preencha o @ para montar o link automaticamente."}
            </small>
          </label>
        ) : null}

        {isSocial && !handleBasedPlatform ? (
          <label className="field field--full">
            <span>URL</span>
            <Input
              value={link.url || ""}
              onChange={(event) => onChange("url", event.target.value)}
              placeholder="https://facebook.com/..."
            />
          </label>
        ) : null}

        {!isSocial ? (
          <label className="field field--full">
            <span>URL</span>
            <Input
              value={link.url || ""}
              onChange={(event) => onChange("url", event.target.value)}
              placeholder="https://..."
            />
          </label>
        ) : null}
      </div>

      <div className="item-row__footer">
        <Switch checked={Boolean(link.isActive)} onChange={onToggle} label="Ativo" />
        <Button onClick={onSave}>Salvar link</Button>
      </div>
    </article>
  );
}
