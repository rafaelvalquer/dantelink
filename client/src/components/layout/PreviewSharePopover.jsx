import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, QrCode, Share2, Sparkles, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function buildPublicUrl(slug = "") {
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return "";

  const path = `/${normalizedSlug}`;

  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function formatPublicUrlForDisplay(publicUrl = "") {
  const normalizedUrl = String(publicUrl || "").trim();
  if (!normalizedUrl) return "";

  try {
    const url = new URL(normalizedUrl);
    return `${url.host}${url.pathname}`.replace(/\/$/, "");
  } catch (error) {
    void error;
    return normalizedUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}

export default function PreviewSharePopover({ page }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapperRef = useRef(null);
  const slug = String(page?.slug || "").trim();
  const publicUrl = useMemo(() => buildPublicUrl(slug), [slug]);
  const displayUrl = useMemo(
    () => formatPublicUrlForDisplay(publicUrl || `/${slug}`),
    [publicUrl, slug],
  );
  const isDisabled = !slug || !publicUrl;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return undefined;

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  async function handleCopy() {
    if (!publicUrl || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
  }

  return (
    <div className="editor-preview-share" ref={wrapperRef}>
      <button
        type="button"
        className={cls(
          "editor-preview-share__trigger",
          isDisabled && "is-disabled",
          open && "is-open",
        )}
        onClick={() => {
          if (!isDisabled) {
            setOpen((current) => !current);
          }
        }}
        disabled={isDisabled}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="editor-preview-share__trigger-label">
          {isDisabled ? "Salve a pagina para publicar" : displayUrl}
        </span>
        <span className="editor-preview-share__trigger-icon" aria-hidden="true">
          <Share2 size={18} />
        </span>
      </button>

      {open ? (
        <div className="editor-preview-share__popover" role="dialog" aria-label="Compartilhar pagina">
          <div className="editor-preview-share__popover-header">
            <strong>Compartilhar</strong>
            <button
              type="button"
              className="editor-preview-share__icon-button"
              onClick={() => setOpen(false)}
              aria-label="Fechar compartilhamento"
            >
              <X size={16} />
            </button>
          </div>

          <div className="editor-preview-share__url-card">
            <span className="editor-preview-share__url-icon" aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <span className="editor-preview-share__url-value" title={publicUrl}>
              {displayUrl}
            </span>
            <button
              type="button"
              className={cls(
                "editor-preview-share__copy-button",
                copied && "is-success",
              )}
              onClick={() => void handleCopy()}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>

          <div className="editor-preview-share__qr-card">
            <button
              type="button"
              className="editor-preview-share__icon-button editor-preview-share__icon-button--corner"
              onClick={() => setOpen(false)}
              aria-label="Fechar QR code"
            >
              <X size={16} />
            </button>

            <div className="editor-preview-share__qr-shell">
              <div className="editor-preview-share__qr-frame">
                <QRCodeSVG
                  value={publicUrl}
                  size={132}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#111827"
                />
              </div>
            </div>

            <strong className="editor-preview-share__qr-title">
              Compartilhe sua pagina
            </strong>
            <span className="editor-preview-share__qr-copy">
              Escaneie com o celular
            </span>
            <span className="editor-preview-share__qr-hint">
              <QrCode size={14} />
              QR code da URL publicada
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
