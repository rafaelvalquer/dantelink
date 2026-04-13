import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

function CollectionItemRow({
  item,
  onChange,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  return (
    <div className="subitem-row">
      <div className="form-grid">
        <label className="field">
          <span>Título do item</span>
          <Input
            value={item.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </label>

        <label className="field">
          <span>URL do item</span>
          <Input
            value={item.url || ""}
            onChange={(event) => onChange("url", event.target.value)}
            placeholder="https://..."
          />
        </label>
      </div>

      <div className="item-row__footer">
        <Switch checked={Boolean(item.isActive)} onChange={(checked) => onChange("isActive", checked)} label="Ativo" />
        <div className="item-row__actions">
          <Button variant="ghost" size="sm" onClick={onMoveUp}>
            Subir
          </Button>
          <Button variant="ghost" size="sm" onClick={onMoveDown}>
            Descer
          </Button>
          <Button variant="secondary" size="sm" onClick={onSave}>
            Salvar item
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionCard({
  collection,
  onChange,
  onSave,
  onDelete,
  onToggle,
  onMove,
  onAddItem,
  onItemChange,
  onItemSave,
  onItemDelete,
  onItemMove,
}) {
  return (
    <article className="item-row item-row--collection">
      <div className="item-row__header">
        <strong>{collection.title || "Coleção sem título"}</strong>
        <div className="item-row__actions">
          <Button variant="ghost" size="sm" onClick={() => onMove(-1)}>
            Subir
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMove(1)}>
            Descer
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="form-grid">
        <label className="field field--full">
          <span>Título da coleção</span>
          <Input
            value={collection.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </label>
      </div>

      <div className="item-row__footer">
        <Switch checked={Boolean(collection.isActive)} onChange={onToggle} label="Ativa" />
        <div className="item-row__actions">
          <Button variant="secondary" size="sm" onClick={onAddItem}>
            Adicionar item
          </Button>
          <Button size="sm" onClick={onSave}>
            Salvar coleção
          </Button>
        </div>
      </div>

      <div className="stack stack--tight">
        {collection.items?.length ? (
          collection.items.map((item) => (
            <CollectionItemRow
              key={item.id}
              item={item}
              onChange={(field, value) => onItemChange(item.id, field, value)}
              onSave={() => onItemSave(item.id)}
              onDelete={() => onItemDelete(item.id)}
              onMoveUp={() => onItemMove(item.id, -1)}
              onMoveDown={() => onItemMove(item.id, 1)}
            />
          ))
        ) : (
          <div className="empty-state empty-state--soft">
            Esta coleção está vazia. Adicione itens para exibir links agrupados.
          </div>
        )}
      </div>
    </article>
  );
}
