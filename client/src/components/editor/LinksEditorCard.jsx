import Button from "../ui/Button.jsx";
import SectionCard from "./SectionCard.jsx";
import LinkItemRow from "./LinkItemRowV2.jsx";

export default function LinksEditorCard({
  links,
  onAdd,
  onChange,
  onSave,
  onDelete,
  onToggle,
  onMove,
}) {
  return (
    <SectionCard
      title="Links"
      description="Gerencie as ações principais exibidas na sua página."
      actions={<Button onClick={onAdd}>Adicionar link</Button>}
    >
      <div className="stack">
        {links.length ? (
          links.map((link, index) => (
            <LinkItemRow
              key={link.id}
              link={link}
              onChange={(field, value) => onChange(link.id, field, value)}
              onSave={() => onSave(link.id)}
              onDelete={() => onDelete(link.id)}
              onToggle={() => onToggle(link.id)}
              onMoveUp={() => onMove(link.id, -1)}
              onMoveDown={() => onMove(link.id, 1)}
            />
          ))
        ) : (
          <div className="empty-state">Crie seu primeiro link para começar a preencher a página.</div>
        )}
      </div>
    </SectionCard>
  );
}
