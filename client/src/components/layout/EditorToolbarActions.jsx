import Button from "../ui/Button.jsx";

function formatLastSavedAt(value) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function getStatusMeta(saveStatus, lastSavedAt) {
  switch (saveStatus) {
    case "dirty":
      return {
        tone: "is-dirty",
        label: "Alterações não salvas",
      };
    case "saving":
      return {
        tone: "is-saving",
        label: "Salvando...",
      };
    case "saved":
      return {
        tone: "is-saved",
        label: lastSavedAt
          ? `Salvo às ${formatLastSavedAt(lastSavedAt)}`
          : "Salvo",
      };
    case "error":
      return {
        tone: "is-error",
        label: "Falha ao salvar",
      };
    case "idle":
    default:
      return {
        tone: "is-idle",
        label: "Tudo certo",
      };
  }
}

export default function EditorToolbarActions({
  saveStatus = "idle",
  lastSavedAt = null,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSave,
  saveLabel = "Salvar",
  disableSave = false,
}) {
  const statusMeta = getStatusMeta(saveStatus, lastSavedAt);

  return (
    <div className="editor-toolbar-actions">
      <div
        className={`editor-toolbar-actions__status ${statusMeta.tone}`}
        role="status"
        aria-live="polite"
      >
        <span>{statusMeta.label}</span>
      </div>

      {onUndo ? (
        <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
          Desfazer
        </Button>
      ) : null}

      {onRedo ? (
        <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
          Refazer
        </Button>
      ) : null}

      {onSave ? (
        <Button
          size="sm"
          onClick={onSave}
          disabled={disableSave || saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "Salvando..." : saveLabel}
        </Button>
      ) : null}
    </div>
  );
}
