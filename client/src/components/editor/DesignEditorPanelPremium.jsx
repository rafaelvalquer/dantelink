import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Layers3,
  Palette,
  RectangleHorizontal,
  Share2,
  Sparkles,
  SquareStack,
  SwatchBook,
  Type,
} from "lucide-react";
import Input from "../ui/Input.jsx";
import { PublicPageMiniPreview } from "../public/PublicPageUi.jsx";
import {
  MY_PAGE_ANIMATION_PRESET_OPTIONS,
  MY_PAGE_BACKGROUND_GRADIENT_DIRECTION_OPTIONS,
  MY_PAGE_BACKGROUND_PATTERN_VARIANT_OPTIONS,
  MY_PAGE_BACKGROUND_STYLE_OPTIONS,
  MY_PAGE_BRAND_LAYOUT_OPTIONS,
  MY_PAGE_BUTTON_RADIUS_OPTIONS,
  MY_PAGE_BUTTON_SHADOW_OPTIONS,
  MY_PAGE_BUTTON_STYLE_OPTIONS,
  MY_PAGE_FONT_PRESET_OPTIONS,
  MY_PAGE_PRIMARY_BUTTON_LAYOUT_OPTIONS,
  MY_PAGE_SECONDARY_LINK_ALIGN_OPTIONS,
  MY_PAGE_SECONDARY_LINK_ICON_LAYOUT_OPTIONS,
  MY_PAGE_SECONDARY_LINK_SIZE_OPTIONS,
  MY_PAGE_SECONDARY_LINK_STYLE_OPTIONS,
  MY_PAGE_SURFACE_PATTERN_VARIANT_OPTIONS,
  MY_PAGE_SURFACE_STYLE_OPTIONS,
  MY_PAGE_THEME_PRESET_OPTIONS,
  createMyPageThemePreviewPage,
  getMyPagePreviewPrimaryLinks,
  getMyPagePreviewSocialLinks,
  getMyPageThemePresetValues,
  getMyPageTheme,
} from "../public/myPageTheme.js";

const DESIGN_CATEGORIES = [
  {
    id: "marca",
    label: "Marca",
    title: "Avatar ou Hero",
    description: "Use a mesma imagem da pagina como avatar ou como fundo.",
    Icon: Image,
  },
  {
    id: "tema",
    label: "Tema",
    title: "Escolha um preset",
    description:
      "O tema aplica um ponto de partida completo para cor, fundo, fonte e botoes.",
    Icon: SwatchBook,
  },
  {
    id: "fundo",
    label: "Fundo",
    title: "Escolha o estilo do fundo",
    description: "Defina o estilo, a direcao e a textura do fundo.",
    Icon: Layers3,
  },
  {
    id: "superficie",
    label: "Superficie",
    title: "Container da frente",
    description: "Controle a camada onde ficam logo, titulos, botoes e formularios.",
    Icon: SquareStack,
  },
  {
    id: "fonte",
    label: "Fonte",
    title: "Escolha a tipografia",
    description: "A fonte vale para pagina, catalogo, formulario e pagamento.",
    Icon: Type,
  },
  {
    id: "botao",
    label: "Botao",
    title: "Acabamento, forma e hierarquia",
    description: "Defina o peso visual dos CTAs sem mudar a logica da pagina.",
    Icon: RectangleHorizontal,
  },
  {
    id: "redes",
    label: "Redes",
    title: "Links secundarios",
    description: "Controle conteudo, tamanho e alinhamento das redes na home.",
    Icon: Share2,
  },
  {
    id: "animacao",
    label: "Animacao",
    title: "Movimento no publico",
    description: "Escolha o ritmo visual de entrada da pagina publica.",
    Icon: Sparkles,
  },
  {
    id: "cor",
    label: "Cor",
    title: "Ajuste cada cor do publico",
    description: "Controle fundo, botoes e textos com liberdade total em cima do tema.",
    Icon: Palette,
  },
];

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function normalizeColor(value, fallback) {
  const sample = String(value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(sample)) return sample.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(sample)) return `#${sample.toLowerCase()}`;
  return fallback;
}

function OptionGrid({ columns = "3", children }) {
  const gridClassName = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 2xl:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5",
  }[Number(columns)] || "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3";

  return <div className={cls("grid gap-4", gridClassName)}>{children}</div>;
}

function OptionCard({ selected, title, description, preview, onClick }) {
  return (
    <button
      type="button"
      className={cls(
        "group grid gap-4 rounded-[28px] border p-4 text-left transition duration-200",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A78BFA]/30",
        selected
          ? "border-[#8E67F3] bg-[#F2EDFF] shadow-[0_24px_50px_-28px_rgba(124,58,237,0.45)]"
          : "border-[#E5E8F5] bg-white hover:border-[#CFC6FF] hover:bg-[#FAF8FF]",
      )}
      onClick={onClick}
    >
      <div className="overflow-hidden rounded-[24px] border border-[#DDE1F2] bg-[#111327] p-3">
        {preview}
      </div>
      <div className="grid gap-1.5">
        <strong className="text-base font-semibold tracking-[-0.03em] text-[#171A2F]">
          {title}
        </strong>
        <span className="text-sm leading-6 text-[#6B7394]">{description}</span>
      </div>
    </button>
  );
}

function ChoiceButtons({ value, options, onChange }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cls(
            "rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A78BFA]/30",
            value === option.value
              ? "border-[#8E67F3] bg-[#EEE9FF] text-[#5B21B6]"
              : "border-[#DCE1F1] bg-white text-[#303653] hover:border-[#CFC6FF] hover:bg-[#FAF8FF]",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ColorRow({ label, value, fallback, onChange }) {
  const [draft, setDraft] = useState(value || fallback);

  useEffect(() => {
    setDraft(value || fallback);
  }, [value, fallback]);

  function commit(nextValue) {
    const normalized = normalizeColor(nextValue, fallback);
    setDraft(normalized);
    onChange(normalized);
  }

  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-[#E3E7F4] bg-white p-4 md:flex-row md:items-center md:justify-between">
      <label className="text-sm font-semibold text-[#2B3150]">{label}</label>
      <div className="flex items-center gap-3">
        <Input
          className="min-w-[140px]"
          type="text"
          value={draft}
          maxLength={7}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
            }
          }}
        />
        <input
          className="h-12 w-12 cursor-pointer rounded-2xl border border-[#D9DDEF] bg-white p-1"
          type="color"
          value={normalizeColor(value, fallback)}
          onChange={(event) => commit(event.target.value)}
        />
      </div>
    </div>
  );
}

function DesignOptionPreview({
  page,
  theme,
  primaryLinks = [],
  socialLinks = [],
  eyebrow,
  description,
  showButtons = true,
  showSocial = false,
  buttonCount = 2,
  socialCount = 3,
}) {
  return (
    <PublicPageMiniPreview
      page={page}
      theme={theme}
      primaryLinks={primaryLinks}
      socialLinks={socialLinks}
      eyebrow={eyebrow}
      description={description}
      showButtons={showButtons}
      showSocial={showSocial}
      buttonCount={buttonCount}
      socialCount={socialCount}
    />
  );
}

function BrandPreview({ page, theme, mode, primaryLinks }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      primaryLinks={primaryLinks}
      eyebrow="Avatar ou Hero"
      description={mode === "hero" ? "Imagem destacada com sobreposicao." : "Avatar e copy em foco."}
      showButtons={false}
      showSocial={false}
    />
  );
}

function ThemePreview({ page, theme, option, primaryLinks, socialLinks }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      primaryLinks={primaryLinks}
      socialLinks={socialLinks}
      eyebrow={option?.previewLabel || option?.label || "Tema"}
      description={option?.description || "Preset visual para a pagina publica."}
      showButtons
      showSocial
      buttonCount={1}
      socialCount={2}
    />
  );
}

function BackgroundPreview({ page, theme, primaryLinks }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      primaryLinks={primaryLinks}
      eyebrow="Fundo"
      description="Visual do pano de fundo com a nova composicao publica."
      buttonCount={1}
    />
  );
}

function SurfacePreview({ page, theme, primaryLinks }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      primaryLinks={primaryLinks}
      eyebrow="Superficie"
      description="Camada frontal onde vivem hero, CTAs e blocos."
      buttonCount={1}
    />
  );
}

function FontPreview({ page, theme }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      eyebrow="Tipografia"
      description="Hierarquia de titulo e texto aplicada na home."
      showButtons={false}
      showSocial={false}
    />
  );
}

function ButtonPreview({ page, theme, links }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      primaryLinks={links}
      eyebrow="CTAs"
      description="Peso visual e ritmo dos botoes principais."
      showButtons
      showSocial={false}
      buttonCount={2}
    />
  );
}

function SocialPreview({ page, theme, links }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      socialLinks={links}
      eyebrow="Redes"
      description="Bloco social reaproveitando os mesmos componentes da home."
      showButtons={false}
      showSocial
      socialCount={3}
    />
  );
}

function AnimationPreview({ page, theme, links, socialLinks }) {
  return (
    <DesignOptionPreview
      page={page}
      theme={theme}
      primaryLinks={links}
      socialLinks={socialLinks}
      eyebrow="Animacao"
      description="Entrada e composicao geral da pagina publica."
      showButtons
      showSocial
      buttonCount={1}
      socialCount={2}
    />
  );
}

function DesignCategoryNav({ activeId, onSelect }) {
  return (
    <>
      <aside
        className="hidden rounded-[30px] border border-white/10 bg-[#111327] p-4 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.72)] xl:block xl:sticky xl:top-[6.5rem]"
        aria-label="Subcategorias de design"
      >
        <div className="mb-4 grid gap-2 border-b border-white/8 pb-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A9AEC7]">
            Design
          </span>
          <strong className="text-lg font-semibold tracking-[-0.03em] text-white">
            Subcategorias
          </strong>
        </div>
        <div className="grid gap-2">
          {DESIGN_CATEGORIES.map((category) => {
            const Icon = category.Icon;

            return (
              <button
                key={category.id}
                type="button"
                className={cls(
                  "flex items-center gap-3 rounded-[22px] border px-4 py-3 text-left transition duration-200",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A78BFA]/30",
                  activeId === category.id
                    ? "border-[#8E67F3] bg-[#151834] text-white"
                    : "border-white/5 bg-white/[0.03] text-[#D9DBE8] hover:border-white/10 hover:bg-white/[0.06]",
                )}
                onClick={() => onSelect(category.id)}
              >
                <span
                  className={cls(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl border",
                    activeId === category.id
                      ? "border-[#A78BFA]/40 bg-[#7C3AED] text-white"
                      : "border-white/8 bg-white/[0.06] text-[#A9AEC7]",
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="text-sm font-semibold tracking-[-0.01em]">
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div
        className="flex gap-3 overflow-x-auto pb-1 xl:hidden"
        aria-label="Subcategorias de design"
      >
        {DESIGN_CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={cls(
              "whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A78BFA]/30",
              activeId === category.id
                ? "border-[#8E67F3] bg-[#151834] text-white"
                : "border-white/10 bg-[#111327] text-[#D9DBE8] hover:border-white/20",
            )}
            onClick={() => onSelect(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
    </>
  );
}

function DesignPanelShell({ category, isSaving, children }) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-[#F6F7FB] p-5 text-[#171A2F] shadow-[0_30px_80px_-45px_rgba(17,19,39,0.5)] sm:p-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7C3AED]">
            {category.label}
          </span>
          <h2 className="text-[1.95rem] font-semibold tracking-[-0.05em] text-[#111327]">
            {category.title}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-[#69708F]">
            {category.description}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DDDFF0] bg-white px-4 py-2 text-sm font-medium text-[#5E6789]">
          <span
            className={cls(
              "h-2.5 w-2.5 rounded-full",
              isSaving ? "bg-[#7C3AED]" : "bg-[#9AA1BE]",
            )}
          />
          {isSaving ? "Salvando alteracoes" : "Preview em tempo real"}
        </div>
      </header>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function GroupLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
      {children}
    </div>
  );
}

function renderPanelContent({
  categoryId,
  value,
  onChange,
  previewPage,
  previewPrimaryLinks,
  previewSocialLinks,
  getOptionTheme,
  getPresetOptionTheme,
  applyThemePreset,
}) {
  switch (categoryId) {
    case "marca":
      return (
        <OptionGrid columns="2">
          {MY_PAGE_BRAND_LAYOUT_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={value.brandLayout === option.value}
              title={option.label}
              description={option.description}
              onClick={() => onChange("brandLayout", option.value)}
              preview={
                <BrandPreview
                  page={previewPage}
                  theme={getOptionTheme("brandLayout", option.value)}
                  mode={option.value}
                  primaryLinks={previewPrimaryLinks}
                />
              }
            />
          ))}
        </OptionGrid>
      );
    case "tema":
      return (
        <OptionGrid columns="3">
          {MY_PAGE_THEME_PRESET_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={value.themePreset === option.value}
              title={option.label}
              description={option.description}
              onClick={() => applyThemePreset(option.value)}
              preview={
                <ThemePreview
                  page={previewPage}
                  option={option}
                  theme={getPresetOptionTheme(option.value)}
                  primaryLinks={previewPrimaryLinks}
                  socialLinks={previewSocialLinks}
                />
              }
            />
          ))}
        </OptionGrid>
      );
    case "fundo":
      return (
        <>
          <OptionGrid columns="4">
            {MY_PAGE_BACKGROUND_STYLE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                selected={value.backgroundStyle === option.value}
                title={option.label}
                description={option.description}
                onClick={() => onChange("backgroundStyle", option.value)}
                preview={
                  <BackgroundPreview
                    page={previewPage}
                    theme={getOptionTheme("backgroundStyle", option.value)}
                    primaryLinks={previewPrimaryLinks}
                  />
                }
              />
            ))}
          </OptionGrid>
          {value.backgroundStyle === "gradient" ? (
            <div className="grid gap-3">
              <GroupLabel>Direcao</GroupLabel>
              <ChoiceButtons
                value={value.backgroundGradientDirection}
                options={MY_PAGE_BACKGROUND_GRADIENT_DIRECTION_OPTIONS}
                onChange={(nextValue) =>
                  onChange("backgroundGradientDirection", nextValue)
                }
              />
            </div>
          ) : null}
          {value.backgroundStyle === "pattern" ? (
            <div className="grid gap-3">
              <GroupLabel>Textura</GroupLabel>
              <ChoiceButtons
                value={value.backgroundPatternVariant}
                options={MY_PAGE_BACKGROUND_PATTERN_VARIANT_OPTIONS}
                onChange={(nextValue) => onChange("backgroundPatternVariant", nextValue)}
              />
            </div>
          ) : null}
          <ColorRow
            label="Cor do fundo"
            value={value.backgroundColor}
            fallback="#e2e8f0"
            onChange={(nextValue) => onChange("backgroundColor", nextValue)}
          />
        </>
      );
    case "superficie":
      return (
        <>
          <OptionGrid columns="3">
            {MY_PAGE_SURFACE_STYLE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                selected={value.surfaceStyle === option.value}
                title={option.label}
                description={option.description}
                onClick={() => onChange("surfaceStyle", option.value)}
                preview={
                  <SurfacePreview
                    page={previewPage}
                    theme={getOptionTheme("surfaceStyle", option.value)}
                    primaryLinks={previewPrimaryLinks}
                  />
                }
              />
            ))}
          </OptionGrid>
          {value.surfaceStyle === "pattern" ? (
            <div className="grid gap-3">
              <GroupLabel>Textura</GroupLabel>
              <ChoiceButtons
                value={value.surfacePatternVariant}
                options={MY_PAGE_SURFACE_PATTERN_VARIANT_OPTIONS}
                onChange={(nextValue) => onChange("surfacePatternVariant", nextValue)}
              />
            </div>
          ) : null}
          <ColorRow
            label="Cor do container"
            value={value.surfaceColor}
            fallback="#ffffff"
            onChange={(nextValue) => onChange("surfaceColor", nextValue)}
          />
        </>
      );
    case "fonte":
      return (
        <OptionGrid columns="4">
          {MY_PAGE_FONT_PRESET_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={value.fontPreset === option.value}
              title={option.label}
              description={option.description}
              onClick={() => onChange("fontPreset", option.value)}
              preview={
                <FontPreview
                  page={previewPage}
                  theme={getOptionTheme("fontPreset", option.value)}
                />
              }
            />
          ))}
        </OptionGrid>
      );
    case "botao":
      return (
        <>
          <div className="grid gap-4">
            <GroupLabel>Layout</GroupLabel>
            <OptionGrid columns="3">
              {MY_PAGE_PRIMARY_BUTTON_LAYOUT_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={value.primaryButtonsLayout === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() => onChange("primaryButtonsLayout", option.value)}
                  preview={
                    <ButtonPreview
                      page={previewPage}
                      theme={getOptionTheme("primaryButtonsLayout", option.value)}
                      links={previewPrimaryLinks}
                    />
                  }
                />
              ))}
            </OptionGrid>
          </div>
          <div className="grid gap-4">
            <GroupLabel>Estilo</GroupLabel>
            <OptionGrid columns="5">
              {MY_PAGE_BUTTON_STYLE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={value.buttonStyle === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() => onChange("buttonStyle", option.value)}
                  preview={
                    <ButtonPreview
                      page={previewPage}
                      theme={getOptionTheme("buttonStyle", option.value)}
                      links={previewPrimaryLinks}
                    />
                  }
                />
              ))}
            </OptionGrid>
          </div>
          <div className="grid gap-4">
            <GroupLabel>Button shadow</GroupLabel>
            <OptionGrid columns="4">
              {MY_PAGE_BUTTON_SHADOW_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={value.buttonShadow === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() => onChange("buttonShadow", option.value)}
                  preview={
                    <ButtonPreview
                      page={previewPage}
                      theme={getOptionTheme("buttonShadow", option.value)}
                      links={previewPrimaryLinks}
                    />
                  }
                />
              ))}
            </OptionGrid>
          </div>
          <div className="grid gap-4">
            <GroupLabel>Forma</GroupLabel>
            <OptionGrid columns="3">
              {MY_PAGE_BUTTON_RADIUS_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={value.buttonRadius === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() => onChange("buttonRadius", option.value)}
                  preview={
                    <ButtonPreview
                      page={previewPage}
                      theme={getOptionTheme("buttonRadius", option.value)}
                      links={previewPrimaryLinks}
                    />
                  }
                />
              ))}
            </OptionGrid>
          </div>
        </>
      );
    case "redes":
      return (
        <>
          <div className="grid gap-4">
            <GroupLabel>Conteudo</GroupLabel>
            <OptionGrid columns="3">
              {MY_PAGE_SECONDARY_LINK_STYLE_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={value.secondaryLinksStyle === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() => onChange("secondaryLinksStyle", option.value)}
                  preview={
                    <SocialPreview
                      page={previewPage}
                      theme={getOptionTheme("secondaryLinksStyle", option.value)}
                      links={previewSocialLinks}
                    />
                  }
                />
              ))}
            </OptionGrid>
          </div>
          <div className="grid gap-4">
            <GroupLabel>Layout do icone</GroupLabel>
            <OptionGrid columns="2">
              {MY_PAGE_SECONDARY_LINK_ICON_LAYOUT_OPTIONS.map((option) => (
                <OptionCard
                  key={option.value}
                  selected={value.secondaryLinksIconLayout === option.value}
                  title={option.label}
                  description={option.description}
                  onClick={() => onChange("secondaryLinksIconLayout", option.value)}
                  preview={
                    <SocialPreview
                      page={previewPage}
                      theme={getOptionTheme("secondaryLinksIconLayout", option.value)}
                      links={previewSocialLinks}
                    />
                  }
                />
              ))}
            </OptionGrid>
          </div>
          <div className="grid gap-3">
            <GroupLabel>Tamanho</GroupLabel>
            <ChoiceButtons
              value={value.secondaryLinksSize}
              options={MY_PAGE_SECONDARY_LINK_SIZE_OPTIONS}
              onChange={(nextValue) => onChange("secondaryLinksSize", nextValue)}
            />
          </div>
          <div className="grid gap-3">
            <GroupLabel>Alinhamento</GroupLabel>
            <ChoiceButtons
              value={value.secondaryLinksAlign}
              options={MY_PAGE_SECONDARY_LINK_ALIGN_OPTIONS}
              onChange={(nextValue) => onChange("secondaryLinksAlign", nextValue)}
            />
          </div>
        </>
      );
    case "animacao":
      return (
        <OptionGrid columns="4">
          {MY_PAGE_ANIMATION_PRESET_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              selected={value.animationPreset === option.value}
              title={option.label}
              description={option.description}
              onClick={() => onChange("animationPreset", option.value)}
              preview={
                <AnimationPreview
                  page={previewPage}
                  theme={getOptionTheme("animationPreset", option.value)}
                  links={previewPrimaryLinks}
                  socialLinks={previewSocialLinks}
                />
              }
            />
          ))}
        </OptionGrid>
      );
    case "cor":
    default:
      return (
        <div className="grid gap-4">
          <ColorRow
            label="Fundo"
            value={value.backgroundColor}
            fallback="#e2e8f0"
            onChange={(nextValue) => onChange("backgroundColor", nextValue)}
          />
          <ColorRow
            label="Botoes"
            value={value.buttonColor}
            fallback="#0f172a"
            onChange={(nextValue) => onChange("buttonColor", nextValue)}
          />
          <ColorRow
            label="Texto do botao"
            value={value.buttonTextColor}
            fallback="#ffffff"
            onChange={(nextValue) => onChange("buttonTextColor", nextValue)}
          />
          <ColorRow
            label="Texto da pagina"
            value={value.pageTextColor}
            fallback="#64748b"
            onChange={(nextValue) => onChange("pageTextColor", nextValue)}
          />
          <ColorRow
            label="Texto dos titulos"
            value={value.titleTextColor}
            fallback="#0f172a"
            onChange={(nextValue) => onChange("titleTextColor", nextValue)}
          />
        </div>
      );
  }
}

export default function DesignEditorPanelPremium({
  page,
  value,
  onChange,
  isSaving = false,
}) {
  const [activeDesignCategory, setActiveDesignCategory] = useState("marca");
  const previewPage = useMemo(
    () => createMyPageThemePreviewPage(page, value),
    [page, value],
  );
  const previewPrimaryLinks = useMemo(
    () => getMyPagePreviewPrimaryLinks(previewPage),
    [previewPage],
  );
  const previewSocialLinks = useMemo(
    () => getMyPagePreviewSocialLinks(previewPage),
    [previewPage],
  );

  useEffect(() => {
    if (!DESIGN_CATEGORIES.some((category) => category.id === activeDesignCategory)) {
      setActiveDesignCategory("marca");
    }
  }, [activeDesignCategory]);

  const activeCategory =
    DESIGN_CATEGORIES.find((category) => category.id === activeDesignCategory) ||
    DESIGN_CATEGORIES[0];

  function getOptionTheme(field, nextValue) {
    const patch =
      field && typeof field === "object" ? field : { [field]: nextValue };

    return getMyPageTheme(
      createMyPageThemePreviewPage(previewPage, { ...value, ...patch }),
    );
  }

  function getPresetOptionTheme(presetId) {
    return getMyPageTheme(
      createMyPageThemePreviewPage(
        previewPage,
        getMyPageThemePresetValues(presetId),
      ),
    );
  }

  function applyThemePreset(presetId) {
    onChange(getMyPageThemePresetValues(presetId));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <DesignCategoryNav
        activeId={activeCategory.id}
        onSelect={setActiveDesignCategory}
      />

      <DesignPanelShell category={activeCategory} isSaving={isSaving}>
        {renderPanelContent({
          categoryId: activeCategory.id,
          value,
          onChange,
          previewPage,
          previewPrimaryLinks,
          previewSocialLinks,
          getOptionTheme,
          getPresetOptionTheme,
          applyThemePreset,
        })}
      </DesignPanelShell>
    </div>
  );
}
