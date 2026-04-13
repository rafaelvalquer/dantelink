function sortActive(items = []) {
  return [...items]
    .filter((item) => item?.isActive)
    .sort((left, right) => Number(left?.order ?? 0) - Number(right?.order ?? 0));
}

function getButtonRadius(buttonStyle) {
  if (buttonStyle === "rounded-full") {
    return "999px";
  }

  if (buttonStyle === "square-soft") {
    return "18px";
  }

  return "28px";
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
  const theme = page?.theme || {};
  const activeLinks = sortActive(page?.links || []);
  const activeCollections = sortActive(page?.collections || []).map((collection) => ({
    ...collection,
    items: sortActive(collection.items || []),
  }));
  const radius = getButtonRadius(theme.buttonStyle);

  const style = {
    "--page-background": theme.backgroundColor || "#c4b5fd",
    "--page-surface": theme.cardColor || "#f8fafc",
    "--page-text": theme.textColor || "#111827",
    "--page-radius": radius,
  };

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
