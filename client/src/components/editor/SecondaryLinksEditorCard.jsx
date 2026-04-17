import Button from "../ui/Button.jsx";
import SectionCard from "./SectionCard.jsx";
import SecondaryLinkItemRowV2 from "./SecondaryLinkItemRowV2.jsx";

export default function SecondaryLinksEditorCard({
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
      title="Links secundarios"
      description="Adicione suas redes sociais ou links complementares."
      actions={<Button onClick={onAdd}>Adicionar link</Button>}
    >
      <div className="stack">
        {links.length ? (
          links.map((link) => (
            <SecondaryLinkItemRowV2
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
          <div className="empty-state">
            Adicione suas redes sociais ou links complementares para preencher esta area.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
