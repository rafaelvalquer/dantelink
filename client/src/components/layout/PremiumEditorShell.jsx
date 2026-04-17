import { Sparkles } from "lucide-react";
import PhonePreview from "../preview/PhonePreview.jsx";
import PremiumSidebar from "./PremiumSidebar.jsx";

function StatusAlert({ tone = "notice", children }) {
  const styles =
    tone === "error"
      ? "border-[#5B1E2C] bg-[#221421] text-[#FFC7D1]"
      : "border-[#2B2754] bg-[#151834] text-[#D9DBE8]";

  return (
    <div className={`rounded-[24px] border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export default function PremiumEditorShell({
  title,
  description,
  page,
  children,
  notice,
  error,
  headerActions = null,
  previewEyebrow = "Preview ao vivo",
  previewTitle = "Pagina publica",
}) {
  return (
    <div className="min-h-screen bg-[#0D0E17] text-[#F6F7FB]">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-6 px-4 py-4 sm:px-6 xl:flex-row xl:items-start">
        <PremiumSidebar />

        <main className="min-w-0 flex-1">
          <div className="sticky top-4 z-20 mb-5">
            <header className="rounded-[32px] border border-white/10 bg-[#0D0E17]/90 px-5 py-5 shadow-[0_24px_65px_-38px_rgba(0,0,0,0.82)] backdrop-blur-sm sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A9AEC7]">
                    <Sparkles size={12} />
                    Editor DandeLink
                  </div>
                  <div className="grid gap-2">
                    <h1 className="text-3xl font-semibold tracking-[-0.05em] text-[#F6F7FB] sm:text-[2.1rem]">
                      {title}
                    </h1>
                    {description ? (
                      <p className="max-w-3xl text-sm leading-6 text-[#A9AEC7] sm:text-[15px]">
                        {description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#23284A] bg-[#111327] px-4 py-2 text-sm text-[#D9DBE8]">
                    <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
                    Live preview
                  </div>
                  {headerActions}
                </div>
              </div>
            </header>
          </div>

          {notice || error ? (
            <div className="mb-5 grid gap-3">
              {notice ? <StatusAlert>{notice}</StatusAlert> : null}
              {error ? <StatusAlert tone="error">{error}</StatusAlert> : null}
            </div>
          ) : null}

          <div className="grid gap-6">{children}</div>
        </main>

        <aside className="w-full shrink-0 xl:w-[360px] 2xl:w-[392px]">
          <div className="rounded-[32px] border border-white/10 bg-[#111327] p-5 shadow-[0_30px_80px_-42px_rgba(0,0,0,0.8)] xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A9AEC7]">
                  {previewEyebrow}
                </span>
                <strong className="text-base font-semibold tracking-[-0.03em] text-white">
                  {previewTitle}
                </strong>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-[#D9DBE8]">
                Mobile
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#0D0E17] p-3">
              <PhonePreview page={page} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
