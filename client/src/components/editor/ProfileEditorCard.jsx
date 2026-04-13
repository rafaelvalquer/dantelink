import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import SectionCard from "./SectionCard.jsx";

export default function ProfileEditorCard({
  value,
  onChange,
  onSave,
  isSaving = false,
}) {
  return (
    <SectionCard
      title="Perfil"
      description="Edite as informações principais exibidas no topo da sua página."
      actions={
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar perfil"}
        </Button>
      }
    >
      <div className="form-grid">
        <label className="field">
          <span>Título</span>
          <Input
            value={value.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
            placeholder="Mutantwear"
          />
        </label>

        <label className="field">
          <span>Slug</span>
          <Input
            value={value.slug || ""}
            onChange={(event) => onChange("slug", event.target.value)}
            placeholder="mutantwear"
          />
        </label>

        <label className="field field--full">
          <span>URL do avatar</span>
          <Input
            value={value.avatarUrl || ""}
            onChange={(event) => onChange("avatarUrl", event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="field field--full">
          <span>Bio</span>
          <Textarea
            value={value.bio || ""}
            onChange={(event) => onChange("bio", event.target.value)}
            placeholder="Conte para as pessoas do que se trata a sua página."
          />
        </label>
      </div>
    </SectionCard>
  );
}
