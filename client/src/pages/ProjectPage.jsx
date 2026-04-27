import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../services/api";
import Layout from "../components/layout/Layout";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

const COLUMNS = [
  {
    id: "TODO",
    label: "To Do",
    color: "#94a3b8",
    dot: "bg-slate-400",
    bg: "bg-slate-50/80",
  },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    color: "#6366f1",
    dot: "bg-indigo-500",
    bg: "bg-indigo-50/60",
  },
  {
    id: "IN_REVIEW",
    label: "In Review",
    color: "#f59e0b",
    dot: "bg-amber-400",
    bg: "bg-amber-50/60",
  },
  {
    id: "DONE",
    label: "Done",
    color: "#22c55e",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50/60",
  },
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// ── Task Card ──────────────────────────────────────────────────
const TaskCard = ({ task, onClick, onMove }) => (
  <div
    onClick={() => onClick(task)}
    className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-150 group"
  >
    {/* Priority badge */}
    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
      <Badge type={task.priority} />
      {task.labels?.slice(0, 2).map((l) => (
        <span
          key={l.labelId}
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: l.label.color + "18", color: l.label.color }}
        >
          {l.label.name}
        </span>
      ))}
    </div>

    {/* Title */}
    <h4 className="text-sm font-medium text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors leading-snug">
      {task.title}
    </h4>

    {/* Description preview */}
    {task.description && (
      <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
        {task.description}
      </p>
    )}

    {/* Footer */}
    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
      <div className="flex items-center gap-2.5 text-xs text-gray-400">
        {task._count?.comments > 0 && (
          <span className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {task._count.comments}
          </span>
        )}
        {task.subtasks?.length > 0 && (
          <span className="flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            {task.subtasks.filter((s) => s.status === "DONE").length}/
            {task.subtasks.length}
          </span>
        )}
        {task.dueDate && (
          <span
            className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? "text-red-400" : ""}`}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {task.assignee && (
        <div
          title={task.assignee.name}
          className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs flex-shrink-0"
        >
          {task.assignee.name[0].toUpperCase()}
        </div>
      )}
    </div>

    {/* Quick move — on hover */}
    <div className="hidden group-hover:flex gap-1 mt-3 pt-2 border-t border-gray-50 flex-wrap">
      {COLUMNS.filter((c) => c.id !== task.status).map((col) => (
        <button
          key={col.id}
          onClick={(e) => {
            e.stopPropagation();
            onMove(task.id, col.id);
          }}
          className="text-xs px-2 py-1 rounded-lg bg-gray-50 hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
        >
          → {col.label}
        </button>
      ))}
    </div>
  </div>
);

// ── Kanban Column ──────────────────────────────────────────────
const KanbanColumn = ({ column, tasks, onAddTask, onTaskClick, onMove }) => (
  <div className="flex flex-col w-72 flex-shrink-0">
    {/* Column header */}
    <div className="flex items-center justify-between mb-3 px-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${column.dot}`} />
        <span className="text-sm font-medium text-gray-700">
          {column.label}
        </span>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <button
        onClick={() => onAddTask(column.id)}
        className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
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
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>

    {/* Tasks list */}
    <div
      className={`flex-1 rounded-xl p-2.5 space-y-2.5 min-h-[480px] ${column.bg}`}
    >
      {tasks.length === 0 ? (
        <div
          onClick={() => onAddTask(column.id)}
          className="flex flex-col items-center justify-center h-24 cursor-pointer group rounded-xl border-2 border-dashed border-gray-200/80 hover:border-gray-300 transition-colors"
        >
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-xs text-gray-300 group-hover:text-gray-400 transition-colors">
            Add task
          </span>
        </div>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={onTaskClick}
            onMove={onMove}
          />
        ))
      )}
    </div>
  </div>
);

// ── Main Project Page ──────────────────────────────────────────
const ProjectPage = () => {
  const { id: projectId } = useParams();
  const queryClient = useQueryClient();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState("TODO");
  const [selectedTask, setSelectedTask] = useState(null);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`);
      return res.data?.data || res.data;
    },
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const res = await api.get(`/tasks/project/${projectId}`);
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.data)) return res.data.data;
      return [];
    },
  });

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const doneCount = tasksByStatus["DONE"]?.length || 0;
  const totalCount = tasks.length;
  const progress =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const createTask = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/tasks/project/${projectId}`, {
        ...data,
        status: defaultStatus,
        workspaceId: project?.workspaceId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tasks", projectId]);
      toast.success("Task created!");
      reset();
      setShowCreateTask(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const moveTask = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const res = await api.patch(`/tasks/${taskId}/move`, {
        status,
        position: 0,
        workspaceId: project?.workspaceId,
      });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries(["tasks", projectId]),
    onError: () => toast.error("Failed to move task"),
  });

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {project && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg"
              style={{
                background: project.color || "#6366f1",
                boxShadow: `0 8px 20px ${project.color || "#6366f1"}35`,
              }}
            >
              {project.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-0.5">
              Project
            </p>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              {project?.name || "..."}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {totalCount} tasks total · {doneCount} completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
            <div className="w-28 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: project?.color || "#6366f1",
                }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-8">
              {progress}%
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setDefaultStatus("TODO");
              setShowCreateTask(true);
            }}
          >
            + Add Task
          </Button>
        </div>
      </div>

      {/* ── Kanban Board ── */}
      {isLoading ? (
        <div className="flex gap-5">
          {COLUMNS.map((col) => (
            <div key={col.id} className="w-72 flex-shrink-0 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Outer wrapper — full width, scroll horizontally */
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-8 px-8">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByStatus[col.id] || []}
              onAddTask={(status) => {
                setDefaultStatus(status);
                setShowCreateTask(true);
              }}
              onTaskClick={setSelectedTask}
              onMove={(taskId, status) => moveTask.mutate({ taskId, status })}
            />
          ))}
        </div>
      )}

      {/* ── Create Task Modal ── */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => {
          setShowCreateTask(false);
          reset();
        }}
        title={`New task · ${COLUMNS.find((c) => c.id === defaultStatus)?.label}`}
        size="lg"
      >
        <form
          onSubmit={handleSubmit((d) => createTask.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Task title"
            placeholder="What needs to be done?"
            error={errors.title?.message}
            {...register("title", { required: "Title is required" })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add more details..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 resize-none placeholder:text-gray-400 transition-all"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                {...register("priority")}
                defaultValue="MEDIUM"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Due date (optional)"
              type="date"
              {...register("dueDate")}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowCreateTask(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createTask.isPending}
            >
              Create Task →
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Task Detail Modal ── */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge type={selectedTask.priority} />
              <Badge type={selectedTask.status} />
            </div>

            {selectedTask.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedTask.dueDate && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Due date</p>
                  <p className="text-sm font-medium text-gray-700">
                    {new Date(selectedTask.dueDate).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" },
                    )}
                  </p>
                </div>
              )}
              {selectedTask.assignee && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Assigned to</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-semibold">
                      {selectedTask.assignee.name[0].toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedTask.assignee.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-primary-50 rounded-xl p-4 text-center">
              <p className="text-xs text-primary-500 font-medium">
                🚀 Full task detail with AI features, comments & subtasks coming
                next!
              </p>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default ProjectPage;
