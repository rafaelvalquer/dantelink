import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

const typeOptions = [
  { value: "link", label: "Link" },
  { value: "social", label: "Rede social" },
  { value: "shop-preview", label: "Prévia da loja" },
];

export default function LinkItemRow({
  link,
  onChange,
  onSave,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}) {
  return (
    <article className="item-row">
      <div className="item-row__header">
        <strong>{link.title || "Link sem título"}</strong>
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
          <span>Título</span>
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
            onChange={(event) => onChange("type", event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field field--full">
          <span>URL</span>
          <Input
            value={link.url || ""}
            onChange={(event) => onChange("url", event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="field">
          <span>Ícone</span>
          <Input
            value={link.icon || ""}
            onChange={(event) => onChange("icon", event.target.value)}
            placeholder="Opcional"
          />
        </label>

        <label className="field">
          <span>Miniatura</span>
          <Input
            value={link.thumbnail || ""}
            onChange={(event) => onChange("thumbnail", event.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>

      <div className="item-row__footer">
        <Switch checked={Boolean(link.isActive)} onChange={onToggle} label="Ativo" />
        <Button onClick={onSave}>Salvar link</Button>
      </div>
    </article>
  );
}
