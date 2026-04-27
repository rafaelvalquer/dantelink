import Sidebar from "./Sidebar.jsx";
import PhonePreview from "../preview/PhonePreview.jsx";
import PreviewSharePopover from "./PreviewSharePopover.jsx";

export default function EditorShell({
  title,
  description,
  page,
  publishedPage = page,
  children,
  notice,
  error,
}) {
  return (
    <div className="editor-shell">
      <Sidebar />

      <main className="editor-shell__main">
        <header className="editor-shell__header">
          <div className="editor-shell__heading">
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>

          {notice || error ? (
            <div className="editor-shell__status">
              {notice ? <div className="editor-shell__notice">{notice}</div> : null}
              {error ? <div className="editor-shell__error">{error}</div> : null}
            </div>
          ) : null}
        </header>

        <div className="editor-shell__content">{children}</div>
      </main>

      <aside className="editor-shell__preview">
        <PreviewSharePopover page={publishedPage} />
        <div className="editor-shell__preview-header">
          <span>Preview ao vivo</span>
          <strong>Página pública</strong>
        </div>
        <PhonePreview page={page} />
      </aside>
    </div>
  );
}
