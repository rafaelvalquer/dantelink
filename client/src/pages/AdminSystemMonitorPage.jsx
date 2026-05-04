import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  LayoutDashboard,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMyPage, getSystemMonitorOverview } from "../app/api.js";
import SectionCard from "../components/editor/SectionCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";

function formatCardValue(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) {
    return "Ainda sem cadastros";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Data indisponivel";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

function formatUptime(seconds = 0) {
  const total = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min no ar`;
  }

  return `${minutes}min no ar`;
}

function getStatusTone(value = "") {
  return String(value || "").toLowerCase().includes("oper")
    || String(value || "").toLowerCase().includes("conect")
    ? "is-good"
    : "is-warning";
}

export default function AdminSystemMonitorPage() {
  const [page, setPage] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadData({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [pageResponse, overviewResponse] = await Promise.all([
        getMyPage(),
        getSystemMonitorOverview(),
      ]);

      setPage(pageResponse.page);
      setOverview(overviewResponse.overview);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const kpis = useMemo(
    () => [
      {
        key: "app",
        label: "Saude da aplicacao",
        value: overview?.health?.appStatus || "Atencao",
        note: formatUptime(overview?.health?.uptimeSeconds),
        icon: CheckCircle2,
        tone: getStatusTone(overview?.health?.appStatus),
      },
      {
        key: "db",
        label: "Banco de dados",
        value: overview?.health?.dbStatus || "Desconectado",
        note: "Status atual da conexao Mongo",
        icon: Database,
        tone: getStatusTone(overview?.health?.dbStatus),
      },
      {
        key: "users",
        label: "Contas criadas",
        value: formatCardValue(overview?.counts?.usersTotal),
        note: "Usuarios cadastrados na plataforma",
        icon: Users,
        tone: "is-neutral",
      },
      {
        key: "pages",
        label: "Páginas criadas",
        value: formatCardValue(overview?.counts?.pagesTotal),
        note: "Workspaces com página ativa",
        icon: LayoutDashboard,
        tone: "is-neutral",
      },
    ],
    [overview],
  );

  return (
    <EditorShell
      title="Monitoria"
      eyebrow={null}
      description={null}
      page={page}
      publishedPage={page}
      error={error}
      headerClassName="editor-shell__header--minimal"
      headerActions={(
        <button
          type="button"
          className="ui-button ui-button--ghost ui-button--sm system-monitor__refresh-button"
          onClick={() => void loadData({ silent: true })}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={15}
            strokeWidth={2}
            className={refreshing ? "is-spinning" : ""}
          />
          <span>{refreshing ? "Atualizando..." : "Atualizar"}</span>
        </button>
      )}
    >
      {loading ? (
        <div className="loading-state">Carregando monitoria do sistema...</div>
      ) : (
        <div className="analytics-dashboard system-monitor">
          <section className="analytics-kpi-grid" aria-label="Resumo da monitoria">
            {kpis.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.key} className={`analytics-kpi-card system-monitor__kpi ${item.tone}`}>
                  <div className="analytics-kpi-card__icon" aria-hidden="true">
                    <Icon size={19} strokeWidth={2.1} />
                  </div>
                  <div className="analytics-kpi-card__body">
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                    <small>{item.note}</small>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="analytics-secondary-grid system-monitor__secondary-grid">
            <SectionCard
              title="Ultimo cadastro"
              description="Usuario criado mais recentemente no sistema."
            >
              <div className="system-monitor__spotlight">
                <div className="system-monitor__spotlight-icon" aria-hidden="true">
                  <Clock3 size={18} strokeWidth={2.1} />
                </div>
                <div className="system-monitor__spotlight-copy">
                  <strong>{formatDateTime(overview?.latest?.latestUserCreatedAt)}</strong>
                  <span>Horario da criacao mais recente</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Importacoes de produto"
              description="Resumo das importacoes tentadas desde que o servidor foi iniciado."
            >
              <div className="system-monitor__metrics-list">
                <div className="system-monitor__metric-row">
                  <span>Completas</span>
                  <strong>{formatCardValue(overview?.imports?.successTotal)}</strong>
                </div>
                <div className="system-monitor__metric-row">
                  <span>Parciais</span>
                  <strong>{formatCardValue(overview?.imports?.partialTotal)}</strong>
                </div>
                <div className="system-monitor__metric-row">
                  <span>Manuais</span>
                  <strong>{formatCardValue(overview?.imports?.manualTotal)}</strong>
                </div>
                <div className="system-monitor__metric-row is-danger">
                  <span>Falhas</span>
                  <strong>{formatCardValue(overview?.imports?.failedTotal)}</strong>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Erros recentes"
              description="Ultimos erros operacionais capturados pela aplicacao."
            >
              {overview?.recentErrors?.length ? (
                <div className="system-monitor__event-list">
                  {overview.recentErrors.map((item) => (
                    <article
                      key={`${item.requestId}-${item.timestamp}-${item.code}`}
                      className="system-monitor__event-card"
                    >
                      <div className="system-monitor__event-top">
                        <span className="system-monitor__event-code">{item.code || "ERRO"}</span>
                        <time dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
                      </div>
                      <strong>{item.message || "Erro sem mensagem."}</strong>
                      <div className="system-monitor__event-meta">
                        <span>{item.route || "Rota nao informada"}</span>
                        {item.requestId ? <span>Req {item.requestId}</span> : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">Nenhum erro recente registrado.</div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Leitura rapida do ambiente"
            description="Visao resumida para acompanhar saude, base de usuarios e sinais de falha sem expor dados sensiveis."
          >
            <div className="system-monitor__overview-panel">
              <div className="system-monitor__overview-pill">
                <CheckCircle2 size={16} strokeWidth={2.1} />
                <span>Aplicacao: {overview?.health?.appStatus || "Atencao"}</span>
              </div>
              <div className="system-monitor__overview-pill">
                <Database size={16} strokeWidth={2.1} />
                <span>Mongo: {overview?.health?.dbStatus || "Desconectado"}</span>
              </div>
              <div className="system-monitor__overview-pill">
                <Users size={16} strokeWidth={2.1} />
                <span>{formatCardValue(overview?.counts?.usersTotal)} contas criadas</span>
              </div>
              <div className="system-monitor__overview-pill">
                <AlertTriangle size={16} strokeWidth={2.1} />
                <span>{formatCardValue(overview?.recentErrors?.length)} erros recentes em memoria</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </EditorShell>
  );
}
