import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { analyticsService } from "../services/analytics.service";
import useAuthStore from "../store/authStore";
import Layout from "../components/layout/Layout";

// ── Color palette matching our design system ──
const COLORS = {
  accent: "#e8a045",
  success: "#22c55e",
  info: "#3b82f6",
  warning: "#f59e0b",
  danger: "#ef4444",
  ink4: "#52525b",
};

const STATUS_COLORS = {
  TODO: "#52525b",
  IN_PROGRESS: "#3b82f6",
  IN_REVIEW: "#f59e0b",
  DONE: "#22c55e",
};

// ── Custom tooltip ──
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-2 border border-border-3 rounded-lg px-3 py-2 shadow-modal">
      {label && <p className="text-[11px] text-ink-4 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p
          key={i}
          className="text-[12.5px] font-medium"
          style={{ color: p.color || COLORS.accent }}
        >
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ──
const StatCard = ({ label, value, sub, color = "accent", icon }) => {
  const colors = {
    accent: "bg-accent/10  border-accent/20  text-accent-300",
    success: "bg-success/10 border-success/20 text-success",
    info: "bg-info/10    border-info/20    text-info",
    warning: "bg-warning/10 border-warning/20 text-warning",
    danger: "bg-danger/10  border-danger/20  text-danger",
  };

  return (
    <div className="card-base px-4 py-4">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11.5px] text-ink-4 font-medium">{label}</p>
        {icon && (
          <div
            className={`w-7 h-7 rounded-md border flex items-center justify-center text-sm ${colors[color]}`}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-ink-1 tracking-tight leading-none mb-1">
        {value}
      </p>
      {sub && <p className="text-[11.5px] text-ink-4">{sub}</p>}
    </div>
  );
};

// ── Section wrapper ──
const Section = ({ title, children, className = "" }) => (
  <div className={`card-base p-5 ${className}`}>
    <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-4">
      {title}
    </p>
    {children}
  </div>
);

// ── Empty chart state ──
const EmptyChart = ({ message = "No data yet" }) => (
  <div className="flex flex-col items-center justify-center h-40 gap-2">
    <div className="w-10 h-10 bg-surface-3 border border-border-2 rounded-xl flex items-center justify-center text-xl">
      📊
    </div>
    <p className="text-[12px] text-ink-4">{message}</p>
    <p className="text-[11px] text-ink-4">
      Complete some tasks to see data here
    </p>
  </div>
);

// ── Main Page ──
const AnalyticsPage = () => {
  const { workspaceId } = useParams();
  const { user } = useAuthStore();
  const [tab, setTab] = useState("workspace");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", workspaceId],
    queryFn: () => analyticsService.getDashboard(workspaceId),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-5 animate-pulse">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const overview = data?.overview || {};
  const tasksByDay = data?.tasksByDay || [];
  const tasksByStatus = data?.tasksByStatus || [];
  const teamPerformance = data?.teamPerformance || [];
  const projectProgress = data?.projectProgress || [];
  const personal = data?.personalStats || {};

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-1">
            Analytics
          </p>
          <h1 className="text-[22px] font-semibold text-ink-1 tracking-tight">
            Productivity insights
          </h1>
          <p className="text-[12.5px] text-ink-3 mt-1">
            Track your team's performance and project health
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-surface-2 border border-border-2 rounded-lg p-0.5 gap-0.5">
          {["workspace", "personal"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all capitalize
                ${
                  tab === t
                    ? "bg-surface-4 text-ink-1 shadow-card"
                    : "text-ink-4 hover:text-ink-2"
                }`}
            >
              {t === "workspace" ? "🏢 Team" : "👤 Personal"}
            </button>
          ))}
        </div>
      </div>

      {/* ══ WORKSPACE TAB ══ */}
      {tab === "workspace" && (
        <div className="space-y-5">
          {/* ── Overview stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total tasks"
              value={overview.totalTasks ?? "—"}
              sub="across all projects"
              icon="📋"
              color="accent"
            />
            <StatCard
              label="Completed"
              value={overview.completedTasks ?? "—"}
              sub={`${overview.completionRate ?? 0}% completion rate`}
              icon="✅"
              color="success"
            />
            <StatCard
              label="Overdue"
              value={overview.overdueTasks ?? "—"}
              sub="need attention"
              icon="⚠️"
              color={overview.overdueTasks > 0 ? "danger" : "success"}
            />
            <StatCard
              label="Productivity score"
              value={`${overview.productivityScore ?? 0}%`}
              sub="based on completion"
              icon="⚡"
              color="info"
            />
          </div>

          {/* ── Row 2: Line chart + Pie chart ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Tasks completed per day */}
            <Section
              title="Tasks completed — last 7 days"
              className="lg:col-span-2"
            >
              {tasksByDay.every((d) => d.count === 0) ? (
                <EmptyChart message="No tasks completed this week" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={tasksByDay}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#52525b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#52525b" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Tasks"
                      stroke={COLORS.accent}
                      strokeWidth={2}
                      dot={{ fill: COLORS.accent, r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: COLORS.accent }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Section>

            {/* Tasks by status pie */}
            <Section title="Tasks by status">
              {tasksByStatus.length === 0 ? (
                <EmptyChart message="No tasks found" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {tasksByStatus.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={STATUS_COLORS[entry.status] || COLORS.ink4}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="space-y-1.5 mt-2">
                    {tasksByStatus.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11.5px]"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              background:
                                STATUS_COLORS[s.status] || COLORS.ink4,
                            }}
                          />
                          <span className="text-ink-3">{s.label}</span>
                        </div>
                        <span className="font-medium text-ink-2">
                          {s.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Section>
          </div>

          {/* ── Row 3: Team performance + Project progress ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Team performance bar chart */}
            <Section title="Team performance — last 30 days">
              {teamPerformance.length === 0 ? (
                <EmptyChart message="No team data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={teamPerformance}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                    barSize={20}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1f1f23"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#52525b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => v?.split(" ")[0]}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#52525b" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill={COLORS.success}
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="inProgress"
                      name="In progress"
                      fill={COLORS.info}
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Section>

            {/* Project progress */}
            <Section title="Project progress">
              {projectProgress.length === 0 ? (
                <EmptyChart message="No projects found" />
              ) : (
                <div className="space-y-4">
                  {projectProgress.map((proj, i) => (
                    <div key={proj.id || i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: proj.color || COLORS.accent }}
                          />
                          <span className="text-[12.5px] text-ink-2 font-medium truncate">
                            {proj.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {proj.overduetasks > 0 && (
                            <span className="text-[10.5px] text-danger/80 bg-danger/10 border border-danger/20 px-1.5 py-0.5 rounded-full">
                              {proj.overduetasks} overdue
                            </span>
                          )}
                          <span className="text-[12px] font-semibold text-ink-1 w-8 text-right">
                            {proj.progresspercent ?? 0}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-surface-4 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${proj.progresspercent ?? 0}%`,
                            background: proj.color || COLORS.accent,
                          }}
                        />
                      </div>

                      <div className="flex justify-between mt-1">
                        <span className="text-[11px] text-ink-4">
                          {proj.donetasks ?? 0} of {proj.totaltasks ?? 0} tasks
                          done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      )}

      {/* ══ PERSONAL TAB ══ */}
      {tab === "personal" && (
        <div className="space-y-5">
          {/* Personal stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Completed this week"
              value={personal.completedThisWeek ?? "—"}
              sub="tasks done"
              icon="🔥"
              color="accent"
            />
            <StatCard
              label="Completed this month"
              value={personal.completedThisMonth ?? "—"}
              sub="tasks done"
              icon="📅"
              color="success"
            />
            <StatCard
              label="Assigned to me"
              value={personal.assignedToMe ?? "—"}
              sub="in progress"
              icon="📋"
              color="info"
            />
            <StatCard
              label="Overdue"
              value={personal.overdueAssigned ?? "—"}
              sub="need attention"
              icon="⚠️"
              color={personal.overdueAssigned > 0 ? "danger" : "success"}
            />
          </div>

          {/* Personal tip card */}
          <div className="card-base p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center text-accent-400 text-base flex-shrink-0">
                💡
              </div>
              <div>
                <p className="text-[13px] font-semibold text-ink-1 mb-1">
                  {personal.completedThisWeek > 0
                    ? `Great work this week, ${user?.name?.split(" ")[0]}!`
                    : `Ready to have a productive week, ${user?.name?.split(" ")[0]}?`}
                </p>
                <p className="text-[12.5px] text-ink-3 leading-relaxed">
                  {personal.overdueAssigned > 0
                    ? `You have ${personal.overdueAssigned} overdue task${personal.overdueAssigned > 1 ? "s" : ""}. Focus on clearing those first before taking on new work.`
                    : personal.completedThisWeek > 3
                      ? `You've completed ${personal.completedThisWeek} tasks this week. You're on a great streak — keep it up!`
                      : `You have ${personal.assignedToMe ?? 0} task${personal.assignedToMe !== 1 ? "s" : ""} assigned. Start with the highest priority ones.`}
                </p>
              </div>
            </div>
          </div>

          {/* AI Standup generator */}
          <StandupGenerator />
        </div>
      )}
    </Layout>
  );
};

// ── Standup Generator component ──
const StandupGenerator = () => {
  const [standup, setStandup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await import("../services/ai.service").then((m) =>
        m.aiService.generateStandup(),
      );
      setStandup(res.standup);
    } catch (err) {
      const toast = (await import("react-hot-toast")).default;
      toast.error("Failed to generate standup");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!standup?.fullText) return;
    navigator.clipboard.writeText(standup.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section title="AI standup generator">
      <p className="text-[12.5px] text-ink-3 mb-4 leading-relaxed">
        Generate your daily standup update automatically from your task
        activity. Copy and paste it into Slack or Teams.
      </p>

      {!standup ? (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-accent/10 hover:bg-accent/15 border border-accent/25 hover:border-accent/35 rounded-lg text-[13px] font-medium text-accent-300 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Generating standup...
            </>
          ) : (
            <>
              <span>✦</span>
              Generate my standup
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Standup sections */}
          {[
            { label: "✅ Yesterday", value: standup.yesterday },
            { label: "🎯 Today", value: standup.today },
            { label: "🚧 Blockers", value: standup.blockers },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-3 border border-border-2 rounded-lg p-3"
            >
              <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-1">
                {s.label}
              </p>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">
                {s.value}
              </p>
            </div>
          ))}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-surface-3 hover:bg-surface-4 border border-border-2 rounded-lg text-[12.5px] font-medium text-ink-2 transition-colors"
            >
              {copied ? "✓ Copied!" : "📋 Copy to clipboard"}
            </button>
            <button
              onClick={() => {
                setStandup(null);
              }}
              className="px-3 py-2 text-[12px] text-ink-4 hover:text-ink-2 hover:bg-surface-3 rounded-lg transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </Section>
  );
};

export default AnalyticsPage;
