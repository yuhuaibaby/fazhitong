import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { ChartTooltip } from "../../shared/components/ChartTooltip";
import {
  tokenUsageApi,
  type TokenUsageSummary,
  type TokenUsageByTask,
  type TokenUsageByModel,
  type TokenUsageDaily,
} from "../../api/client";
import { Cpu, ArrowUpRight, ArrowDownRight, Clock, Activity, AlertTriangle } from "lucide-react";

/* ─── 设计 token：与系统统一的克制色板 ─── */
const C = {
  primary: "#5b21b6",
  primarySoft: "#f0e4ff",
  blue: "#4f6d8a",
  green: "#2d8659",
  muted: "#64748b",
  border: "#e2e8f0",
  text: "#0f172a",
  surface: "#ffffff",
  surfaceSoft: "#f8fafc",
};

const PIE_COLORS = [C.primary, C.blue, C.green, "#8b98a8", "#b7791f", "#7c3aed"];

const CHART_ANIMATION = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 900,
  animationEasing: "ease-out",
} as const;

function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

/* ─── 指标卡片（与 dashboard dash-stat-card 统一） ─── */
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Cpu;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="tks-stat-card">
      <div className="tks-stat-icon" style={{ background: `${color}12`, color }}>
        <Icon size={20} />
      </div>
      <div className="tks-stat-body">
        <span className="tks-stat-label">{label}</span>
        <strong className="tks-stat-value">{value}</strong>
        <span className="tks-stat-sub">{sub}</span>
      </div>
    </div>
  );
}

/* ─── 骨架屏 ─── */
function Skeleton() {
  return (
    <div className="tks-page">
      <div className="tks-stats">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="tks-stat-card" key={i}>
            <span className="tks-sk tks-sk-icon" />
            <div className="tks-stat-body">
              <span className="tks-sk tks-sk-line" style={{ width: 56 }} />
              <span className="tks-sk tks-sk-line tks-sk-line--lg" />
              <span className="tks-sk tks-sk-line" style={{ width: 80 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="tks-charts-row">
        <div className="dash-card">
          <span className="tks-sk tks-sk-title" />
          <div className="tks-sk tks-sk-area" />
        </div>
        <div className="dash-card">
          <span className="tks-sk tks-sk-title" />
          <div className="tks-sk tks-sk-donut" />
        </div>
      </div>
    </div>
  );
}

/* ─── 错误态 ─── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="empty-state">
      <AlertTriangle size={40} className="empty-state__icon" style={{ color: "#b7791f" }} />
      <p>数据加载失败</p>
      <span className="empty-state__hint">{message}</span>
      <button className="ghost-button" style={{ marginTop: 16 }} onClick={onRetry}>
        重新加载
      </button>
    </div>
  );
}

/* ─── 自定义趋势图 tooltip ─── */
function DailyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "10px 14px", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,.08)",
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <strong>{formatTokens(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

/* ─── 主组件 ─── */
const MIN_LOADING_MS = 240;

export function TokenStatsPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<TokenUsageSummary | null>(null);
  const [byTask, setByTask] = useState<TokenUsageByTask[]>([]);
  const [byModel, setByModel] = useState<TokenUsageByModel[]>([]);
  const [daily, setDaily] = useState<TokenUsageDaily[]>([]);

  const fetchData = () => {
    let cancelled = false;
    const isFirstLoad = !summary && !error;
    if (isFirstLoad) setInitialLoading(true);
    else setRefreshing(true);
    setError(null);
    const startedAt = Date.now();
    Promise.all([
      tokenUsageApi.summary(days),
      tokenUsageApi.byTask(days),
      tokenUsageApi.byModel(days),
      tokenUsageApi.daily(days),
    ]).then(([s, t, m, d]) => {
      if (cancelled) return;
      setSummary(s);
      setByTask(t);
      setByModel(m);
      setDaily(d);
    }).catch((err) => {
      if (!cancelled) setError(err?.message || "网络请求失败，请检查后端服务是否启动");
    }).finally(() => {
      if (!cancelled) {
        const elapsed = Date.now() - startedAt;
        const remaining = MIN_LOADING_MS - elapsed;
        const finish = () => { setInitialLoading(false); setRefreshing(false); };
        if (remaining > 0) setTimeout(finish, remaining);
        else finish();
      }
    });
    return () => { cancelled = true; };
  };

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, [days]);

  const taskBarData = useMemo(() =>
    byTask.map((t) => ({ name: t.label, 输入词元: t.promptTokens, 输出词元: t.completionTokens })),
  [byTask]);

  const modelPieData = useMemo(() =>
    byModel.map((m) => ({ name: m.model || m.provider || "未知", value: m.totalTokens })),
  [byModel]);

  if (initialLoading) return <Skeleton />;
  if (error) return <ErrorState message={error} onRetry={() => fetchData()} />;

  const hasData = summary && summary.callCount > 0;

  return (
    <div className={`tks-page${refreshing ? " tks-page--refreshing" : ""}`}>
      {/* ── 工具栏 ── */}
      <div className="tks-toolbar">
        <div className="tks-toolbar-left">
          <h2 className="tks-toolbar-title">词元统计</h2>
          <span className="tks-toolbar-desc">AI 调用的词元消耗、延迟与趋势分析</span>
        </div>
        <div className="tks-toolbar-right">
          <div
            className="tks-range-indicator"
            style={{ transform: `translateX(${[7, 15, 30, 90].indexOf(days) * 100}%)` }}
          />
          {[7, 15, 30, 90].map((d) => (
            <button
              key={d}
              className={`tks-range-btn${days === d ? " tks-range-btn--active" : ""}`}
              onClick={() => setDays(d)}
            >
              {d} 天
            </button>
          ))}
        </div>
      </div>

      {/* ── 指标卡片 ── */}
      <div className="tks-stats">
        <StatCard icon={Cpu} label="总词元消耗" value={formatTokens(summary?.totalTokens ?? 0)} sub={`近 ${days} 天`} color={C.primary} />
        <StatCard icon={ArrowUpRight} label="输入词元" value={formatTokens(summary?.promptTokens ?? 0)} sub={`占比 ${summary ? (summary.totalTokens > 0 ? Math.round(summary.promptTokens / summary.totalTokens * 100) : 0) : 0}%`} color={C.blue} />
        <StatCard icon={ArrowDownRight} label="输出词元" value={formatTokens(summary?.completionTokens ?? 0)} sub={`占比 ${summary ? (summary.totalTokens > 0 ? Math.round(summary.completionTokens / summary.totalTokens * 100) : 0) : 0}%`} color={C.green} />
        <StatCard icon={Clock} label="平均延迟" value={`${summary?.avgLatencyMs ?? 0}ms`} sub="单次调用平均耗时" color={C.muted} />
        <StatCard icon={Activity} label="调用次数" value={String(summary?.callCount ?? 0)} sub={`日均 ${summary ? Math.round(summary.callCount / days) : 0} 次`} color={C.primary} />
      </div>

      {!hasData && (
        <div className="empty-state">
          <Cpu size={40} className="empty-state__icon" />
          <p>暂无词元消耗记录</p>
          <span className="empty-state__hint">当 AI 任务执行后，词元数据将自动记录在此。</span>
        </div>
      )}

      {hasData && (
        <>
          {/* ── 趋势 + 模型分布 ── */}
          <div className="tks-charts-row">
            <div className="dash-card">
              <h3 className="dash-card-title">词元消耗趋势</h3>
              <div className="tks-chart-wrap">
                {daily.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={daily} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="tksGradIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.primary} stopOpacity={0.14} />
                          <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tksGradOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.blue} stopOpacity={0.14} />
                          <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={formatTokens} allowDecimals={false} />
                      <Tooltip content={<DailyTooltip />} />
                      <Area type="monotone" dataKey="promptTokens" name="输入词元" stroke={C.primary} fill="url(#tksGradIn)" strokeWidth={2} {...CHART_ANIMATION} />
                      <Area type="monotone" dataKey="completionTokens" name="输出词元" stroke={C.blue} fill="url(#tksGradOut)" strokeWidth={2} {...CHART_ANIMATION} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <div className="empty-state"><span className="empty-state__hint">暂无趋势数据</span></div>}
              </div>
            </div>

            <div className="dash-card">
              <h3 className="dash-card-title">模型消耗分布</h3>
              <div className="tks-chart-wrap">
                {modelPieData.length > 0 && modelPieData.some((d) => d.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={modelPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} cornerRadius={8} dataKey="value" stroke="none" {...CHART_ANIMATION}>
                          {modelPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="tks-legend">
                      {modelPieData.map((d, i) => (
                        <span key={d.name} className="tks-legend-item">
                          <span className="tks-legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {d.name} ({formatTokens(d.value)})
                        </span>
                      ))}
                    </div>
                  </>
                ) : <div className="empty-state"><span className="empty-state__hint">暂无模型数据</span></div>}
              </div>
            </div>
          </div>

          {/* ── 任务维度 ── */}
          <div className="dash-card">
            <h3 className="dash-card-title">按任务类型消耗</h3>
            <div className="tks-chart-wrap">
              {taskBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(200, taskBarData.length * 40)}>
                  <BarChart data={taskBarData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 4 }} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={formatTokens} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="输入词元" stackId="a" fill={C.primary} radius={[0, 0, 0, 0]} {...CHART_ANIMATION} />
                    <Bar dataKey="输出词元" stackId="a" fill={C.blue} radius={[4, 4, 4, 4]} {...CHART_ANIMATION} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><span className="empty-state__hint">暂无任务数据</span></div>}
            </div>
          </div>

          {/* ── 明细表格：复用系统 data-table 样式 ── */}
          <div className="dash-card">
            <h3 className="dash-card-title">模型调用明细</h3>
            <div className="data-table-wrap" style={{ minWidth: 0 }}>
              <table className="data-table tks-model-table" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>提供商</th>
                    <th>总词元</th>
                    <th>调用次数</th>
                    <th>平均延迟</th>
                    <th>单次平均词元</th>
                  </tr>
                </thead>
                <tbody>
                  {byModel.map((m) => (
                    <tr key={m.model + m.provider}>
                      <td><strong>{m.model || "-"}</strong></td>
                      <td>{m.provider || "-"}</td>
                      <td>{formatTokens(m.totalTokens)}</td>
                      <td>{m.calls}</td>
                      <td>{m.avgLatencyMs}ms</td>
                      <td>{m.calls > 0 ? formatTokens(Math.round(m.totalTokens / m.calls)) : "-"}</td>
                    </tr>
                  ))}
                  {byModel.length === 0 && (
                    <tr><td colSpan={6}><div className="empty-state"><span className="empty-state__hint">暂无数据</span></div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
