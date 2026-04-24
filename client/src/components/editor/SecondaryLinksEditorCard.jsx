import { useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Button from "../ui/Button.jsx";
import SectionCard from "./SectionCard.jsx";
import SecondaryLinkItemRowV2 from "./SecondaryLinkItemRowV2.jsx";

export default function SecondaryLinksEditorCard({
  links,
  onAdd,
  onCommit,
  onDelete,
  onToggle,
  onReorder,
  highlightedId = "",
}) {
  const [openMenuLinkId, setOpenMenuLinkId] = useState(null);
  const linkIds = useMemo(() => links.map((link) => link.id), [links]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!active?.id || !over?.id || active.id === over.id) {
      return;
    }

    const oldIndex = linkIds.indexOf(active.id);
    const newIndex = linkIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    onReorder(arrayMove(linkIds, oldIndex, newIndex));
  }

  return (
    <SectionCard
      title="Links secundarios"
      description="Adicione suas redes sociais ou links complementares."
      actions={<Button onClick={onAdd}>Adicionar link</Button>}
      isOverlayActive={Boolean(openMenuLinkId)}
    >
      {links.length ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={linkIds} strategy={verticalListSortingStrategy}>
            <div className="stack">
              {links.map((link) => (
                <SecondaryLinkItemRowV2
                  key={link.id}
                  link={link}
                  onCommit={(payload) => onCommit(link.id, payload)}
                  onDelete={() => onDelete(link.id)}
                  onToggle={() => onToggle(link.id)}
                  isHighlighted={String(highlightedId) === String(link.id)}
                  onMenuOpenChange={(open) => {
                    setOpenMenuLinkId((current) =>
                      open ? link.id : current === link.id ? null : current,
                    );
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="empty-state">
          Adicione suas redes sociais ou links complementares para preencher esta area.
        </div>
      )}
    </SectionCard>
  );
}
