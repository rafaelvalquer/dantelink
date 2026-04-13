import Button from "../ui/Button.jsx";
import SectionCard from "./SectionCard.jsx";
import CollectionCard from "./CollectionCard.jsx";

export default function CollectionsEditorCard({
  collections,
  onAdd,
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
    <SectionCard
      title="Coleções"
      description="Agrupe links relacionados em blocos de conteúdo."
      actions={<Button onClick={onAdd}>Adicionar coleção</Button>}
    >
      <div className="stack">
        {collections.length ? (
          collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onChange={(field, value) => onChange(collection.id, field, value)}
              onSave={() => onSave(collection.id)}
              onDelete={() => onDelete(collection.id)}
              onToggle={() => onToggle(collection.id)}
              onMove={(direction) => onMove(collection.id, direction)}
              onAddItem={() => onAddItem(collection.id)}
              onItemChange={(itemId, field, value) =>
                onItemChange(collection.id, itemId, field, value)
              }
              onItemSave={(itemId) => onItemSave(collection.id, itemId)}
              onItemDelete={(itemId) => onItemDelete(collection.id, itemId)}
              onItemMove={(itemId, direction) =>
                onItemMove(collection.id, itemId, direction)
              }
            />
          ))
        ) : (
          <div className="empty-state">Crie uma coleção para agrupar destinos relacionados.</div>
        )}
      </div>
    </SectionCard>
  );
}
