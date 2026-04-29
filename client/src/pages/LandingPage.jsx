import {
  Apple,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  LayoutDashboard,
  Link2,
  Palette,
  Scale,
  Scissors,
  Sparkles,
  Store,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroHome from "../assets/marketing/hero-home.png";
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
    title: "Painel único",
    description: "Links, loja, design e analytics organizados no mesmo ambiente.",
  },
  {
    icon: Store,
    title: "Loja integrada",
    description: "Produtos por URL, vitrine pública e cliques rastreados.",
  },
  {
    icon: Palette,
    title: "Identidade visual",
    description: "Tema, botões, redes e página pública com preview em tempo real.",
  },
];

const pillarItems = [
  {
    icon: Link2,
    title: "Links",
    description: "Priorize CTAs, redes e destinos importantes.",
  },
  {
    icon: Store,
    title: "Loja",
    description: "Monte uma vitrine leve para produtos e ofertas.",
  },
  {
    icon: Palette,
    title: "Design",
    description: "Ajuste a aparência da página sem complicar o fluxo.",
  },
];

const themeShowcaseItems = [
  {
    icon: Scissors,
    title: "Cabeleireiros",
    subtitle: "Agenda, portfólio e serviços",
    accent: "#D946EF",
    surface: "#FFF1FA",
    text: "#2A102F",
    tags: ["Agenda", "Antes/depois", "WhatsApp"],
  },
  {
    icon: Apple,
    title: "Nutricionistas",
    subtitle: "Consultas, planos e materiais",
    accent: "#22C55E",
    surface: "#F0FDF4",
    text: "#102719",
    tags: ["Consultas", "E-books", "Bio"],
  },
  {
    icon: Scale,
    title: "Advogados",
    subtitle: "Autoridade, contato e áreas",
    accent: "#38BDF8",
    surface: "#EFF6FF",
    text: "#0B1C2E",
    tags: ["Contato", "Especialidades", "Perfil"],
  },
  {
    icon: Store,
    title: "Lojas",
    subtitle: "Vitrine, ofertas e produtos",
    accent: "#F97316",
    surface: "#FFF7ED",
    text: "#2C1505",
    tags: ["Produtos", "Ofertas", "Catálogo"],
  },
  {
    icon: Sparkles,
    title: "Criadores",
    subtitle: "Conteúdo, comunidade e mídia",
    accent: "#7C3AED",
    surface: "#F5F3FF",
    text: "#1E1236",
    tags: ["Conteúdo", "Redes", "Cursos"],
  },
  {
    icon: Briefcase,
    title: "Consultores",
    subtitle: "Serviços, agenda e prova social",
    accent: "#0F172A",
    surface: "#F8FAFC",
    text: "#0F172A",
    tags: ["Serviços", "Agenda", "Cases"],
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
          <img className="marketing-hero__image" src={heroHome} alt="" aria-hidden="true" />
          <div className="marketing-hero__shade" aria-hidden="true" />

          <div className="marketing-hero__copy">
            <span className="marketing-kicker">DandeLink</span>
            <h1>DandeLink</h1>
            <p>
              Conexão que se espalha. Crie uma página viva para organizar links,
              loja, identidade visual e analytics em um só lugar.
            </p>

            <div className="marketing-hero__actions">
              <Link className="ui-button ui-button--primary" to="/cadastro">
                <span>Criar conta grátis</span>
                <ArrowRight size={16} />
              </Link>
              <Link className="ui-button ui-button--ghost" to="/login">
                Já tenho conta
              </Link>
            </div>

            <ul className="marketing-proof">
              <li><CheckCircle2 size={16} /> Publicação em minutos</li>
              <li><CheckCircle2 size={16} /> Loja e analytics nativos</li>
              <li><CheckCircle2 size={16} /> Preview em tempo real</li>
            </ul>
          </div>
        </section>

        <section className="marketing-pillars" aria-label="Recursos principais">
          {pillarItems.map((item) => (
            <article key={item.title} className="marketing-pillar">
              <span className="marketing-pillar__icon">
                <item.icon size={17} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="marketing-themes" aria-labelledby="marketing-themes-title">
          <div className="marketing-themes__header">
            <div>
              <span className="marketing-card__eyebrow">Temas customizáveis</span>
              <h2 id="marketing-themes-title">Páginas prontas para cada tipo de negócio.</h2>
            </div>
            <p>
              Mostre sua marca com layouts que mudam de tom, ritmo e foco para cada nicho.
            </p>
          </div>

          <div className="marketing-theme-marquee" aria-label="Exemplos de temas">
            <div className="marketing-theme-track">
              {[...themeShowcaseItems, ...themeShowcaseItems].map((item, index) => (
                <article
                  key={`${item.title}-${index}`}
                  className="marketing-theme-card"
                  style={{
                    "--theme-accent": item.accent,
                    "--theme-surface": item.surface,
                    "--theme-text": item.text,
                  }}
                >
                  <div className="marketing-theme-card__top">
                    <span className="marketing-theme-card__icon">
                      <item.icon size={18} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </div>
                  </div>

                  <div className="marketing-theme-preview">
                    <div className="marketing-theme-preview__avatar" />
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                    <i />
                    <i />
                    <i />
                  </div>

                  <div className="marketing-theme-tags">
                    {item.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-product">
          <div className="marketing-product__copy">
            <span className="marketing-card__eyebrow">Produto</span>
            <h2>Um painel calmo para montar, vender e medir.</h2>
            <p>
              O editor separa o que importa: links, produtos, design e performance.
              Tudo aparece no preview antes de chegar ao público.
            </p>

            <div className="marketing-product__metrics">
              <span><strong>4</strong> áreas principais</span>
              <span><strong>1</strong> página pública</span>
              <span><strong>0</strong> código para publicar</span>
            </div>
          </div>

          <div className="marketing-product__demo">
            <div className="marketing-hero__editor-card">
              <div className="marketing-hero__editor-top">
                <div>
                  <span className="marketing-card__eyebrow">Painel DandeLink</span>
                  <strong>Links, loja e design em um fluxo único</strong>
                </div>
                <span className="marketing-badge">Ao vivo</span>
              </div>

              <div className="marketing-hero__editor-grid">
                <div className="marketing-hero__editor-list">
                  <div className="marketing-editor-item is-active">
                    <strong>Links</strong>
                    <span>CTAs e redes sociais</span>
                  </div>
                  <div className="marketing-editor-item">
                    <strong>Loja</strong>
                    <span>Produtos e vitrine</span>
                  </div>
                  <div className="marketing-editor-item">
                    <strong>Analytics</strong>
                    <span>Visitas e cliques</span>
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
            <h2>Crie sua primeira página DandeLink em minutos.</h2>
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
        <span>Links, loja e design para sua página pública.</span>
      </footer>
    </div>
  );
}
