import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import SectionCard from "./SectionCard.jsx";

const buttonStyles = [
  { value: "rounded-soft", label: "Arredondado suave" },
  { value: "rounded-full", label: "Arredondado total" },
  { value: "square-soft", label: "Quadrado suave" },
];

export default function DesignEditorCard({
  value,
  onChange,
  onSave,
  isSaving = false,
}) {
  return (
    <SectionCard
      title="Tema"
      description="Ajuste a identidade visual da página pública."
      actions={
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar tema"}
        </Button>
      }
    >
      <div className="form-grid">
        <label className="field">
          <span>Cor de fundo</span>
          <Input
            type="color"
            value={value.backgroundColor || "#c4b5fd"}
            onChange={(event) => onChange("backgroundColor", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Cor dos cards</span>
          <Input
            type="color"
            value={value.cardColor || "#f8fafc"}
            onChange={(event) => onChange("cardColor", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Cor do texto</span>
          <Input
            type="color"
            value={value.textColor || "#111827"}
            onChange={(event) => onChange("textColor", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Estilo do botão</span>
          <select
            className="ui-select"
            value={value.buttonStyle || "rounded-soft"}
            onChange={(event) => onChange("buttonStyle", event.target.value)}
          >
            {buttonStyles.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </SectionCard>
  );
}
