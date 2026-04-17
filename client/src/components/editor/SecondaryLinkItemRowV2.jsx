import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

const platformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "site", label: "Site" },
];

function normalizeHandle(value) {
  return String(value || "").trim().replace(/^@+/, "").replace(/\s+/g, "");
}

function isHandlePlatform(platform) {
  return platform === "instagram" || platform === "youtube" || platform === "tiktok";
}

function getPlatformLabel(platform) {
  return (
    platformOptions.find((option) => option.value === platform)?.label || "Site"
  );
}

function buildSecondaryUrl(platform, handle, fallbackUrl = "") {
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

  return String(fallbackUrl || "").trim();
}

export default function SecondaryLinkItemRowV2({
  link,
  onChange,
  onSave,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}) {
  const currentPlatform = link.platform || "instagram";
  const usesHandle = isHandlePlatform(currentPlatform);
  const previewUrl = usesHandle
    ? buildSecondaryUrl(currentPlatform, link.handle)
    : String(link.url || "").trim();

  function handlePlatformChange(nextPlatform) {
    const nextUsesHandle = isHandlePlatform(nextPlatform);
    const nextHandle = nextUsesHandle ? normalizeHandle(link.handle) : "";

    onChange({
      platform: nextPlatform,
      title: link.title || getPlatformLabel(nextPlatform),
      handle: nextHandle,
      url: nextUsesHandle
        ? buildSecondaryUrl(nextPlatform, nextHandle)
        : link.url || "",
    });
  }

  function handleProfileChange(nextValue) {
    const nextHandle = normalizeHandle(nextValue);

    onChange({
      handle: nextHandle,
      url: buildSecondaryUrl(currentPlatform, nextHandle),
    });
  }

  return (
    <article className="item-row">
      <div className="item-row__header">
        <strong>{link.title || getPlatformLabel(currentPlatform)}</strong>
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
          <span>Plataforma</span>
          <select
            className="ui-select"
            value={currentPlatform}
            onChange={(event) => handlePlatformChange(event.target.value)}
          >
            {platformOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Rotulo</span>
          <Input
            value={link.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </label>

        {usesHandle ? (
          <label className="field field--full">
            <span>Perfil</span>
            <Input
              value={link.handle || ""}
              onChange={(event) => handleProfileChange(event.target.value)}
              placeholder="@perfil"
            />
            <small className="field__hint">
              URL final: {previewUrl || "Preencha o perfil para montar o link automaticamente."}
            </small>
          </label>
        ) : (
          <label className="field field--full">
            <span>URL</span>
            <Input
              value={link.url || ""}
              onChange={(event) => onChange("url", event.target.value)}
              placeholder="https://..."
            />
          </label>
        )}
      </div>

      <div className="item-row__footer">
        <Switch checked={Boolean(link.isActive)} onChange={onToggle} label="Ativo" />
        <Button onClick={onSave}>Salvar link</Button>
      </div>
    </article>
  );
}
