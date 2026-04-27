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
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

const WorkspacePage = () => {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showProject, setShowProject] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

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
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-40" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-xl" />
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-100">
            {workspace?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-0.5">
              Workspace
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {workspace?.name}
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
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
              className="w-4 h-4"
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
        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-400">Team</span>
          <div className="flex -space-x-2">
            {workspace.members.slice(0, 8).map((m) => (
              <div
                key={m.id}
                title={`${m.user.name} · ${m.role}`}
                className="w-7 h-7 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-primary-600 font-semibold text-xs"
              >
                {m.user.name[0].toUpperCase()}
              </div>
            ))}
            {workspace.members.length > 8 && (
              <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-xs font-medium">
                +{workspace.members.length - 8}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="w-7 h-7 rounded-full border-2 border-dashed border-gray-200 hover:border-primary-300 flex items-center justify-center text-gray-300 hover:text-primary-400 transition-colors text-sm"
          >
            +
          </button>
        </div>
      )}

      {/* ── Section label ── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Projects · {projects.length}
        </p>
      </div>

      {/* ── Projects grid ── */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mb-4">
            📁
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Create your first project
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xs leading-relaxed">
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
              className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
            >
              {/* Color accent bar */}
              <div
                className="h-1 w-full"
                style={{ background: proj.color || "#6366f1" }}
              />

              <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ background: proj.color || "#6366f1" }}
                    >
                      {proj.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 transition-colors leading-tight">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {proj._count?.tasks || 0} tasks
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0">
                    Active
                  </span>
                </div>

                {/* Description */}
                {proj.description && (
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {/* Progress */}
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Progress</span>
                    <span>0%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1">
                    <div
                      className="h-1 rounded-full w-0"
                      style={{ background: proj.color || "#6366f1" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add card */}
          <div
            onClick={() => setShowProject(true)}
            className="bg-white rounded-xl border-2 border-dashed border-gray-150 hover:border-primary-200 hover:bg-primary-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[160px] group"
          >
            <div className="w-9 h-9 rounded-xl border border-gray-200 group-hover:border-primary-200 bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center text-gray-400 group-hover:text-primary-500 transition-all text-lg">
              +
            </div>
            <p className="text-xs font-medium text-gray-400 group-hover:text-primary-500 transition-colors">
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
          reset();
        }}
        title="New Project"
      >
        <form
          onSubmit={handleSubmit((d) => createProject.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Project name"
            placeholder="e.g. Website Redesign"
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <Input
            label="Description (optional)"
            placeholder="What is this project about?"
            {...register("description")}
          />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"}`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400">
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
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Role
            </label>
            <select
              {...regInvite("role")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
            >
              <option value="MEMBER">Member — can view and edit tasks</option>
              <option value="ADMIN">
                Admin — can manage projects and members
              </option>
            </select>
          </div>

          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-500 leading-relaxed">
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
