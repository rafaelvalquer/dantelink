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
  eyebrow = "Editor DandeLink",
  headerActions = null,
  previewEyebrow = null,
  previewTitle = null,
}) {
  const sidebarPage = publishedPage || page;
  const hasPreviewHeader = Boolean(previewEyebrow || previewTitle);

  return (
    <div className="editor-shell">
      <header className="editor-shell__topbar">
        <div className="editor-shell__topbar-brand">
          <span className="editor-shell__topbar-mark" aria-hidden="true">
            D
          </span>
          <div className="editor-shell__topbar-copy">
            <strong>DandeLink admin</strong>
          </div>
        </div>

        <div className="editor-shell__topbar-meta">
          {sidebarPage?.slug ? (
            <span className="editor-shell__topbar-slug">/{sidebarPage.slug}</span>
          ) : null}
        </div>
      </header>

      <div className="editor-shell__layout">
        <Sidebar page={sidebarPage} />

        <main className="editor-shell__main">
          <header className="editor-shell__header">
            <div className="editor-shell__heading">
              {eyebrow ? <span className="editor-shell__eyebrow">{eyebrow}</span> : null}
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>

            <div className="editor-shell__header-side">
              {headerActions ? (
                <div className="editor-shell__header-actions">{headerActions}</div>
              ) : null}
              {notice || error ? (
                <div className="editor-shell__status">
                  {notice ? <div className="editor-shell__notice">{notice}</div> : null}
                  {error ? <div className="editor-shell__error">{error}</div> : null}
                </div>
              ) : null}
            </div>
          </header>

          <div className="editor-shell__content">{children}</div>
        </main>

        <aside className="editor-shell__preview">
          <div className="editor-shell__preview-top">
            {hasPreviewHeader ? (
              <div className="editor-shell__preview-header">
                {previewEyebrow ? <span>{previewEyebrow}</span> : null}
                {previewTitle ? <strong>{previewTitle}</strong> : null}
              </div>
            ) : null}
            <PreviewSharePopover page={publishedPage} />
          </div>

          <div className="editor-shell__preview-stage">
            <div className="editor-shell__preview-frame">
              <PhonePreview page={page} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
