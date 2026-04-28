import { useId, useMemo, useState } from "react";
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
import Input from "../ui/Input.jsx";
import SectionCard from "./SectionCard.jsx";
import SecondaryLinkItemRowV2 from "./SecondaryLinkItemRowV2.jsx";

const LINK_STATUS_FILTER_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
];

function normalizeSecondarySearchValue(link = {}) {
  return [link.title, link.handle, link.url, link.platform]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesStatusFilter(link = {}, filter = "todos") {
  if (filter === "ativos") {
    return link.isActive !== false;
  }

  if (filter === "inativos") {
    return link.isActive === false;
  }

  return true;
}

function mergeFilteredReorder(allIds = [], visibleIds = [], nextVisibleIds = []) {
  const visibleQueue = nextVisibleIds.map((itemId) => String(itemId));
  const visibleSet = new Set(visibleIds.map((itemId) => String(itemId)));

  return allIds.map((itemId) => {
    const normalizedId = String(itemId);
    return visibleSet.has(normalizedId) ? visibleQueue.shift() : normalizedId;
  });
}

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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [liveMessage, setLiveMessage] = useState("");
  const searchFieldId = useId();
  const statusFieldId = useId();
  const dragDescriptionId = useId();
  const linkIds = useMemo(() => links.map((link) => link.id), [links]);
  const filteredLinks = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return links.filter((link) => {
      const matchesQuery = !normalizedQuery
        || normalizeSecondarySearchValue(link).includes(normalizedQuery);

      return matchesQuery && matchesStatusFilter(link, statusFilter);
    });
  }, [links, query, statusFilter]);
  const filteredLinkIds = useMemo(
    () => filteredLinks.map((link) => link.id),
    [filteredLinks],
  );
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

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!active?.id || !over?.id || active.id === over.id) {
      return;
    }

    const oldIndex = filteredLinkIds.indexOf(active.id);
    const newIndex = filteredLinkIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    const nextVisibleIds = arrayMove(filteredLinkIds, oldIndex, newIndex);
    const nextIds =
      filteredLinkIds.length === linkIds.length
        ? nextVisibleIds
        : mergeFilteredReorder(linkIds, filteredLinkIds, nextVisibleIds);

    await onReorder(nextIds);
    setLiveMessage("Ordem dos links secundários atualizada.");
  }

  return (
    <SectionCard
      title="Links secundários"
      description="Adicione suas redes sociais ou links complementares."
      actions={
        <div className="editor-list-toolbar">
          <label className="editor-list-toolbar__field" htmlFor={searchFieldId}>
            <span className="sr-only">Buscar links secundários</span>
            <Input
              id={searchFieldId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por rótulo, rede ou URL"
              aria-label="Buscar links secundários"
            />
          </label>

          <label
            className="editor-list-toolbar__field editor-list-toolbar__field--compact"
            htmlFor={statusFieldId}
          >
            <span className="sr-only">Filtrar links secundários por status</span>
            <select
              id={statusFieldId}
              className="ui-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar links secundários por status"
            >
              {LINK_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <Button onClick={onAdd}>Adicionar link</Button>
        </div>
      }
      isOverlayActive={Boolean(openMenuLinkId)}
    >
      <div className="editor-list-toolbar__meta">
        <span>
          Mostrando {filteredLinks.length} de {links.length} links secundários.
        </span>
        <span id={dragDescriptionId}>
          Arraste pelo ícone lateral para reordenar. Também funciona com teclado.
        </span>
      </div>

      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      {filteredLinks.length ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            void handleDragEnd(event);
          }}
        >
          <SortableContext items={filteredLinkIds} strategy={verticalListSortingStrategy}>
            <div className="stack">
              {filteredLinks.map((link) => (
                <SecondaryLinkItemRowV2
                  key={link.id}
                  link={link}
                  onCommit={(payload) => onCommit(link.id, payload)}
                  onDelete={() => onDelete(link.id)}
                  onToggle={() => onToggle(link.id)}
                  isHighlighted={String(highlightedId) === String(link.id)}
                  dragDescriptionId={dragDescriptionId}
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
          {links.length
            ? "Nenhum link secundário encontrado com os filtros atuais."
            : "Adicione suas redes sociais ou links complementares para preencher esta área."}
        </div>
      )}
    </SectionCard>
  );
}
