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
  function handleRowChange(linkId, fieldOrPatch, value) {
    if (fieldOrPatch && typeof fieldOrPatch === "object") {
      onChange(linkId, fieldOrPatch);
      return;
    }

    onChange(linkId, fieldOrPatch, value);
  }

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
              onChange={(fieldOrPatch, value) =>
                handleRowChange(link.id, fieldOrPatch, value)
              }
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
