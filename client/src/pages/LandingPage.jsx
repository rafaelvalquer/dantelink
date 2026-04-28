import { ArrowRight, CheckCircle2, LayoutDashboard, Palette, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicPageMiniPreview } from "../components/public/PublicPageUi.jsx";
import {
  getMyPagePreviewPrimaryLinks,
  getMyPagePreviewSocialLinks,
  getMyPageTheme,
} from "../components/public/myPageTheme.js";

const samplePage = {
  title: "Studio Aurora",
  slug: "studio-aurora",
  bio: "Links, produtos e identidade visual em uma pagina pronta para converter.",
  avatarUrl: "https://placehold.co/160x160/png?text=SA",
  theme: {
    themePreset: "clean_light",
    brandLayout: "classic",
    backgroundStyle: "gradient",
    backgroundGradientDirection: "linear_up",
    backgroundColor: "#d9f99d",
    surfaceStyle: "soft",
    surfaceColor: "#ffffff",
    buttonColor: "#111827",
    buttonTextColor: "#ffffff",
    pageTextColor: "#475569",
    titleTextColor: "#111827",
    primaryButtonsLayout: "stack",
    primaryButtonContentAlign: "center",
    primaryIconLayout: "circle_solid",
    primaryIconSize: "md",
    secondaryLinksStyle: "icon_text",
    secondaryLinksIconLayout: "brand_badge",
    secondaryLinksPosition: "bottom",
    buttonStyle: "solid",
    buttonShadow: "soft",
    buttonRadius: "pill",
    fontPreset: "jakarta",
    animationPreset: "subtle",
  },
  links: [
    { id: "1", title: "Agendar atendimento", type: "link", url: "https://example.com", isActive: true, order: 0 },
    { id: "2", title: "Conhecer colecao", type: "link", url: "https://example.com", isActive: true, order: 1 },
    { id: "3", title: "Loja", type: "shop-preview", url: "", isActive: true, order: 2 },
  ],
  secondaryLinks: [
    { id: "s1", platform: "instagram", title: "Instagram", url: "https://instagram.com", isActive: true, order: 0 },
    { id: "s2", platform: "site", title: "Site", url: "https://example.com", isActive: true, order: 1 },
    { id: "s3", platform: "email", title: "E-mail", url: "mailto:contato@example.com", isActive: true, order: 2 },
  ],
  shop: {
    isActive: true,
    title: "Ver loja completa",
    description: "3 produtos",
    productsCount: 3,
    products: [
      { id: "p1", title: "Kit 01", imageUrl: "https://placehold.co/320x320/png?text=01", isActive: true, order: 0 },
      { id: "p2", title: "Kit 02", imageUrl: "https://placehold.co/320x320/png?text=02", isActive: true, order: 1 },
      { id: "p3", title: "Kit 03", imageUrl: "https://placehold.co/320x320/png?text=03", isActive: true, order: 2 },
    ],
  },
};

const benefitItems = [
  {
    icon: LayoutDashboard,
    title: "Edite tudo em um fluxo unico",
    description: "Gerencie links, loja e design no mesmo painel, com preview da pagina publica em tempo real.",
  },
  {
    icon: Store,
    title: "Venda com uma loja integrada",
    description: "Cadastre produtos por URL, organize sua vitrine e publique um shop simples de navegar.",
  },
  {
    icon: Palette,
    title: "Deixe sua pagina com identidade propria",
    description: "Escolha tipografia, fundo, superficie, botoes e redes para montar uma pagina mais profissional.",
  },
];

export default function LandingPage() {
  const theme = getMyPageTheme(samplePage);
  const primaryLinks = getMyPagePreviewPrimaryLinks(samplePage);
  const socialLinks = getMyPagePreviewSocialLinks(samplePage);

  return (
    <div className="marketing-page">
      <header className="marketing-nav">
        <Link className="marketing-brand" to="/">
          <span className="marketing-brand__mark">D</span>
          <span>DandeLink</span>
        </Link>

        <div className="marketing-nav__actions">
          <Link className="marketing-link" to="/login">
            Login
          </Link>
          <Link className="ui-button ui-button--primary" to="/cadastro">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="marketing-main">
        <section className="marketing-hero">
          <div className="marketing-hero__copy">
            <span className="marketing-kicker">Tudo o que voce cria, vende e compartilha em um so lugar</span>
            <h1>Transforme seu link da bio em uma pagina viva, bonita e pronta para converter.</h1>
            <p>
              Crie sua pagina, publique seus links, organize sua loja e ajuste o visual
              sem depender de ferramentas separadas.
            </p>

            <div className="marketing-hero__actions">
              <Link className="ui-button ui-button--primary" to="/cadastro">
                <span>Criar conta gratis</span>
                <ArrowRight size={16} />
              </Link>
              <Link className="ui-button ui-button--ghost" to="/login">
                Ja tenho conta
              </Link>
            </div>

            <ul className="marketing-proof">
              <li><CheckCircle2 size={16} /> Login com e-mail e senha</li>
              <li><CheckCircle2 size={16} /> 1 conta, 1 pagina pronta para personalizar</li>
              <li><CheckCircle2 size={16} /> Preview ao vivo enquanto voce edita</li>
            </ul>
          </div>

          <div className="marketing-hero__visual">
            <div className="marketing-hero__editor-card">
              <div className="marketing-hero__editor-top">
                <div>
                  <span className="marketing-card__eyebrow">Painel DandeLink</span>
                  <strong>Seu link na bio com links, loja e design</strong>
                </div>
                <span className="marketing-badge">Preview em tempo real</span>
              </div>

              <div className="marketing-hero__editor-grid">
                <div className="marketing-hero__editor-list">
                  <div className="marketing-editor-item is-active">
                    <strong>Links</strong>
                    <span>Organize CTAs e prioridades</span>
                  </div>
                  <div className="marketing-editor-item">
                    <strong>Loja</strong>
                    <span>Cadastre produtos por URL</span>
                  </div>
                  <div className="marketing-editor-item">
                    <strong>Design</strong>
                    <span>Personalize a pagina publica</span>
                  </div>
                </div>

                <div className="marketing-hero__mini-preview">
                  <PublicPageMiniPreview
                    page={samplePage}
                    theme={theme}
                    primaryLinks={primaryLinks}
                    socialLinks={socialLinks}
                    showSocial
                    buttonCount={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marketing-benefits">
          {benefitItems.map((item) => (
            <article key={item.title} className="marketing-benefit-card">
              <span className="marketing-benefit-card__icon">
                <item.icon size={18} />
              </span>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section className="marketing-cta">
          <div>
            <span className="marketing-card__eyebrow">Comece agora</span>
            <h2>Crie sua conta e publique sua primeira pagina em minutos.</h2>
          </div>
          <div className="marketing-cta__actions">
            <Link className="ui-button ui-button--primary" to="/cadastro">
              Criar conta
            </Link>
            <Link className="ui-button ui-button--ghost" to="/login">
              Entrar
            </Link>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <span>DandeLink</span>
        <span>Links, loja e design para sua pagina publica.</span>
      </footer>
    </div>
  );
}
