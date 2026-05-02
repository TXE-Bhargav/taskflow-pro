// DashboardPage.jsx — Dark premium workspace dashboard

import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../store/authStore";
import Layout from "../components/layout/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const WS_ACCENTS = [
  {
    text: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-400/20",
    dot: "bg-violet-400",
  },
  {
    text: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    dot: "bg-sky-400",
  },
  {
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    dot: "bg-emerald-400",
  },
  {
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    dot: "bg-amber-400",
  },
  {
    text: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-400/20",
    dot: "bg-rose-400",
  },
  {
    text: "text-cyan-400",
    bg: "bg-cyan-400/10",
    border: "border-cyan-400/20",
    dot: "bg-cyan-400",
  },
];
const getAccent = (i) => WS_ACCENTS[i % WS_ACCENTS.length];

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false); // ✅ new

  // AI suggestion state
  const [aiIdea, setAiIdea] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const generateWorkspaceSuggestion = async () => {
    if (!aiIdea.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/suggest-workspace", { rawIdea: aiIdea });
      reset({ name: res.data.name, description: res.data.description });
      toast.success("AI filled in the details!");
    } catch (e) {
      toast.error("AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  // Pending invites
  const { data: pendingInvites = [] } = useQuery({
    queryKey: ["pending-invites"],
    queryFn: async () => {
      const res = await api.get("/workspaces/invites/pending");
      return res.data;
    },
  });

  const acceptInvite = useMutation({
    mutationFn: async (workspaceId) => {
      const res = await api.post(`/workspaces/${workspaceId}/accept`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["workspaces"]);
      queryClient.invalidateQueries(["pending-invites"]);
      toast.success("Joined workspace!");
    },
  });

  const declineInvite = useMutation({
    mutationFn: async (workspaceId) => {
      const res = await api.post(`/workspaces/${workspaceId}/decline`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pending-invites"]);
      toast.success("Invite declined");
    },
  });

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await api.get("/workspaces");
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ["all-projects-members", workspaces.map((w) => w.id)],
    queryFn: async () => {
      const results = await Promise.all(
        workspaces.map((ws) =>
          api
            .get(`/workspaces/${ws.id}/projects`)
            .then((r) => (Array.isArray(r.data) ? r.data : r.data?.data || [])),
        ),
      );
      return results.flat();
    },
    enabled: workspaces.length > 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/workspaces", data);
      return res.data?.data || res.data;
    },
    onSuccess: (newWs) => {
      queryClient.invalidateQueries(["workspaces"]);
      toast.success("Workspace created!");
      reset();
      setShowModal(false);
      setAiIdea("");
      if (newWs?.id) navigate(`/workspace/${newWs.id}`);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to create workspace"),
  });

  const totalProjects = workspaces.reduce(
    (a, ws) => a + (ws._count?.projects || 0),
    0,
  );

  // ✅ Fix: backend returns m.userId (not m.user?.id) at the projectMembers level
  // but also includes m.user object — handle both shapes safely
  const getMemberId = (m) => m.user?.id || m.userId;

  const myProjectIds = new Set(
    allProjects
      .filter((p) => p.projectMembers?.some((m) => getMemberId(m) === user?.id))
      .map((p) => p.id),
  );

  // ✅ Build a deduplicated map of all co-members (excluding self)
  const coMembersMap = new Map(); // id → member object
  allProjects
    .filter((p) => myProjectIds.has(p.id))
    .forEach((p) => {
      p.projectMembers?.forEach((m) => {
        const id = getMemberId(m);
        if (id && id !== user?.id && !coMembersMap.has(id)) {
          coMembersMap.set(id, {
            id,
            name: m.user?.name || "Unknown",
            email: m.user?.email || "",
            // collect which projects they share with current user
            sharedProjects: [p.name],
          });
        } else if (id && id !== user?.id) {
          // append shared project name if already in map
          coMembersMap.get(id).sharedProjects.push(p.name);
        }
      });
    });

  const coMembers = Array.from(coMembersMap.values());
  const totalMembers = coMembers.length;

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-1">
            Dashboard
          </p>
          <h1 className="text-[22px] font-semibold text-ink-1 tracking-tight leading-tight">
            {getGreeting()}, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-[12.5px] text-ink-3 mt-1">
            {workspaces.length > 0
              ? `${workspaces.length} workspace${workspaces.length > 1 ? "s" : ""} · ${totalProjects} projects`
              : "Create your first workspace to get started"}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          + New Workspace
        </Button>
      </div>

      {/* ── Pending invites ── */}
      {pendingInvites.length > 0 && (
        <div className="mb-6">
          <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-3">
            Pending invites · {pendingInvites.length}
          </p>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="card-base px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-accent/15 border border-accent/25 rounded-lg flex items-center justify-center text-accent-300 font-bold text-sm flex-shrink-0">
                    {invite.workspace.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-ink-1 truncate">
                      {invite.workspace.name}
                    </p>
                    <p className="text-[11.5px] text-ink-4">
                      Invited by {invite.workspace.owner.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => declineInvite.mutate(invite.workspaceId)}
                    loading={declineInvite.isPending}
                  >
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptInvite.mutate(invite.workspaceId)}
                    loading={acceptInvite.isPending}
                  >
                    Accept →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {/* Workspaces stat */}
          <div className="card-base px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 bg-surface-3 rounded-md flex items-center justify-center text-base flex-shrink-0">
              🏢
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-1 leading-tight">
                {workspaces.length}
              </p>
              <p className="text-[11.5px] text-ink-4 mt-0.5">Workspaces</p>
            </div>
          </div>

          {/* Projects stat */}
          <div className="card-base px-4 py-3.5 flex items-center gap-3">
            <div className="w-8 h-8 bg-surface-3 rounded-md flex items-center justify-center text-base flex-shrink-0">
              📁
            </div>
            <div>
              <p className="text-lg font-semibold text-ink-1 leading-tight">
                {totalProjects}
              </p>
              <p className="text-[11.5px] text-ink-4 mt-0.5">Projects</p>
            </div>
          </div>

          {/* ✅ Members stat — now clickable */}
          <div
            onClick={() => totalMembers > 0 && setShowMembersModal(true)}
            className={`card-base px-4 py-3.5 flex items-center gap-3 transition-all duration-150 ${
              totalMembers > 0
                ? "cursor-pointer hover:bg-surface-3 hover:border-border-3 hover:shadow-card-hover"
                : ""
            }`}
          >
            <div className="w-8 h-8 bg-surface-3 rounded-md flex items-center justify-center text-base flex-shrink-0">
              👥
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-ink-1 leading-tight">
                {totalMembers}
              </p>
              <p className="text-[11.5px] text-ink-4 mt-0.5">
                Members
                {totalMembers > 0 && (
                  <span className="ml-1 text-accent-400">· view all</span>
                )}
              </p>
            </div>
            {totalMembers > 0 && (
              <div className="flex -space-x-1.5 flex-shrink-0">
                {coMembers.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    title={m.name}
                    className="w-6 h-6 rounded-full bg-accent/20 border-2 border-surface-2 flex items-center justify-center text-accent-300 font-semibold text-[9px]"
                  >
                    {m.name[0].toUpperCase()}
                  </div>
                ))}
                {coMembers.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-surface-4 border-2 border-surface-2 flex items-center justify-center text-ink-4 font-semibold text-[9px]">
                    +{coMembers.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Section header ── */}
      {workspaces.length > 0 && (
        <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-3">
          Your workspaces
        </p>
      )}

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-base p-5 space-y-3">
              <div className="skeleton w-8 h-8 rounded-md" />
              <div className="skeleton h-3.5 w-2/5 rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 bg-surface-3 border border-border-2 rounded-xl flex items-center justify-center text-2xl mb-5">
            🚀
          </div>
          <h2 className="text-base font-semibold text-ink-1 mb-2">
            Create your first workspace
          </h2>
          <p className="text-[12.5px] text-ink-3 mb-7 max-w-xs leading-relaxed">
            Workspaces help you organise projects, collaborate with your team,
            and track progress all in one place.
          </p>
          <Button onClick={() => setShowModal(true)} size="lg">
            + Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws, index) => {
            const accent = getAccent(index);
            return (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className="card-base p-5 cursor-pointer hover:bg-surface-3 hover:border-border-3 hover:shadow-card-hover transition-all duration-150 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-9 h-9 ${accent.bg} ${accent.text} border ${accent.border} rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0`}
                  >
                    {ws.name[0].toUpperCase()}
                  </div>
                  <span className="text-[10.5px] text-ink-4 bg-surface-4 border border-border-2 px-2 py-0.5 rounded-full">
                    {ws.owner?.name === user?.name ? "Owner" : "Member"}
                  </span>
                </div>

                <h3 className="font-semibold text-[13.5px] text-ink-1 mb-1 truncate group-hover:text-accent-300 transition-colors">
                  {ws.name}
                </h3>
                <p className="text-[12px] text-ink-4 mb-5 truncate-2 leading-relaxed min-h-[2rem]">
                  {ws.description || "No description"}
                </p>

                <div className="flex items-center justify-between pt-3.5 border-t border-border-1">
                  <div className="flex items-center gap-3 text-[11.5px] text-ink-4">
                    <span>{ws._count?.projects || 0} projects</span>
                    <span className="w-px h-3 bg-border-2" />
                    <span>{ws._count?.members || 0} members</span>
                  </div>
                  <span className="text-[11px] text-ink-4 group-hover:text-accent-400 transition-colors">
                    Open →
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add card */}
          <div
            onClick={() => setShowModal(true)}
            className="border border-dashed border-border-2 rounded-lg p-5 hover:border-accent/30 hover:bg-accent/[0.03] transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[160px] group"
          >
            <div className="w-9 h-9 bg-surface-3 group-hover:bg-accent/10 border border-border-2 group-hover:border-accent/30 rounded-lg flex items-center justify-center text-ink-4 group-hover:text-accent-400 text-lg transition-all">
              +
            </div>
            <p className="text-[12px] font-medium text-ink-4 group-hover:text-accent-400 transition-colors">
              New workspace
            </p>
          </div>
        </div>
      )}

      {/* ── Members Modal ── */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title="Your Project Members"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-[12px] text-ink-4">
            People you share projects with across all workspaces.
          </p>
          <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
            {coMembers.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[11px] flex-shrink-0">
                    {m.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink-1">
                      {m.name}
                    </p>
                    <p className="text-[11px] text-ink-4">{m.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10.5px] text-ink-4 max-w-[140px] truncate">
                    {m.sharedProjects.slice(0, 2).join(", ")}
                    {m.sharedProjects.length > 2 &&
                      ` +${m.sharedProjects.length - 2} more`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Create Workspace Modal ── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setAiIdea("");
          reset();
        }}
        title="Create Workspace"
      >
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          {/* AI suggestion box */}
          <div className="bg-accent/[0.05] border border-accent/15 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-accent-400 mb-2">
              ✦ AI Assistant
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiIdea}
                onChange={(e) => setAiIdea(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), generateWorkspaceSuggestion())
                }
                placeholder="Describe your idea in plain words..."
                className="input-base h-8 px-3 flex-1 text-[12.5px]"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={aiLoading}
                onClick={generateWorkspaceSuggestion}
              >
                Generate
              </Button>
            </div>
            <p className="text-[11px] text-ink-4 mt-1.5">
              AI will fill the name and description for you
            </p>
          </div>

          <Input
            label="Workspace name"
            placeholder="e.g. My Startup, Design Team"
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <Input
            label="Description"
            placeholder="What is this workspace for? (optional)"
            {...register("description")}
          />
          <div className="bg-surface-3 border border-border-2 rounded-lg p-3 text-[11.5px] text-ink-4 leading-relaxed">
            💡 Workspaces contain projects and members. You can invite teammates
            after creating.
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowModal(false);
                setAiIdea("");
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createMutation.isPending}
            >
              Create Workspace →
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default DashboardPage;
