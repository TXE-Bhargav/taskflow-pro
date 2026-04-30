// WorkspacePage.jsx — Dark premium workspace with projects grid

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../services/api";
import Layout from "../components/layout/Layout";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

const PROJECT_COLORS = [
  "#e8a045",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
  "#f87171",
  "#fb923c",
  "#a3e635",
  "#22d3ee",
  "#e879f9",
  "#f472b6",
];

const WorkspacePage = () => {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showProject, setShowProject] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  // AI suggestion state
  const [aiIdea, setAiIdea] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const generateProjectSuggestion = async () => {
    if (!aiIdea.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post("/ai/suggest-project", {
        rawIdea: aiIdea,
        workspaceName: workspace?.name,
      });
      reset({ name: res.data.name, description: res.data.description });
      toast.success("AI filled in the details!");
    } catch (e) {
      toast.error("AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}`);
      return res.data?.data || res.data;
    },
  });

  const { data: projects = [], isLoading: projLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${workspaceId}/projects`);
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const {
    register: regInvite,
    handleSubmit: handleInvite,
    reset: resetInvite,
  } = useForm();

  const createProject = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/workspaces/${workspaceId}/projects`, {
        ...data,
        color: selectedColor,
      });
      return res.data?.data || res.data;
    },
    onSuccess: (proj) => {
      queryClient.invalidateQueries(["projects", workspaceId]);
      toast.success("Project created!");
      reset();
      setAiIdea("");
      setShowProject(false);
      if (proj?.id) navigate(`/project/${proj.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const inviteMember = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/workspaces/${workspaceId}/invite`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["workspace", workspaceId]);
      toast.success("Member invited!");
      resetInvite();
      setShowInvite(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  if (wsLoading || projLoading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="skeleton w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-36 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-40 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/15 border border-accent/25 rounded-lg flex items-center justify-center text-accent-300 font-bold text-sm">
            {workspace?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-0.5">
              Workspace
            </p>
            <h1 className="text-[20px] font-semibold text-ink-1 tracking-tight leading-tight">
              {workspace?.name}
            </h1>
            <p className="text-[12px] text-ink-4 mt-0.5">
              {workspace?.members?.length || 0} members · {projects.length}{" "}
              projects
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowInvite(true)}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Invite
          </Button>
          <Button size="sm" onClick={() => setShowProject(true)}>
            + New Project
          </Button>
        </div>
      </div>

      {/* ── Members strip ── */}
      {workspace?.members?.length > 0 && (
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border-1">
          <span className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest">
            Team
          </span>
          <div className="flex -space-x-1.5">
            {workspace.members.slice(0, 9).map((m) => (
              <div
                key={m.id}
                title={`${m.user.name} · ${m.role}`}
                className="w-6 h-6 rounded-full bg-surface-4 border-2 border-surface-1 flex items-center justify-center text-ink-2 font-semibold text-[9px]"
              >
                {m.user.name[0].toUpperCase()}
              </div>
            ))}
            {workspace.members.length > 9 && (
              <div className="w-6 h-6 rounded-full bg-surface-4 border-2 border-surface-1 flex items-center justify-center text-ink-4 text-[9px] font-medium">
                +{workspace.members.length - 9}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="w-6 h-6 rounded-full border border-dashed border-border-3 hover:border-accent/40 flex items-center justify-center text-ink-4 hover:text-accent-400 transition-colors text-sm"
          >
            +
          </button>
        </div>
      )}

      {/* ── Section label ── */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest">
          Projects · {projects.length}
        </p>
      </div>

      {/* ── Projects grid ── */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 bg-surface-3 border border-border-2 rounded-xl flex items-center justify-center text-xl mb-4">
            📁
          </div>
          <h2 className="text-base font-semibold text-ink-1 mb-2">
            Create your first project
          </h2>
          <p className="text-[12.5px] text-ink-3 mb-6 max-w-xs leading-relaxed">
            Projects live inside workspaces. Each project has its own Kanban
            board, tasks, and team.
          </p>
          <Button onClick={() => setShowProject(true)} size="lg">
            + Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/project/${proj.id}`)}
              className="card-base cursor-pointer hover:bg-surface-3 hover:border-border-3 hover:shadow-card-hover transition-all duration-150 group overflow-hidden"
            >
              {/* Color accent top bar */}
              <div
                className="h-0.5 w-full"
                style={{ background: proj.color || "#e8a045" }}
              />

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0"
                      style={{ background: proj.color || "#e8a045" }}
                    >
                      {proj.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[13px] text-ink-1 group-hover:text-accent-300 transition-colors leading-tight">
                        {proj.name}
                      </h3>
                      <p className="text-[11px] text-ink-4 mt-0.5">
                        {proj._count?.tasks || 0} tasks
                      </p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-success/10 text-success/80 border border-success/20 flex-shrink-0">
                    Active
                  </span>
                </div>

                {proj.description && (
                  <p className="text-[11.5px] text-ink-4 mb-3 truncate-2 leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Progress</span>
                    <span>{proj.progress ?? 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div
                      className="h-1 rounded-full transition-all duration-500"
                      style={{
                        width: `${proj.progress ?? 0}%`,
                        background: proj.color || "#6366f1",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {proj.doneTasks ?? 0} of {proj.totalTasks ?? 0} tasks done
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Add card */}
          <div
            onClick={() => setShowProject(true)}
            className="border border-dashed border-border-2 rounded-lg p-4 hover:border-accent/30 hover:bg-accent/[0.03] transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[140px] group"
          >
            <div className="w-8 h-8 bg-surface-3 group-hover:bg-accent/10 border border-border-2 group-hover:border-accent/30 rounded-lg flex items-center justify-center text-ink-4 group-hover:text-accent-400 text-lg transition-all">
              +
            </div>
            <p className="text-[12px] font-medium text-ink-4 group-hover:text-accent-400 transition-colors">
              New project
            </p>
          </div>
        </div>
      )}

      {/* ── Create Project Modal ── */}
      <Modal
        isOpen={showProject}
        onClose={() => {
          setShowProject(false);
          setAiIdea("");
          reset();
        }}
        title="New Project"
      >
        <form
          onSubmit={handleSubmit((d) => createProject.mutate(d))}
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
                  (e.preventDefault(), generateProjectSuggestion())
                }
                placeholder="Describe your project idea in plain words..."
                className="input-base h-8 px-3 flex-1 text-[12.5px]"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={aiLoading}
                onClick={generateProjectSuggestion}
              >
                Generate
              </Button>
            </div>
            <p className="text-[11px] text-ink-4 mt-1.5">
              AI will fill the name and description for you
            </p>
          </div>

          <Input
            label="Project name"
            placeholder="e.g. Website Redesign"
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <Input
            label="Description"
            placeholder="What is this project about? (optional)"
            {...register("description")}
          />
          <div>
            <label className="text-[12.5px] font-medium text-ink-2 block mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-5 h-5 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-offset-surface-2 ring-white/40 scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div className="bg-surface-3 border border-border-2 rounded-lg p-3 text-[11.5px] text-ink-4 leading-relaxed">
            💡 Projects contain tasks organised in a Kanban board — To Do, In
            Progress, In Review, Done.
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowProject(false);
                setAiIdea("");
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createProject.isPending}
            >
              Create Project →
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Invite Modal ── */}
      <Modal
        isOpen={showInvite}
        onClose={() => {
          setShowInvite(false);
          resetInvite();
        }}
        title="Invite Team Member"
      >
        <form
          onSubmit={handleInvite((d) => inviteMember.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Email address"
            type="email"
            placeholder="teammate@example.com"
            {...regInvite("email", { required: true })}
          />
          <div>
            <label className="text-[12.5px] font-medium text-ink-2 block mb-1.5">
              Role
            </label>
            <select
              {...regInvite("role")}
              className="input-base h-9 px-3 w-full"
            >
              <option value="MEMBER">Member — can view and edit tasks</option>
              <option value="ADMIN">
                Admin — can manage projects and members
              </option>
            </select>
          </div>
          <div className="bg-info/10 border border-info/20 rounded-lg p-3 text-[11.5px] text-info/80 leading-relaxed">
            ℹ️ The user must already have a TaskFlow Pro account to be added.
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowInvite(false);
                resetInvite();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={inviteMember.isPending}
            >
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default WorkspacePage;
