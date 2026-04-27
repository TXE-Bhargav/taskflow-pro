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

// ── Greeting based on time of day ──
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// ── Workspace color map — cycles through accent colors ──
const COLORS = [
  {
    bg: "bg-violet-100",
    text: "text-violet-600",
    hover: "group-hover:bg-violet-500",
    border: "hover:border-violet-200",
  },
  {
    bg: "bg-sky-100",
    text: "text-sky-600",
    hover: "group-hover:bg-sky-500",
    border: "hover:border-sky-200",
  },
  {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    hover: "group-hover:bg-emerald-500",
    border: "hover:border-emerald-200",
  },
  {
    bg: "bg-amber-100",
    text: "text-amber-600",
    hover: "group-hover:bg-amber-500",
    border: "hover:border-amber-200",
  },
  {
    bg: "bg-rose-100",
    text: "text-rose-600",
    hover: "group-hover:bg-rose-500",
    border: "hover:border-rose-200",
  },
];

const getColor = (index) => COLORS[index % COLORS.length];

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await api.get("/workspaces");
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
      if (newWs?.id) navigate(`/workspace/${newWs.id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create workspace");
    },
  });

  return (
    <Layout>
      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {workspaces.length > 0
              ? `You have ${workspaces.length} workspace${workspaces.length > 1 ? "s" : ""}`
              : "Create your first workspace to get started"}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="md">
          <span className="text-lg leading-none">+</span> New Workspace
        </Button>
      </div>

      {/* ── Stats bar — only show when workspaces exist ── */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            {
              label: "Total workspaces",
              value: workspaces.length,
              icon: "🏢",
            },
            {
              label: "Total projects",
              value: workspaces.reduce(
                (a, ws) => a + (ws._count?.projects || 0),
                0,
              ),
              icon: "📁",
            },
            {
              label: "Team members",
              value: workspaces.reduce(
                (a, ws) => a + (ws._count?.members || 0),
                0,
              ),
              icon: "👥",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl px-5 py-4 border border-gray-100 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Section label ── */}
      {workspaces.length > 0 && (
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
          Your workspaces
        </p>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse space-y-3"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-50 rounded w-3/4" />
              <div className="flex gap-3 pt-2">
                <div className="h-3 bg-gray-50 rounded w-16" />
                <div className="h-3 bg-gray-50 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center text-4xl mb-5 shadow-inner">
            🚀
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Create your first workspace
          </h2>
          <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">
            Workspaces help you organise projects, collaborate with your team,
            and track progress all in one place.
          </p>
          <Button onClick={() => setShowModal(true)} size="lg">
            + Create Workspace
          </Button>
        </div>
      ) : (
        /* ── Workspace grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((ws, index) => {
            const color = getColor(index);
            return (
              <div
                key={ws.id}
                onClick={() => navigate(`/workspace/${ws.id}`)}
                className={`
                  group bg-white rounded-xl p-6 border border-gray-100
                  ${color.border} hover:shadow-md
                  transition-all duration-200 cursor-pointer
                `}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`
                    w-11 h-11 ${color.bg} ${color.text} ${color.hover}
                    group-hover:text-white rounded-xl flex items-center justify-center
                    font-semibold text-base transition-colors duration-200
                  `}
                  >
                    {ws.name[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-300 font-medium bg-gray-50 px-2 py-1 rounded-lg">
                    {ws.owner?.name === user?.name ? "Owner" : "Member"}
                  </span>
                </div>

                {/* Name + description */}
                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                  {ws.name}
                </h3>
                <p className="text-gray-400 text-xs mb-5 line-clamp-2 leading-relaxed">
                  {ws.description || "No description added yet"}
                </p>

                {/* Footer stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span>📁</span>
                      {ws._count?.projects || 0} project
                      {ws._count?.projects !== 1 ? "s" : ""}
                    </span>
                    <span className="w-px h-3 bg-gray-200" />
                    <span className="flex items-center gap-1">
                      <span>👥</span>
                      {ws._count?.members || 0} member
                      {ws._count?.members !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-xs text-gray-300 group-hover:text-primary-400 transition-colors">
                    Open →
                  </span>
                </div>
              </div>
            );
          })}

          {/* ── Add new workspace card ── */}
          <div
            onClick={() => setShowModal(true)}
            className="group bg-white rounded-xl p-6 border border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-3 min-h-[180px]"
          >
            <div className="w-11 h-11 bg-gray-100 group-hover:bg-primary-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary-500 text-xl font-light transition-colors duration-200">
              +
            </div>
            <p className="text-sm font-medium text-gray-400 group-hover:text-primary-500 transition-colors">
              New workspace
            </p>
          </div>
        </div>
      )}

      {/* ── Create workspace modal ── */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          reset();
        }}
        title="Create Workspace"
      >
        <form
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Workspace name"
            placeholder="e.g. My Startup, Design Team"
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <Input
            label="Description (optional)"
            placeholder="What is this workspace for?"
            {...register("description")}
          />

          {/* Tips */}
          <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-400 leading-relaxed">
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
