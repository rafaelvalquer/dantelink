import { BarChart3, Compass, Eye, MousePointerClick, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMyPage, getMyPageAnalytics } from "../app/api.js";
import SectionCard from "../components/editor/SectionCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";

const RANGE_OPTIONS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "28d", label: "Últimos 28 dias" },
  { value: "lifetime", label: "Tempo total" },
];

const CHART_SERIES = [
  { key: "pageViews", label: "Visitas", colorClass: "is-views" },
  { key: "linkClicks", label: "Cliques em links", colorClass: "is-links" },
  { key: "productClicks", label: "Cliques em produtos", colorClass: "is-products" },
];

function formatCardValue(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function getRangeLabel(range = "7d") {
  return RANGE_OPTIONS.find((option) => option.value === range)?.label || "Últimos 7 dias";
}

function getTopOriginLabel(origins = []) {
  return origins.find((item) => Number(item.total || 0) > 0)?.label || "Direto";
}

function formatAxisDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function getChartModel(items = []) {
  const maxValue = items.reduce((max, item) => {
    return Math.max(
      max,
      Number(item?.pageViews || 0),
      Number(item?.linkClicks || 0),
      Number(item?.productClicks || 0),
    );
  }, 0);

  const safeMax = maxValue <= 4 ? 4 : Math.ceil((maxValue + 1) / 4) * 4;
  const ticks = Array.from({ length: 5 }, (_, index) => Math.round((safeMax / 4) * index));

  return {
    maxValue: safeMax,
    ticks,
  };
}

function getVisibleLabelStep(total) {
  if (total <= 6) {
    return 1;
  }

  if (total <= 10) {
    return 2;
  }

  if (total <= 18) {
    return 3;
  }

  return Math.ceil(total / 6);
}

function AnalyticsChart({ items = [] }) {
  if (!items.length) {
    return <div className="empty-state">Ainda não há dados suficientes para este período.</div>;
  }

  const width = 860;
  const height = 360;
  const padding = {
    top: 18,
    right: 10,
    bottom: 48,
    left: 44,
  };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const slotWidth = plotWidth / items.length;
  const groupWidth = Math.min(58, slotWidth * 0.74);
  const gap = 4;
  const barWidth = Math.max(6, (groupWidth - gap * 2) / CHART_SERIES.length);
  const labelStep = getVisibleLabelStep(items.length);
  const { maxValue, ticks } = getChartModel(items);

  return (
    <div className="analytics-chart-shell">
      <div className="analytics-chart">
        <svg
          className="analytics-chart__svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Gráfico de atividade da página com visitas, cliques em links e cliques em produtos"
        >
          {ticks.map((tickValue, index) => {
            const ratio = maxValue ? tickValue / maxValue : 0;
            const y = padding.top + plotHeight - ratio * plotHeight;

            return (
              <g key={tickValue}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  className={`analytics-chart__grid-line ${index === 0 ? "is-baseline" : ""}`}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="analytics-chart__tick-label"
                >
                  {formatCardValue(tickValue)}
                </text>
              </g>
            );
          })}

          {items.map((item, itemIndex) => {
            const groupX = padding.left + slotWidth * itemIndex + (slotWidth - groupWidth) / 2;
            const labelX = padding.left + slotWidth * itemIndex + slotWidth / 2;

            return (
              <g key={`${item.date}-${itemIndex}`}>
                {CHART_SERIES.map((series, seriesIndex) => {
                  const value = Number(item?.[series.key] || 0);
                  const heightRatio = maxValue ? value / maxValue : 0;
                  const barHeight = Math.max(value > 0 ? 8 : 0, heightRatio * plotHeight);
                  const x = groupX + seriesIndex * (barWidth + gap);
                  const y = padding.top + plotHeight - barHeight;

                  return (
                    <rect
                      key={`${item.date}-${series.key}`}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="6"
                      className={`analytics-chart__bar ${series.colorClass}`}
                    />
                  );
                })}

                {itemIndex % labelStep === 0 || itemIndex === items.length - 1 ? (
                  <text
                    x={labelX}
                    y={height - 16}
                    textAnchor="middle"
                    className="analytics-chart__axis-label"
                  >
                    {formatAxisDate(item.date)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="analytics-chart__legend" aria-hidden="true">
        {CHART_SERIES.map((series) => (
          <span key={series.key} className="analytics-chart__legend-item">
            <i className={`analytics-chart__legend-swatch ${series.colorClass}`} />
            {series.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsDashboardPage() {
  const [page, setPage] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState("28d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [pageResponse, analyticsResponse] = await Promise.all([
          getMyPage(),
          getMyPageAnalytics(range),
        ]);

        if (!active) {
          return;
        }

        setPage(pageResponse.page);
        setAnalytics(analyticsResponse.analytics);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [range]);

  const kpis = useMemo(
    () => [
      {
        key: "views",
        label: "Visitas",
        value: analytics?.summary?.pageViews,
        note: getRangeLabel(range),
        icon: Eye,
      },
      {
        key: "links",
        label: "Cliques em links",
        value: analytics?.summary?.linkClicks,
        note: getRangeLabel(range),
        icon: MousePointerClick,
      },
      {
        key: "products",
        label: "Cliques em produtos",
        value: analytics?.summary?.productClicks,
        note: getRangeLabel(range),
        icon: ShoppingBag,
      },
      {
        key: "origin",
        label: "Origem principal",
        value: analytics?.summary?.primaryOrigin || getTopOriginLabel(analytics?.origins),
        note: "Entrada mais recorrente",
        icon: Compass,
      },
    ],
    [analytics?.origins, analytics?.summary, range],
  );

  return (
    <EditorShell
      title="Insights"
      eyebrow={null}
      description={null}
      page={page}
      publishedPage={page}
      error={error}
      headerClassName="editor-shell__header--minimal"
      headerActions={
        <div className="analytics-header__actions">
          <label className="analytics-range-select">
            <span className="sr-only">Selecionar período</span>
            <select
              className="ui-select"
              value={range}
              onChange={(event) => setRange(event.target.value)}
              aria-label="Selecionar período dos insights"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      }
    >
      {loading ? (
        <div className="loading-state">Carregando insights...</div>
      ) : (
        <div className="analytics-dashboard">
          <section className="analytics-kpi-grid" aria-label="Resumo dos insights">
            {kpis.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.key} className="analytics-kpi-card">
                  <div className="analytics-kpi-card__icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={2.1} />
                  </div>
                  <div className="analytics-kpi-card__body">
                    <strong>{item.key === "origin" ? item.value : formatCardValue(item.value)}</strong>
                    <span>{item.label}</span>
                    <small>{item.note}</small>
                  </div>
                </article>
              );
            })}
          </section>

          <SectionCard
            title="Atividade da página"
            description="Acompanhe a evolução diária de visitas, cliques em links e cliques em produtos."
            actions={
              <div className="analytics-card__hint">
                <BarChart3 size={16} strokeWidth={2.1} />
                <span>{getRangeLabel(range)}</span>
              </div>
            }
          >
            <AnalyticsChart items={analytics?.daily || []} />
          </SectionCard>

          <div className="analytics-secondary-grid">
            <SectionCard
              title="Origens"
              description="Distribuição simplificada de onde vieram as visitas."
            >
              {analytics?.origins?.length ? (
                <div className="analytics-table">
                  <div className="analytics-table__header">
                    <span>Origem</span>
                    <span>Total</span>
                  </div>
                  {analytics.origins.map((item) => (
                    <div key={item.label} className="analytics-table__row">
                      <span>{item.label}</span>
                      <strong>{formatCardValue(item.total)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Ainda não há dados de origem neste período.</div>
              )}
            </SectionCard>

            <SectionCard
              title="Links mais clicados"
              description="Os links que mais receberam cliques no período."
            >
              {analytics?.topLinks?.length ? (
                <div className="analytics-ranking">
                  {analytics.topLinks.map((item, index) => (
                    <div key={item.id} className="analytics-ranking__row">
                      <div className="analytics-ranking__copy">
                        <span className="analytics-ranking__index">{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.type === "shop-preview" ? "Prévia da loja" : "Link"}</span>
                        </div>
                      </div>
                      <strong>{formatCardValue(item.total)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Nenhum clique em link registrado neste período.</div>
              )}
            </SectionCard>

            <SectionCard
              title="Produtos mais clicados"
              description="Os produtos que mais direcionaram tráfego para fora."
            >
              {analytics?.topProducts?.length ? (
                <div className="analytics-ranking">
                  {analytics.topProducts.map((item, index) => (
                    <div key={item.id} className="analytics-ranking__row">
                      <div className="analytics-ranking__copy">
                        <span className="analytics-ranking__index">{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <strong>{item.title}</strong>
                          <span>Produto</span>
                        </div>
                      </div>
                      <strong>{formatCardValue(item.total)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Nenhum clique em produto registrado neste período.</div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </EditorShell>
  );
}
