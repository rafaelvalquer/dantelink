import Sidebar from "./Sidebar.jsx";
import PhonePreview from "../preview/PhonePreview.jsx";

export default function EditorShell({
  title,
  description,
  page,
  children,
  notice,
  error,
}) {
  return (
    <div className="editor-shell">
      <Sidebar />

      <main className="editor-shell__main">
        <header className="editor-shell__header">
          <div>
            <span className="editor-shell__eyebrow">Administração</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          {notice ? <div className="editor-shell__notice">{notice}</div> : null}
          {error ? <div className="editor-shell__error">{error}</div> : null}
        </header>

        <div className="editor-shell__content">{children}</div>
      </main>

      <aside className="editor-shell__preview">
        <div className="editor-shell__preview-header">
          <span>Preview ao vivo</span>
          <strong>Experiência pública no celular</strong>
        </div>
        <PhonePreview page={page} />
      </aside>
    </div>
  );
}
