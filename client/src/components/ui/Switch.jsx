export default function Switch({
  checked = false,
  onChange,
  label,
  className = "",
}) {
  return (
    <label className={["ui-switch", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`ui-switch__track ${checked ? "is-on" : ""}`}
        onClick={() => onChange?.(!checked)}
      >
        <span className="ui-switch__thumb" />
      </button>
      {label ? <span className="ui-switch__label">{label}</span> : null}
    </label>
  );
}
