export default function Switch({
  checked = false,
  onChange,
  label,
  className = "",
  ariaLabel,
  disabled = false,
}) {
  return (
    <label className={["ui-switch", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        className={`ui-switch__track ${checked ? "is-on" : ""}`}
        onClick={() => {
          if (disabled) return;
          onChange?.(!checked);
        }}
        disabled={disabled}
      >
        <span className="ui-switch__thumb" />
      </button>
      {label ? <span className="ui-switch__label">{label}</span> : null}
    </label>
  );
}
