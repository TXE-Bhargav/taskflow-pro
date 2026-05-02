// ProjectPage.jsx — Dark premium Kanban board

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { projectService } from "../services/project.service";
import { taskService } from "../services/task.service";
import Layout from "../components/layout/Layout";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import useSocket from "../hooks/useSocket";
import AITaskPanel from "../components/ui/AITaskPanel";

const COLUMNS = [
  {
    id: "TODO",
    label: "To Do",
    dot: "bg-ink-4",
    bg: "bg-surface-1",
    border: "border-border-1",
  },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    dot: "bg-info",
    bg: "bg-info/[0.04]",
    border: "border-info/15",
  },
  {
    id: "IN_REVIEW",
    label: "In Review",
    dot: "bg-warning",
    bg: "bg-warning/[0.04]",
    border: "border-warning/15",
  },
  {
    id: "DONE",
    label: "Done",
    dot: "bg-success",
    bg: "bg-success/[0.04]",
    border: "border-success/15",
  },
];

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// ── Task Card ───────────────────────────────────────────────────────
const TaskCard = ({ task, onClick, onMove }) => (
  <div
    onClick={() => onClick(task)}
    className="bg-surface-2 border border-border-1 rounded-lg p-3.5 cursor-pointer hover:border-border-3 hover:bg-surface-3 hover:shadow-card-hover transition-all duration-100 group"
  >
    <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
      <Badge type={task.priority} />
      {task.labels?.slice(0, 2).map((l) => (
        <span
          key={l.labelId}
          className="text-[10.5px] px-1.5 py-0.5 rounded font-medium border"
          style={{
            background: l.label.color + "18",
            color: l.label.color,
            borderColor: l.label.color + "30",
          }}
        >
          {l.label.name}
        </span>
      ))}
    </div>

    <h4 className="text-[12.5px] font-medium text-ink-1 mb-1.5 group-hover:text-accent-300 transition-colors leading-snug">
      {task.title}
    </h4>

    {task.description && (
      <p className="text-[11.5px] text-ink-4 mb-2.5 truncate-2 leading-relaxed">
        {task.description}
      </p>
    )}

    <div className="flex items-center justify-between pt-2.5 border-t border-border-1 mt-1">
      <div className="flex items-center gap-2 text-[11px] text-ink-4">
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
            className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? "text-danger/80" : ""}`}
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
          className="w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[9px] flex-shrink-0"
        >
          {task.assignee.name[0].toUpperCase()}
        </div>
      )}
    </div>

    <div className="hidden group-hover:flex gap-1 mt-2.5 pt-2 border-t border-border-1 flex-wrap">
      {COLUMNS.filter((c) => c.id !== task.status).map((col) => (
        <button
          key={col.id}
          onClick={(e) => {
            e.stopPropagation();
            onMove(task.id, col.id);
          }}
          className="text-[10.5px] px-1.5 py-0.5 rounded bg-surface-4 hover:bg-accent/10 text-ink-4 hover:text-accent-400 border border-border-2 hover:border-accent/20 transition-colors"
        >
          → {col.label}
        </button>
      ))}
    </div>
  </div>
);

// ── Kanban Column ───────────────────────────────────────────────────
const KanbanColumn = ({ column, tasks, onAddTask, onTaskClick, onMove }) => (
  <div className="flex flex-col flex-shrink-0" style={{ width: "272px" }}>
    <div className="flex items-center justify-between mb-2.5 px-0.5">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${column.dot}`} />
        <span className="text-[12.5px] font-medium text-ink-2">
          {column.label}
        </span>
        <span className="text-[11px] font-medium text-ink-4 bg-surface-3 border border-border-2 px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <button
        onClick={() => onAddTask(column.id)}
        className="w-5 h-5 rounded flex items-center justify-center text-ink-4 hover:text-ink-1 hover:bg-surface-4 transition-colors"
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
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>

    <div
      className={`flex-1 rounded-lg p-2 space-y-2 min-h-[520px] border ${column.bg} ${column.border}`}
    >
      {tasks.length === 0 ? (
        <div
          onClick={() => onAddTask(column.id)}
          className="flex flex-col items-center justify-center h-20 cursor-pointer group/empty rounded-md border border-dashed border-border-2 hover:border-border-3 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 text-ink-4 group-hover/empty:text-ink-3 mb-1 transition-colors"
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
          <span className="text-[11px] text-ink-4 group-hover/empty:text-ink-3 transition-colors">
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

// ── Main ─────────────────────────────────────────────────────────────
const ProjectPage = () => {
  const { id: projectId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState("TODO");

  // ── Members state ──
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // ── Queries ──
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.getById(projectId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: () => projectService.getMembers(projectId),
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => taskService.getByProject(projectId),
  });

  // ── Member handlers ──
  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await projectService.inviteMember(projectId, inviteEmail);
      queryClient.invalidateQueries(["project-members", projectId]);
      toast.success("Member added to project!");
      setInviteEmail("");
      setShowInvite(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await projectService.removeMember(projectId, userId);
      queryClient.invalidateQueries(["project-members", projectId]);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  // ── Socket ──
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !project?.workspaceId) return;
    const joinRoom = () => socket.emit("join:workspace", project.workspaceId);
    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);
    return () => socket.off("connect", joinRoom);
  }, [socket, project?.workspaceId]);

  useEffect(() => {
    if (!socket) return;

    const handleTaskMoved = ({ taskId, status }) => {
      queryClient.setQueryData(["tasks", projectId], (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, status } : t)),
      );
    };
    const handleTaskCreated = () =>
      queryClient.invalidateQueries(["tasks", projectId]);
    const handleTaskUpdated = ({ task }) => {
      queryClient.setQueryData(["tasks", projectId], (old = []) =>
        old.map((t) => (t.id === task?.id ? { ...t, ...task } : t)),
      );
    };
    const handleTaskDeleted = ({ taskId }) => {
      queryClient.setQueryData(["tasks", projectId], (old = []) =>
        old.filter((t) => t.id !== taskId),
      );
    };

    socket.on("task:moved", handleTaskMoved);
    socket.on("task:created", handleTaskCreated);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      socket.off("task:moved", handleTaskMoved);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [socket, projectId, queryClient]);

  // ── Derived state ──
  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id);
    return acc;
  }, {});

  const doneCount = tasksByStatus["DONE"]?.length || 0;
  const totalCount = tasks.length;
  const progress =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // ── Form ──
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const createTask = useMutation({
    mutationFn: (data) =>
      taskService.createTask(projectId, {
        ...data,
        status: defaultStatus,
        workspaceId: project?.workspaceId,
      }),
    onSuccess: () => {
      toast.success("Task created!");
      reset();
      setShowCreateTask(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, status }) =>
      taskService.moveTask(taskId, status, project?.workspaceId),
    onError: () => toast.error("Failed to move task"),
  });

  return (
    <Layout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {project && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: project.color || "#e8a045" }}
            >
              {project.name[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-0.5">
              Project
            </p>
            <h1 className="text-[18px] font-semibold text-ink-1 tracking-tight leading-tight">
              {project?.name || "…"}
            </h1>
            <p className="text-[11.5px] text-ink-4 mt-0.5">
              {totalCount} tasks · {doneCount} done
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 bg-surface-2 border border-border-2 rounded-lg px-3.5 py-2">
            <div className="w-24 bg-surface-4 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: project?.color || "#e8a045",
                }}
              />
            </div>
            <span className="text-[11.5px] font-semibold text-ink-2 w-8">
              {progress}%
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMembers(true)}
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Members{members.length > 0 && ` · ${members.length}`}
          </Button>
          {project && (
            <AITaskPanel projectId={projectId} projectName={project.name} />
          )}
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

      {/* ── Kanban ── */}
      {isLoading ? (
        <div className="flex gap-4">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="flex-shrink-0 space-y-2"
              style={{ width: "272px" }}
            >
              <div className="skeleton h-4 w-20 rounded" />
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-24 rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="kanban-scroll -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={tasksByStatus[col.id] || []}
              onAddTask={(status) => {
                setDefaultStatus(status);
                setShowCreateTask(true);
              }}
              onTaskClick={(task) => navigate(`/task/${task.id}`)}
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
            <label className="text-[12.5px] font-medium text-ink-2">
              Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add more details..."
              className="input-base px-3 py-2 resize-none"
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-medium text-ink-2">
                Priority
              </label>
              <select
                {...register("priority")}
                defaultValue="MEDIUM"
                className="input-base h-9 px-3"
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-2">
              Assign to (optional)
            </label>
            <select {...register("assigneeId")} className="input-base h-9 px-3">
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
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

      {/* ── Members Modal ── */}
      <Modal
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        title="Project Members"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-[12px] text-ink-4">
              {members.length} member{members.length !== 1 ? "s" : ""} in this
              project
            </p>
            <Button size="sm" onClick={() => setShowInvite(true)}>
              + Add member
            </Button>
          </div>
          <div className="space-y-1">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[10px]">
                    {m.user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink-1">
                      {m.user.name}
                    </p>
                    <p className="text-[11px] text-ink-4">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full border ${
                      m.role === "OWNER"
                        ? "bg-accent/10 border-accent/20 text-accent-300"
                        : "bg-surface-4 border-border-2 text-ink-4"
                    }`}
                  >
                    {m.role}
                  </span>
                  {m.role !== "OWNER" && (
                    <button
                      onClick={() => handleRemoveMember(m.user.id)}
                      className="text-[11.5px] text-danger/60 hover:text-danger transition-colors px-2 py-1 rounded hover:bg-danger/10"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Invite Modal ── */}
      <Modal
        isOpen={showInvite}
        onClose={() => {
          setShowInvite(false);
          setInviteEmail("");
        }}
        title="Add Member to Project"
      >
        <div className="space-y-4">
          <p className="text-[12.5px] text-ink-3 leading-relaxed">
            The user must already be a workspace member. Enter their email to
            add them to this project.
          </p>
          <Input
            label="Email address"
            type="email"
            placeholder="teammate@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <div className="bg-surface-3 border border-border-2 rounded-lg p-3 text-[12px] text-ink-4">
            💡 Members added to this project can only see and work on tasks in
            this project.
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowInvite(false);
                setInviteEmail("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={inviteLoading}
              onClick={handleInvite}
            >
              Add to project →
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ProjectPage;
