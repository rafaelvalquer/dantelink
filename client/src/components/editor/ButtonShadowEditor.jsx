import { BUTTON_SHADOW_OPTIONS } from "../public/buttonTheme.js";
import ButtonThemePreview from "./ButtonThemePreview.jsx";

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function OptionCard({ selected, title, description, preview, onClick }) {
  return (
    <button
      type="button"
      className={cls("design-option-card", selected ? "is-selected" : "")}
      onClick={onClick}
    >
      <div className="design-option-card__preview">{preview}</div>
      <div className="design-option-card__body">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </button>
  );
}

export default function ButtonShadowEditor({
  design,
  previewLinks = [],
  onChange,
  getOptionTheme,
}) {
  return (
    <div className="design-editor__group">
      <div className="design-editor__group-label">Button shadow</div>
      <div className="design-options-grid is-4">
        {BUTTON_SHADOW_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            selected={design.buttonShadow === option.value}
            title={option.label}
            description={option.description}
            onClick={() => onChange(option.value)}
            preview={
              <ButtonThemePreview
                theme={getOptionTheme("buttonShadow", option.value)}
                links={previewLinks}
                className="design-button-preview--shadow"
              />
            }
          />
        ))}
      </div>
    </div>
  );
}
