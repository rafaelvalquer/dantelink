import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Share2, Sparkles } from "lucide-react";
import {
  getMyPageButtonIcon,
  getMyPageCollectionIcon,
  getMyPageMotionPreset,
  getMyPageSocialBrand,
  getMyPageTheme,
  getPrimaryLinksLayout,
  getSecondaryLinksLayout,
} from "./myPageTheme.js";

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function sortActive(items = []) {
  return [...items]
    .filter((item) => item?.isActive)
    .sort((left, right) => Number(left?.order ?? 0) - Number(right?.order ?? 0));
}

function renderTitle(value, fallback) {
  return String(value || fallback || "").trim() || fallback;
}

function getPublicPageUrl(page, interactive) {
  if (interactive && typeof window !== "undefined") {
    return window.location.href;
  }

  if (page?.slug) {
    return `/${page.slug}`;
  }

  return "/minha-pagina";
}

function ActionContainer({
  interactive,
  href,
  className,
  style,
  children,
  ariaLabel,
}) {
  if (interactive && href) {
    return (
      <a
        className={className}
        style={style}
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <div className={className} style={style} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

function HeroAvatar({ page }) {
  if (page?.avatarUrl) {
    return (
      <img
        className="public-page__hero-avatar"
        src={page.avatarUrl}
        alt={page.title || "Minha pagina"}
      />
    );
  }

  return (
    <div className="public-page__hero-avatar public-page__hero-avatar--placeholder">
      <span>{String(page?.title || "M").slice(0, 1)}</span>
    </div>
  );
}

function PrimaryLinkCard({ link, interactive, theme, preview = false }) {
  const Icon = getMyPageButtonIcon(link);
  const title = renderTitle(link?.title, "Novo link");
  const meta =
    link?.type === "shop-preview"
      ? "Shop"
      : link?.type === "social"
        ? "Social"
        : "Link";

  return (
    <ActionContainer
      interactive={interactive}
      href={link?.url}
      className={cls("public-page__cta", preview ? "is-preview" : "")}
      style={theme.primaryButtonStyle}
      ariaLabel={title}
    >
      <div className="public-page__cta-main">
        <div className="public-page__cta-icon" style={theme.secondaryButtonStyle}>
          <Icon className="public-page__cta-icon-svg" />
        </div>
        <div className="public-page__cta-copy">
          <span className="public-page__cta-meta">{meta}</span>
          <strong>{title}</strong>
          <span>{link?.url || "Adicione uma URL para este CTA."}</span>
        </div>
      </div>
      <span className="public-page__cta-arrow">
        {interactive ? "Abrir" : "Preview"}
      </span>
    </ActionContainer>
  );
}

function SecondaryLinkChip({ link, theme, interactive }) {
  const brand = getMyPageSocialBrand(link);
  const layout = getSecondaryLinksLayout(theme);
  const label = renderTitle(link?.title, brand.platform);
  const Icon = brand.Icon;
  const iconOnly = theme?.design?.secondaryLinksStyle === "icon";
  const showIcon = theme?.design?.secondaryLinksStyle !== "text";
  const useBadge = theme?.design?.secondaryLinksIconLayout !== "plain";

  return (
    <ActionContainer
      interactive={interactive}
      href={link?.url}
      className={cls(
        "public-page__social-chip",
        iconOnly ? "is-icon-only" : "",
        `is-${layout.size}`,
      )}
      style={theme.secondaryButtonStyle}
      ariaLabel={label}
    >
      {showIcon ? (
        <span
          className={cls(
            "public-page__social-badge",
            useBadge ? "is-badge" : "is-plain",
          )}
          style={useBadge ? brand.badgeStyle || theme.softSurfaceStyle : undefined}
        >
          <Icon />
        </span>
      ) : null}
      {iconOnly ? null : <span className="public-page__social-label">{label}</span>}
    </ActionContainer>
  );
}

function CollectionCard({ collection, theme, interactive }) {
  const CollectionIcon = getMyPageCollectionIcon();

  return (
    <section className="public-page__collection" style={theme.surfaceStyle}>
      <div className="public-page__section-header">
        <div className="public-page__section-title">
          <div className="public-page__section-icon" style={theme.secondaryButtonStyle}>
            <CollectionIcon className="public-page__section-icon-svg" />
          </div>
          <div>
            <span className="public-page__section-eyebrow">Colecao</span>
            <h2>{renderTitle(collection?.title, "Colecao")}</h2>
          </div>
        </div>
        <span className="public-page__section-counter">
          {Number(collection?.items?.length || 0)} itens
        </span>
      </div>

      <div className="public-page__collection-items">
        {collection?.items?.length ? (
          collection.items.map((item) => (
            <ActionContainer
              key={item.id}
              interactive={interactive}
              href={item.url}
              className="public-page__collection-item"
              style={theme.softSurfaceStyle}
              ariaLabel={item.title || "Item da colecao"}
            >
              <div className="public-page__collection-item-copy">
                <strong>{renderTitle(item?.title, "Item da colecao")}</strong>
                <span>{item?.url || "Adicione uma URL para este item."}</span>
              </div>
              <ArrowRight className="public-page__collection-arrow" />
            </ActionContainer>
          ))
        ) : (
          <div className="public-page__empty" style={theme.softSurfaceStyle}>
            Nenhum item ativo nesta colecao.
          </div>
        )}
      </div>
    </section>
  );
}

function ShopCard({ shop, theme }) {
  return (
    <section className="public-page__shop" style={theme.surfaceStyle}>
      <div className="public-page__section-header">
        <div className="public-page__section-title">
          <div className="public-page__section-icon" style={theme.primaryButtonStyle}>
            <Sparkles className="public-page__section-icon-svg" />
          </div>
          <div>
            <span className="public-page__section-eyebrow">Shop</span>
            <h2>{renderTitle(shop?.title, "Loja")}</h2>
          </div>
        </div>
        <span className="public-page__section-counter">
          {Number(shop?.productsCount || 0)} produtos
        </span>
      </div>
      <p className="public-page__shop-copy">
        {shop?.description || "Configure este bloco de loja no painel administrativo."}
      </p>
    </section>
  );
}

function QRPlaceholder() {
  const size = 13;
  const cells = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const column = index % size;

    function inFinder(startRow, startColumn) {
      return (
        row >= startRow &&
        row < startRow + 4 &&
        column >= startColumn &&
        column < startColumn + 4
      );
    }

    const inCornerFinder =
      inFinder(0, 0) ||
      inFinder(0, size - 4) ||
      inFinder(size - 4, 0);
    const active =
      inCornerFinder ||
      ((row * 11 + column * 7 + row * column) % 5 === 0 &&
        !(
          (row < 5 && column < 5) ||
          (row < 5 && column > size - 6) ||
          (row > size - 6 && column < 5)
        ));

    return (
      <span
        key={`${row}-${column}`}
        className={cls("public-page__qr-cell", active ? "is-active" : "")}
      />
    );
  });

  return <div className="public-page__qr-grid">{cells}</div>;
}

function renderLinkCard(link, interactive, radius, index) {
  const className = "public-page__button";
  const style = { borderRadius: radius };
  const key = link.id || index;

  if (!interactive) {
    return (
      <div key={key} className={className} style={style}>
        <div className="public-page__button-texts">
          <strong>{link.title || "Link sem título"}</strong>
          <span>{link.url || "Adicione uma URL de destino"}</span>
        </div>
        <span className="public-page__button-arrow">Abrir</span>
      </div>
    );
  }

  return (
    <a
      key={key}
      className={className}
      style={style}
      href={link.url || "#"}
      target="_blank"
      rel="noreferrer"
    >
      <div className="public-page__button-texts">
        <strong>{link.title || "Link sem título"}</strong>
        <span>{link.url || "Adicione uma URL de destino"}</span>
      </div>
      <span className="public-page__button-arrow">Abrir</span>
    </a>
  );
}

export default function PublicPageRenderer({
  page,
  mode = "public",
  interactive = true,
}) {
  const previewMode = mode === "preview";
  const theme = getMyPageTheme(page || {});
  const shouldReduceMotion = useReducedMotion();
  const motionPreset = getMyPageMotionPreset(theme, shouldReduceMotion);
  const activeLinks = sortActive(page?.links || []);
  const primaryLinks = activeLinks.filter((link) => link?.type !== "social");
  const socialLinks = activeLinks.filter((link) => link?.type === "social");
  const activeCollections = sortActive(page?.collections || []).map((collection) => ({
    ...collection,
    items: sortActive(collection.items || []),
  }));
  const hasVisibleContent =
    primaryLinks.length ||
    socialLinks.length ||
    activeCollections.length ||
    page?.shop?.isActive;
  const linksLayout = getPrimaryLinksLayout(theme);
  const secondaryLayout = getSecondaryLinksLayout(theme);

  return (
    <div
      className={cls("public-page", previewMode ? "public-page--preview" : "")}
      style={theme.rootStyle}
    >
      <div className="public-page__halo public-page__halo--top" />
      <div className="public-page__halo public-page__halo--bottom" />

      <div className="public-page__inner">
        <motion.section
          className="public-page__hero-shell"
          style={theme.surfaceStyle}
          variants={motionPreset.cardVariants}
          initial={motionPreset.wrapper.initial}
          animate={motionPreset.wrapper.animate}
        >
          {theme.usesHeroLayout ? (
            <div className="public-page__hero-media" style={theme.heroMediaStyle} />
          ) : null}

          <div className="public-page__hero">
            {theme.usesHeroLayout ? null : <HeroAvatar page={page} />}

            <div className="public-page__hero-copy">
              <span className="public-page__hero-eyebrow" style={theme.accentTextStyle}>
                Minha pagina
              </span>
              <h1 className="public-page__hero-title" style={theme.titleStyle}>
                {renderTitle(page?.title, "Minha pagina")}
              </h1>
              <p className="public-page__hero-bio">
                {page?.bio || "Comece a editar sua bio na area administrativa."}
              </p>
            </div>
          </div>
        </motion.section>

        {primaryLinks.length ? (
          <motion.div
            className={linksLayout}
            initial={motionPreset.wrapper.initial}
            animate={motionPreset.wrapper.animate}
            variants={motionPreset.containerVariants}
          >
            {primaryLinks.map((link) => (
              <motion.div key={link.id} variants={motionPreset.itemVariants}>
                <PrimaryLinkCard
                  link={link}
                  interactive={interactive}
                  theme={theme}
                  preview={previewMode}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {socialLinks.length ? (
          <motion.section
            className="public-page__social-shell"
            style={theme.softSurfaceStyle}
            variants={motionPreset.cardVariants}
            initial={motionPreset.wrapper.initial}
            animate={motionPreset.wrapper.animate}
          >
            <div className="public-page__social-header">
              <span className="public-page__section-eyebrow">Social</span>
              <strong style={theme.titleStyle}>Continue acompanhando</strong>
            </div>
            <div className={secondaryLayout.containerClassName}>
              {socialLinks.map((link) => (
                <SecondaryLinkChip
                  key={link.id}
                  link={link}
                  theme={theme}
                  interactive={interactive}
                />
              ))}
            </div>
          </motion.section>
        ) : null}

        {activeCollections.length ? (
          <motion.div
            className="public-page__collections"
            initial={motionPreset.wrapper.initial}
            animate={motionPreset.wrapper.animate}
            variants={motionPreset.containerVariants}
          >
            {activeCollections.map((collection) => (
              <motion.div key={collection.id} variants={motionPreset.itemVariants}>
                <CollectionCard
                  collection={collection}
                  theme={theme}
                  interactive={interactive}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : null}

        {page?.shop?.isActive ? (
          <motion.div
            variants={motionPreset.cardVariants}
            initial={motionPreset.wrapper.initial}
            animate={motionPreset.wrapper.animate}
          >
            <ShopCard shop={page.shop} theme={theme} />
          </motion.div>
        ) : null}

        {!hasVisibleContent ? (
          <motion.div
            className="public-page__empty public-page__empty--standalone"
            style={theme.softSurfaceStyle}
            variants={motionPreset.cardVariants}
            initial={motionPreset.wrapper.initial}
            animate={motionPreset.wrapper.animate}
          >
            Seu conteudo ativo aparecera aqui assim que voce habilitar links,
            colecoes ou o bloco de shop.
          </motion.div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div
      className={`public-page ${mode === "preview" ? "public-page--preview" : ""}`}
      style={style}
    >
      <div className="public-page__halo public-page__halo--top" />
      <div className="public-page__halo public-page__halo--bottom" />

      <div className="public-page__header">
        <div className="public-page__avatar-shell">
          {page?.avatarUrl ? (
            <img className="public-page__avatar" src={page.avatarUrl} alt={page.title || "Avatar"} />
          ) : (
            <div className="public-page__avatar public-page__avatar--placeholder">
              {String(page?.title || "M").slice(0, 1)}
            </div>
          )}
        </div>
        <h1 className="public-page__title">{page?.title || "Minha Página"}</h1>
        <p className="public-page__bio">{page?.bio || "Comece a editar sua bio na área administrativa."}</p>
      </div>

      <div className="public-page__stack">
        {activeLinks.map((link, index) => renderLinkCard(link, interactive, radius, index))}

        {activeCollections.map((collection) => (
          <section
            key={collection.id}
            className="public-page__collection"
            style={{ borderRadius: radius }}
          >
            <div className="public-page__section-header">
              <h2>{collection.title || "Coleção"}</h2>
            </div>
            <div className="public-page__collection-items">
              {collection.items.length ? (
                collection.items.map((item) => renderLinkCard(item, interactive, radius, item.id))
              ) : (
                <div className="public-page__empty">Nenhum item ativo nesta coleção.</div>
              )}
            </div>
          </section>
        ))}

        {page?.shop?.isActive ? (
          <section className="public-page__shop" style={{ borderRadius: radius }}>
            <div className="public-page__section-header">
              <h2>{page.shop.title || "Loja"}</h2>
              <span>{Number(page.shop.productsCount || 0)} produtos</span>
            </div>
            <p className="public-page__shop-copy">
              {page.shop.description || "Configure este bloco de loja no painel administrativo."}
            </p>
          </section>
        ) : null}

        {!activeLinks.length &&
        !activeCollections.length &&
        !(page?.shop?.isActive) ? (
          <div className="public-page__empty">
            Seu conteúdo ativo aparecerá aqui assim que você o habilitar.
          </div>
        ) : null}
      </div>
    </div>
  );
}
