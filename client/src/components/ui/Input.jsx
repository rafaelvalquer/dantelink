export default function Input({ className = "", ...props }) {
  return <input className={["ui-input", className].filter(Boolean).join(" ")} {...props} />;
}
