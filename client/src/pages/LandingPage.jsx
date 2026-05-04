import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Gift,
  Layers3,
  Link2,
  Package,
  Palette,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Utensils,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa6";
import heroHome from "../assets/marketing/hero-home.png";
import { PublicPageMiniPreview } from "../components/public/PublicPageUi.jsx";
import {
  getMyPagePreviewPrimaryLinks,
  getMyPagePreviewSocialLinks,
  getMyPageTheme,
} from "../components/public/myPageTheme.js";

function createDemoPage({
  title,
  slug,
  bio,
  avatar,
  themePreset,
  brandLayout = "classic",
  links,
  secondaryLinks,
  shopTitles = [],
}) {
  return {
    title,
    slug,
    bio,
    avatarUrl: avatar,
    theme: {
      themePreset,
      brandLayout,
    },
    links: links.map((link, index) => ({
      id: `${slug}-link-${index}`,
      type: "link",
      url: "https://example.com",
      isActive: true,
      order: index,
      ...link,
    })),
    secondaryLinks: secondaryLinks.map((link, index) => ({
      id: `${slug}-social-${index}`,
      url: link.platform === "email" ? "mailto:contato@example.com" : "https://example.com",
      isActive: true,
      order: index,
      ...link,
    })),
    shop: {
      isActive: Boolean(shopTitles.length),
      title: "Ver loja completa",
      description: `${shopTitles.length} produtos`,
      productsCount: shopTitles.length,
      products: shopTitles.map((productTitle, index) => ({
        id: `${slug}-product-${index}`,
        title: productTitle,
        isActive: true,
        order: index,
      })),
    },
  };
}

function createBrandAvatar({
  initials,
  skin = "#d8a47f",
  hair = "#2f1f1a",
  outfit = "#7c3aed",
  background = "#f5eee7",
  badge = "#11131f",
}) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${background}"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
        <linearGradient id="shine" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".72"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="46" fill="url(#bg)"/>
      <circle cx="126" cy="30" r="42" fill="url(#shine)"/>
      <circle cx="80" cy="70" r="34" fill="${skin}"/>
      <path d="M45 69c4-31 24-45 52-38 18 4 27 18 24 41-16-16-43-20-76-3Z" fill="${hair}"/>
      <path d="M34 154c5-33 24-51 46-51s41 18 46 51H34Z" fill="${outfit}"/>
      <path d="M54 121c12 12 39 12 52 0" fill="none" stroke="#fff" stroke-opacity=".44" stroke-width="7" stroke-linecap="round"/>
      <circle cx="119" cy="119" r="25" fill="${badge}"/>
      <circle cx="119" cy="119" r="20" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>
      <text x="119" y="126" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900" fill="#fff">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

const brandPages = [
  createDemoPage({
    title: "Studio Aurora",
    slug: "studio-aurora",
    bio: "Agenda, servi\u00e7os e loja em uma p\u00e1gina pronta para converter.",
    avatar: createBrandAvatar({
      initials: "SA",
      skin: "#c98f6b",
      hair: "#3a241c",
      outfit: "#8b6f61",
      background: "#f5eee7",
      badge: "#8b6f61",
    }),
    themePreset: "studio_pearl",
    links: [
      { title: "Agendar atendimento" },
      { title: "Conhecer servi\u00e7os" },
      { title: "Loja", type: "shop-preview", url: "" },
    ],
    secondaryLinks: [
      { platform: "instagram", title: "Instagram" },
      { platform: "site", title: "Site" },
      { platform: "email", title: "E-mail" },
    ],
    shopTitles: ["Kit brilho", "Gift card", "Rotina premium"],
  }),
  createDemoPage({
    title: "Noura Clinic",
    slug: "noura-clinic",
    bio: "Tratamentos, avalia\u00e7\u00f5es e contato com visual limpo e confi\u00e1vel.",
    avatar: createBrandAvatar({
      initials: "NC",
      skin: "#b98262",
      hair: "#151821",
      outfit: "#334155",
      background: "#eef2f7",
      badge: "#0e7490",
    }),
    themePreset: "clean_light",
    links: [
      { title: "Marcar avalia\u00e7\u00e3o" },
      { title: "Ver tratamentos" },
      { title: "Falar no WhatsApp", type: "whatsapp" },
    ],
    secondaryLinks: [
      { platform: "instagram", title: "Instagram" },
      { platform: "site", title: "Site" },
      { platform: "phone", title: "Telefone", url: "tel:+5511999999999" },
    ],
  }),
  createDemoPage({
    title: "Graphite Lab",
    slug: "graphite-lab",
    bio: "Portf\u00f3lio, cases e propostas com presen\u00e7a executiva.",
    avatar: createBrandAvatar({
      initials: "GL",
      skin: "#9b6d55",
      hair: "#0b0b0b",
      outfit: "#e5e7eb",
      background: "#1f2937",
      badge: "#111111",
    }),
    themePreset: "graphite_mono",
    brandLayout: "spotlight",
    links: [
      { title: "Ver portf\u00f3lio" },
      { title: "Solicitar proposta" },
      { title: "Cases recentes" },
    ],
    secondaryLinks: [
      { platform: "linkedin", title: "LinkedIn" },
      { platform: "site", title: "Site" },
      { platform: "email", title: "E-mail" },
    ],
  }),
  createDemoPage({
    title: "Sage Nutri",
    slug: "sage-nutri",
    bio: "Consultas, materiais e acompanhamento para pacientes.",
    avatar: createBrandAvatar({
      initials: "SN",
      skin: "#d1a384",
      hair: "#5a3b2f",
      outfit: "#63715b",
      background: "#e8eee0",
      badge: "#63715b",
    }),
    themePreset: "sage_editorial",
    links: [
      { title: "Agendar consulta" },
      { title: "Baixar guia gratuito" },
      { title: "Loja", type: "shop-preview", url: "" },
    ],
    secondaryLinks: [
      { platform: "instagram", title: "Instagram" },
      { platform: "youtube", title: "YouTube" },
      { platform: "site", title: "Site" },
    ],
    shopTitles: ["E-book", "Planner", "Receitas"],
  }),
  createDemoPage({
    title: "Copper Haus",
    slug: "copper-haus",
    bio: "Produtos autorais, lan\u00e7amentos e atendimento em um s\u00f3 lugar.",
    avatar: createBrandAvatar({
      initials: "CH",
      skin: "#b87557",
      hair: "#2b1711",
      outfit: "#a4573a",
      background: "#f4ded2",
      badge: "#a4573a",
    }),
    themePreset: "copper_luxe",
    brandLayout: "hero",
    links: [
      { title: "Comprar cole\u00e7\u00e3o" },
      { title: "Falar com consultor" },
      { title: "Loja", type: "shop-preview", url: "" },
    ],
    secondaryLinks: [
      { platform: "instagram", title: "Instagram" },
      { platform: "tiktok", title: "TikTok" },
      { platform: "site", title: "Site" },
    ],
    shopTitles: ["Pe\u00e7a 01", "Pe\u00e7a 02", "Pe\u00e7a 03"],
  }),
  createDemoPage({
    title: "Midnight Studio",
    slug: "midnight-studio",
    bio: "Conte\u00fado, comunidade e ofertas com est\u00e9tica mais escura.",
    avatar: createBrandAvatar({
      initials: "MS",
      skin: "#a8755e",
      hair: "#101827",
      outfit: "#2dd4bf",
      background: "#0f172a",
      badge: "#2dd4bf",
    }),
    themePreset: "premium_dark",
    links: [
      { title: "Entrar na comunidade" },
      { title: "Ver m\u00eddia kit" },
      { title: "Curso principal" },
    ],
    secondaryLinks: [
      { platform: "instagram", title: "Instagram" },
      { platform: "youtube", title: "YouTube" },
      { platform: "discord", title: "Discord" },
    ],
  }),
  createDemoPage({
    title: "Casa Brume",
    slug: "casa-brume",
    bio: "Experi\u00eancia de marca com imagem em destaque e links de reserva.",
    avatar: createBrandAvatar({
      initials: "CB",
      skin: "#c58d70",
      hair: "#4a2e25",
      outfit: "#b9786e",
      background: "#f8ddd5",
      badge: "#b9786e",
    }),
    themePreset: "aesthetic_glow",
    brandLayout: "hero",
    links: [
      { title: "Reservar hor\u00e1rio" },
      { title: "Ver tratamentos" },
      { title: "Falar no WhatsApp", type: "whatsapp" },
    ],
    secondaryLinks: [
      { platform: "instagram", title: "Instagram" },
      { platform: "site", title: "Site" },
      { platform: "email", title: "E-mail" },
    ],
  }),
  createDemoPage({
    title: "Noir Barber",
    slug: "noir-barber",
    bio: "Logo em evid\u00eancia, agenda r\u00e1pida e presen\u00e7a premium.",
    avatar: createBrandAvatar({
      initials: "NB",
      skin: "#9a6a55",
      hair: "#070707",
      outfit: "#f5f5f5",
      background: "#111111",
      badge: "#050505",
    }),
    themePreset: "braciera_noir",
    brandLayout: "spotlight",
    links: [
      { title: "Agendar corte" },
      { title: "Tabela de servi\u00e7os" },
      { title: "Como chegar" },
    ],
    secondaryLinks: [
      { platform: "instagram", title: "Instagram" },
      { platform: "site", title: "Site" },
      { platform: "phone", title: "Telefone", url: "tel:+5511999999999" },
    ],
  }),
];

const heroPreviewPages = [brandPages[4], brandPages[2], brandPages[0]];
const shopDemoPages = brandPages.filter((page) => page.shop?.isActive);
const designDemoPages = [brandPages[0], brandPages[2], brandPages[3], brandPages[4], brandPages[6], brandPages[7]];
const catalogProductIcons = [ShoppingBag, Gift, Sparkles, BookOpen, Package, Shirt, Utensils];

const dashboardTabs = [
  { id: "links", icon: Link2, title: "Links", text: "CTAs e redes" },
  { id: "shop", icon: ShoppingBag, title: "Loja", text: "Produtos e ofertas" },
  { id: "design", icon: Palette, title: "Design", text: "Temas e layouts" },
  { id: "analytics", icon: TrendingUp, title: "Analytics", text: "Visitas e cliques" },
];

const dashboardCopy = {
  links: {
    status: "Preview ao vivo",
    title: "Links publicados em tempo real",
  },
  shop: {
    status: "Loja ao vivo",
    title: "Vitrine pronta para vender",
  },
  design: {
    status: "Design ao vivo",
    title: "Temas pré-configurados",
  },
  analytics: {
    status: "Analytics ao vivo",
    title: "Gráficos e leitura de cliques",
  },
};

const linkDemoButtons = [
  {
    id: "site",
    label: "Site oficial",
    text: "Landing, blog ou cardápio",
    Icon: FaGlobe,
  },
  {
    id: "instagram",
    label: "Instagram",
    text: "@studioaurora",
    Icon: FaInstagram,
  },
  {
    id: "facebook",
    label: "Facebook",
    text: "Página da marca",
    Icon: FaFacebookF,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    text: "Atendimento direto",
    Icon: FaWhatsapp,
  },
  {
    id: "tiktok",
    label: "TikTok",
    text: "Vídeos e bastidores",
    Icon: FaTiktok,
  },
];

const catalogProducts = shopDemoPages
  .flatMap((page, pageIndex) =>
    (page.shop?.products || []).map((product, productIndex) => ({
      id: product.id,
      brand: page.title,
      title: product.title,
      Icon: catalogProductIcons[(pageIndex + productIndex) % catalogProductIcons.length],
      price: ["R$ 89", "R$ 129", "R$ 59", "R$ 149", "R$ 72", "R$ 210"][
        (pageIndex + productIndex) % 6
      ],
      tag: ["Novo", "Mais vendido", "Digital", "Combo", "Agenda", "Premium"][
        (pageIndex + productIndex) % 6
      ],
    })),
  )
  .slice(0, 6);

const featureItems = [
  {
    icon: Link2,
    eyebrow: "Links",
    title: "Nunca troque o link da bio de novo.",
    description: "Organize campanhas, redes, WhatsApp e conte\u00fado em uma p\u00e1gina que muda junto com a sua rotina.",
  },
  {
    icon: Store,
    eyebrow: "Loja",
    title: "Transforme cliques em pedidos.",
    description: "Mostre produtos, cole\u00e7\u00f5es e ofertas sem mandar a audi\u00eancia procurar em outro lugar.",
  },
  {
    icon: Palette,
    eyebrow: "Design",
    title: "Cada marca com uma presen\u00e7a pr\u00f3pria.",
    description: "Aplique temas limpos, layouts hero e spotlight, e veja tudo no preview antes de publicar.",
  },
  {
    icon: BarChart3,
    eyebrow: "Analytics",
    title: "Entenda o que realmente chama aten\u00e7\u00e3o.",
    description: "Acompanhe visitas e cliques para decidir o que destacar na sua p\u00e1gina.",
  },
];

const quickStats = [
  "Links",
  "Loja",
  "Design",
  "Analytics",
  "Hero",
  "Spotlight",
  "Temas",
  "Preview",
];

const howItWorks = [
  {
    title: "Crie sua conta",
    description: "Defina o nome da marca, foto, bio e slug p\u00fablico.",
  },
  {
    title: "Monte o fluxo",
    description: "Adicione links, produtos, redes e chamadas principais.",
  },
  {
    title: "Publique e acompanhe",
    description: "Compartilhe a p\u00e1gina e ajuste a experi\u00eancia pelo painel.",
  },
];

function BrandPreviewCard({ page, compact = false }) {
  const previewTheme = getMyPageTheme(page);
  const previewPrimaryLinks = getMyPagePreviewPrimaryLinks(page, 3);
  const previewSocialLinks = getMyPagePreviewSocialLinks(page);

  return (
    <article className={`lt-brand-card${compact ? " lt-brand-card--compact" : ""}`}>
      <div className="lt-brand-card__meta">
        <span>{previewTheme.design.themePreset.replaceAll("_", " ")}</span>
        <strong>{page.title}</strong>
      </div>
      <div className="lt-brand-card__preview">
        <PublicPageMiniPreview
          page={page}
          theme={previewTheme}
          primaryLinks={previewPrimaryLinks}
          socialLinks={previewSocialLinks}
          showSocial
          buttonCount={3}
        />
      </div>
    </article>
  );
}

function ShopDemoPanel() {
  return (
    <div className="lt-catalog-demo" aria-label="Preview do catálogo de produtos">
      <div className="lt-catalog-demo__header">
        <div>
          <span>Catálogo público</span>
          <strong>Produtos prontos para compra</strong>
        </div>
        <small>Vitrine, preço, marca e CTA no mesmo fluxo.</small>
      </div>

      <div className="lt-catalog-demo__grid">
        {catalogProducts.map((product) => (
          <article className="lt-catalog-product" key={product.id}>
            <div className="lt-catalog-product__media">
              <span>{product.tag}</span>
              <div className="lt-catalog-product__icon" aria-hidden="true">
                <product.Icon size={42} strokeWidth={1.9} />
              </div>
            </div>
            <div className="lt-catalog-product__body">
              <small>{product.brand}</small>
              <strong>{product.title}</strong>
              <div>
                <span>{product.price}</span>
                <Link to="/cadastro">Comprar</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LinksDemoPanel() {
  const featuredPage = brandPages[0];

  return (
    <div className="lt-links-demo" aria-label="Preview de botões de links">
      <aside className="lt-links-demo__profile">
        <img src={featuredPage.avatarUrl} alt="" aria-hidden="true" />
        <span>Studio Aurora</span>
        <strong>Links essenciais em destaque</strong>
        <p>Site, redes sociais e atendimento com botões claros para cada ação.</p>
      </aside>

      <div className="lt-links-demo__buttons">
        {linkDemoButtons.map((button) => (
          <Link
            className={`lt-links-demo__button lt-links-demo__button--${button.id}`}
            key={button.id}
            to="/cadastro"
          >
            <span>
              <button.Icon size={18} />
            </span>
            <div>
              <strong>{button.label}</strong>
              <small>{button.text}</small>
            </div>
            <ChevronRight size={16} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DesignDemoPanel() {
  return (
    <div className="lt-brand-marquee" aria-label="Temas pr&eacute;-configurados">
      <div className="lt-brand-marquee__track lt-brand-marquee__track--design">
        {[...designDemoPages, ...designDemoPages].map((page, index) => (
          <BrandPreviewCard page={page} key={`${page.slug}-design-${index}`} />
        ))}
      </div>
    </div>
  );
}

function AnalyticsDemoPanel() {
  const chartBars = [38, 58, 42, 78, 64, 92, 72];

  return (
    <div className="lt-analytics-demo" aria-label="Preview de analytics">
      <div className="lt-analytics-demo__grid">
        <article>
          <span>Visitas</span>
          <strong>1.284</strong>
          <small>+18% na semana</small>
        </article>
        <article>
          <span>Cliques em links</span>
          <strong>436</strong>
          <small>CTAs principais</small>
        </article>
        <article>
          <span>Produtos</span>
          <strong>89</strong>
          <small>Cliques de loja</small>
        </article>
      </div>

      <div className="lt-analytics-demo__chart">
        <svg viewBox="0 0 720 260" role="img" aria-label="Gr&aacute;fico de an&aacute;lise do link">
          {[0, 1, 2, 3].map((line) => (
            <line
              key={line}
              x1="36"
              x2="700"
              y1={40 + line * 52}
              y2={40 + line * 52}
              className="lt-analytics-demo__grid-line"
            />
          ))}
          {chartBars.map((height, index) => {
            const x = 70 + index * 86;
            const y = 214 - height * 1.55;

            return (
              <rect
                key={index}
                x={x}
                y={y}
                width="28"
                height={height * 1.55}
                rx="14"
                className="lt-analytics-demo__bar"
              />
            );
          })}
          <path
            className="lt-analytics-demo__line"
            d="M 84 155 Q 170 118 256 142 Q 342 165 428 96 Q 514 68 600 88"
          />
        </svg>
      </div>
    </div>
  );
}

function DashboardPreviewContent({ activePanel }) {
  if (activePanel === "shop") {
    return <ShopDemoPanel />;
  }

  if (activePanel === "design") {
    return <DesignDemoPanel />;
  }

  if (activePanel === "analytics") {
    return <AnalyticsDemoPanel />;
  }

  return <LinksDemoPanel />;
}

export default function LandingPage() {
  const [activePanel, setActivePanel] = useState("links");
  const activePanelCopy = dashboardCopy[activePanel] || dashboardCopy.links;

  return (
    <div className="lt-home">
      <header className="lt-nav">
        <Link className="lt-brand" to="/">
          <span className="lt-brand__mark">D</span>
          <span>DandeLink</span>
        </Link>

        <nav className="lt-nav__links" aria-label={"Navega\u00e7\u00e3o principal"}>
          <a href="#recursos">Recursos</a>
          <a href="#painel">Painel</a>
          <a href="#como-funciona">Como funciona</a>
        </nav>

        <div className="lt-nav__actions">
          <Link className="lt-link" to="/login">
            Login
          </Link>
          <Link className="lt-button lt-button--dark" to="/cadastro">
            Criar conta
          </Link>
        </div>
      </header>

      <main>
        <section className="lt-hero" aria-labelledby="lt-hero-title">
          <div className="lt-hero__copy">
            <span className="lt-eyebrow">Links, loja e marca em um s&oacute; lugar</span>
            <h1 id="lt-hero-title">Tudo que voc&ecirc; faz, em um link bonito de compartilhar.</h1>
            <p>
              Monte uma p&aacute;gina p&uacute;blica com identidade pr&oacute;pria, vitrines, redes e chamadas
              que levam sua audi&ecirc;ncia para a pr&oacute;xima a&ccedil;&atilde;o.
            </p>

            <div className="lt-hero__actions">
              <Link className="lt-button lt-button--lime" to="/cadastro">
                <span>Come&ccedil;ar gr&aacute;tis</span>
                <ArrowRight size={18} />
              </Link>
              <Link className="lt-button lt-button--light" to="/login">
                Entrar no painel
              </Link>
            </div>

            <div className="lt-proof" aria-label="Destaques da plataforma">
              <span><CheckCircle2 size={16} /> Preview em tempo real</span>
              <span><CheckCircle2 size={16} /> Temas premium</span>
              <span><CheckCircle2 size={16} /> Sem c&oacute;digo</span>
            </div>
          </div>

          <div className="lt-hero__visual" aria-label={"Demonstra\u00e7\u00e3o visual de marcas"}>
            <img className="lt-hero__photo" src={heroHome} alt="" aria-hidden="true" />
            <div className="lt-hero__stack">
              {heroPreviewPages.map((page, index) => (
                <div className={`lt-hero-phone lt-hero-phone--${index + 1}`} key={page.slug}>
                  <BrandPreviewCard page={page} compact />
                </div>
              ))}
            </div>
            <div className="lt-live-card">
              <span>Ao vivo</span>
              <strong>8 marcas</strong>
              <small>em temas reais</small>
            </div>
          </div>
        </section>

        <section className="lt-strip" aria-label="Recursos em destaque">
          <div className="lt-strip__track">
            {[...quickStats, ...quickStats].map((item, index) => (
              <span key={`${item}-${index}`}>
                <Sparkles size={15} />
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="lt-section lt-section--features" id="recursos" aria-labelledby="lt-features-title">
          <div className="lt-section__intro">
            <span className="lt-eyebrow">Do link ao cliente</span>
            <h2 id="lt-features-title">Uma experi&ecirc;ncia simples para quem cria, vende e atende.</h2>
          </div>

          <div className="lt-feature-grid">
            {featureItems.map((item) => (
              <article className="lt-feature-card" key={item.title}>
                <span className="lt-feature-card__icon">
                  <item.icon size={22} />
                </span>
                <small>{item.eyebrow}</small>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lt-product" id="painel" aria-labelledby="lt-product-title">
          <div className="lt-product__header">
            <div>
              <span className="lt-eyebrow">Painel DandeLink</span>
              <h2 id="lt-product-title">Marcas diferentes, mesmo fluxo simples.</h2>
            </div>
            <p>
              O carrossel usa os mesmos previews e tokens visuais do editor. Cada mock combina
              usu&aacute;rio, logo, tema, layout hero ou spotlight e CTAs reais de uma p&aacute;gina p&uacute;blica.
            </p>
          </div>

          <div className="lt-dashboard">
            <aside className="lt-dashboard__side" aria-label={"Areas do painel"}>
              {dashboardTabs.map((item) => (
                <button
                  type="button"
                  className={`lt-dashboard-item${activePanel === item.id ? " is-active" : ""}`}
                  key={item.id}
                  onClick={() => setActivePanel(item.id)}
                  aria-pressed={activePanel === item.id}
                >
                  <span><item.icon size={17} /></span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </div>
                  <ChevronRight size={15} />
                </button>
              ))}
            </aside>

            <div className="lt-dashboard__main">
              <div className="lt-dashboard__top">
                <div>
                  <span className="lt-status-dot" />
                  {activePanelCopy.status}
                </div>
                <strong>{activePanelCopy.title}</strong>
              </div>

              <DashboardPreviewContent activePanel={activePanel} />
            </div>
          </div>
        </section>

        <section className="lt-section lt-section--steps" id="como-funciona" aria-labelledby="lt-steps-title">
          <div className="lt-section__intro">
            <span className="lt-eyebrow">Como funciona</span>
            <h2 id="lt-steps-title">Da ideia ao link publicado em poucos passos.</h2>
          </div>

          <div className="lt-step-grid">
            {howItWorks.map((step, index) => (
              <article className="lt-step-card" key={step.title}>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lt-final-cta">
          <div>
            <span className="lt-eyebrow">Sua marca no centro</span>
            <h2>Crie uma p&aacute;gina que parece sua, vende como sua e muda quando voc&ecirc; quiser.</h2>
          </div>
          <div className="lt-final-cta__actions">
            <Link className="lt-button lt-button--lime" to="/cadastro">
              Criar conta
            </Link>
            <Link className="lt-button lt-button--dark" to="/login">
              J&aacute; tenho conta
            </Link>
          </div>
          <div className="lt-final-cta__badges" aria-label={"Benef\u00edcios"}>
            <span><Users size={16} /> Para creators e neg&oacute;cios</span>
            <span><Layers3 size={16} /> Hero e spotlight</span>
            <span><CheckCircle2 size={16} /> Preview real</span>
          </div>
        </section>
      </main>

      <footer className="lt-footer">
        <span>DandeLink</span>
        <span>Links, loja e design para sua p&aacute;gina p&uacute;blica.</span>
      </footer>
    </div>
  );
}
