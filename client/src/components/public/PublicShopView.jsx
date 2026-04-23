import { ExternalLink, ShoppingBag } from "lucide-react";
import { getMyPageTheme } from "./myPageTheme.js";
import { PublicPageHero, PublicPageScreen } from "./PublicPageUi.jsx";
import { formatProductPrice, getShopPath, sortActiveProducts } from "./shopHelpers.js";

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function PublicShopView({ page, interactive = true }) {
  const theme = getMyPageTheme(page || {});
  const products = sortActiveProducts(page?.shop?.products || []);
  const linksPath = `/${page?.slug || ""}`;
  const shopPath = getShopPath(page);

  return (
    <PublicPageScreen page={page} theme={theme} mode="public">
      <div className="public-page__stage">
        <div className="public-page__main-column">
          <section className="public-page__shell" style={theme.shellStyle}>
            <div className="public-page__shell-content">
              <div className="public-page__shell-block">
                <PublicPageHero
                  page={page}
                  theme={theme}
                  eyebrow="Minha loja"
                  description={
                    page?.shop?.description || "Confira os produtos disponiveis na loja."
                  }
                />
                <div className="public-page__shop-toggle" aria-label="Navegacao da pagina">
                  <a href={linksPath} className="public-page__shop-toggle-option">
                    Links
                  </a>
                  <a
                    href={shopPath}
                    className="public-page__shop-toggle-option is-active"
                    aria-current="page"
                  >
                    Shop
                  </a>
                </div>
              </div>

              {products.length ? (
                <div className="public-page__shop-grid">
                  {products.map((product) => {
                    const priceLabel = formatProductPrice(product);

                    return (
                      <a
                        key={product.id}
                        className="public-page__shop-product"
                        style={theme.surfaceStyle}
                        href={interactive ? product.sourceUrl : undefined}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="public-page__shop-product-media">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.title} />
                          ) : (
                            <div
                              className="public-page__shop-product-placeholder"
                              style={theme.softSurfaceStyle}
                            >
                              <ShoppingBag size={24} />
                            </div>
                          )}
                        </div>
                        <div className="public-page__shop-product-copy">
                          <span className="public-page__shop-product-domain">
                            {(() => {
                              try {
                                return new URL(product.sourceUrl).hostname.replace(/^www\./, "");
                              } catch {
                                return "Produto";
                              }
                            })()}
                          </span>
                          <strong>{product.title}</strong>
                          {priceLabel ? (
                            <span className="public-page__shop-product-price">{priceLabel}</span>
                          ) : null}
                        </div>
                        <div
                          className={cls("public-page__shop-product-action", !interactive && "is-disabled")}
                          style={theme.softSurfaceStyle}
                        >
                          <ExternalLink size={16} />
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="public-page__shop-empty" style={theme.surfaceStyle}>
                  Nenhum produto ativo no momento.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PublicPageScreen>
  );
}
