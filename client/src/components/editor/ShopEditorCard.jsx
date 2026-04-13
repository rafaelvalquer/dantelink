import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Textarea from "../ui/Textarea.jsx";
import Switch from "../ui/Switch.jsx";
import SectionCard from "./SectionCard.jsx";

export default function ShopEditorCard({
  value,
  onChange,
  onSave,
  isSaving = false,
}) {
  return (
    <SectionCard
      title="Bloco da loja"
      description="Use este bloco para direcionar as pessoas para sua vitrine."
      actions={
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar loja"}
        </Button>
      }
    >
      <div className="form-grid">
        <label className="field field--full">
          <span>Título</span>
          <Input
            value={value.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </label>

        <label className="field field--full">
          <span>Descrição</span>
          <Textarea
            value={value.description || ""}
            onChange={(event) => onChange("description", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Quantidade de produtos</span>
          <Input
            type="number"
            min="0"
            value={value.productsCount ?? 0}
            onChange={(event) => onChange("productsCount", Number(event.target.value))}
          />
        </label>
      </div>

      <div className="item-row__footer">
        <Switch checked={Boolean(value.isActive)} onChange={(checked) => onChange("isActive", checked)} label="Ativo" />
      </div>
    </SectionCard>
  );
}
