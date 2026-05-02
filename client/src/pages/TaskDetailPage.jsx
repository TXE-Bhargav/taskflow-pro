// TaskDetailPage.jsx — Full task detail with AI, comments, subtasks

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import api from "../services/api";
import { aiService } from "../services/ai.service";
import useAuthStore from "../store/authStore";
import useSocket from "../hooks/useSocket";
import Layout from "../components/layout/Layout";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import { projectService } from "../services/project.service";

const STATUSES = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// ── AI Panel ────────────────────────────────────────────────────
const AIPanel = ({ task, onApplyDescription, onApplyDueDate }) => {
  const [activeAI, setActiveAI] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runAI = async (type) => {
    setActiveAI(type);
    setAiLoading(true);
    setAiResult(null);
    try {
      let result;
      if (type === "improve") {
        result = await aiService.improveDescription(
          task.title,
          task.description,
        );
        setAiResult({ type, data: result.improved });
      } else if (type === "suggest-date") {
        result = await aiService.suggestDueDate(task.title, task.description);
        setAiResult({ type, data: result });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "AI request failed");
      setActiveAI(null);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="card-base p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-accent/15 border border-accent/25 rounded flex items-center justify-center text-accent-400 text-sm">
          ✦
        </div>
        <h3 className="text-[12.5px] font-semibold text-ink-1">AI Assistant</h3>
        <span className="text-[10px] font-medium text-accent-400 bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded-full">
          Powered by Groq
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { key: "improve", label: "Improve description", icon: "✍️" },
          { key: "suggest-date", label: "Suggest due date", icon: "📅" },
        ].map((action) => (
          <button
            key={action.key}
            onClick={() => runAI(action.key)}
            disabled={aiLoading}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12px] font-medium transition-all text-left
              ${
                activeAI === action.key
                  ? "bg-accent/10 border-accent/30 text-accent-300"
                  : "bg-surface-3 border-border-2 text-ink-2 hover:border-border-3 hover:text-ink-1"
              } disabled:opacity-50`}
          >
            <span>{action.icon}</span>
            <span className="leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {aiLoading && (
        <div className="flex items-center gap-2.5 py-3 px-3 bg-surface-3 border border-border-2 rounded-lg">
          <div className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin flex-shrink-0" />
          <span className="text-[12px] text-ink-3">AI is thinking...</span>
        </div>
      )}

      {aiResult && !aiLoading && (
        <div className="bg-surface-3 border border-accent/15 rounded-lg p-3.5 space-y-3">
          {aiResult.type === "improve" && (
            <>
              <div>
                <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-1.5">
                  Improved description
                </p>
                <p className="text-[12.5px] text-ink-2 leading-relaxed">
                  {aiResult.data.description}
                </p>
              </div>
              {aiResult.data.acceptanceCriteria?.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-1.5">
                    Acceptance criteria
                  </p>
                  <ul className="space-y-1">
                    {aiResult.data.acceptanceCriteria.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-[12px] text-ink-3"
                      >
                        <span className="text-success mt-0.5 flex-shrink-0">
                          ✓
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  onApplyDescription(aiResult.data.description);
                  setAiResult(null);
                  setActiveAI(null);
                  toast.success("Description updated!");
                }}
              >
                Apply description →
              </Button>
            </>
          )}

          {aiResult.type === "suggest-date" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-4 rounded-lg p-2.5">
                  <p className="text-[10.5px] text-ink-4 mb-0.5">
                    Suggested date
                  </p>
                  <p className="text-[13px] font-semibold text-ink-1">
                    {aiResult.data.suggestedDate}
                  </p>
                </div>
                <div className="bg-surface-4 rounded-lg p-2.5">
                  <p className="text-[10.5px] text-ink-4 mb-0.5">Days needed</p>
                  <p className="text-[13px] font-semibold text-ink-1">
                    {aiResult.data.suggestedDays} days
                  </p>
                </div>
              </div>
              <p className="text-[12px] text-ink-3 leading-relaxed">
                {aiResult.data.reasoning}
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  onApplyDueDate(aiResult.data.suggestedDate);
                  setAiResult(null);
                  setActiveAI(null);
                  toast.success("Due date updated!");
                }}
              >
                Apply due date →
              </Button>
            </>
          )}

          <button
            onClick={() => {
              setAiResult(null);
              setActiveAI(null);
            }}
            className="w-full text-[11.5px] text-ink-4 hover:text-ink-2 transition-colors pt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

// ── Comment Item ─────────────────────────────────────────────────
const CommentItem = ({ comment, currentUserId }) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[10px] flex-shrink-0 mt-0.5">
      {comment.author?.name?.[0]?.toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-[12.5px] font-medium text-ink-1">
          {comment.author?.name}
          {comment.author?.id === currentUserId && (
            <span className="ml-1 text-[10px] text-ink-4 font-normal">
              (you)
            </span>
          )}
        </span>
        <span className="text-[11px] text-ink-4">
          {new Date(comment.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="bg-surface-3 border border-border-2 rounded-lg px-3 py-2.5">
        <p className="text-[12.5px] text-ink-2 leading-relaxed">
          {comment.content}
        </p>
      </div>
    </div>
  </div>
);

// ── Subtask Item ─────────────────────────────────────────────────
const SubtaskItem = ({ subtask, onToggle }) => (
  <div
    onClick={() => onToggle(subtask)}
    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-3 transition-colors cursor-pointer group"
  >
    <div
      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${subtask.status === "DONE" ? "bg-success border-success" : "border-border-3 group-hover:border-border-3"}`}
    >
      {subtask.status === "DONE" && (
        <svg
          className="w-2.5 h-2.5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </div>
    <span
      className={`text-[12.5px] flex-1 ${subtask.status === "DONE" ? "line-through text-ink-4" : "text-ink-2"}`}
    >
      {subtask.title}
    </span>
    <Badge type={subtask.priority} size="sm" />
  </div>
);

// ── Main Page ────────────────────────────────────────────────────
const TaskDetailPage = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const socket = useSocket();

  const [comments, setComments] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [showSubtask, setShowSubtask] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const commentRef = useRef(null);
  const typingTimeout = useRef(null);

  // ── Fetch task ──
  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await api.get(`/tasks/${taskId}`);
      const t = res.data?.data || res.data;
      setComments(t.comments || []);
      return t;
    },
  });

  const { data: projectMembers = [] } = useQuery({
    queryKey: ["project-members", task?.projectId],
    queryFn: () => projectService.getMembers(task?.projectId),
    enabled: !!task?.projectId,
  });

  // ── Join workspace room ──
  useEffect(() => {
    if (!socket || !task?.project?.workspaceId) return;

    const joinRoom = () => {
      socket.emit("join:workspace", task.project.workspaceId);
      console.log("📡 TaskDetail joined workspace:", task.project.workspaceId);
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.off("connect", joinRoom);
    };
  }, [socket, task?.project?.workspaceId]);

  // ── Socket event listeners ──
  useEffect(() => {
    if (!socket) return;

    // New comment on this task
    const handleCommentAdded = ({ comment, taskId: tid }) => {
      if (tid !== taskId) return;
      setComments((prev) => {
        if (prev.some((c) => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    };

    // This task or one of its subtasks was updated
    const handleTaskUpdated = ({ task: updated }) => {
      if (!updated) return;

      if (updated.id === taskId) {
        // The parent task itself changed
        queryClient.setQueryData(["task", taskId], (prev) =>
          prev ? { ...prev, ...updated } : prev,
        );
        return;
      }

      // A subtask was updated — patch it inside the parent cache
      queryClient.setQueryData(["task", taskId], (prev) => {
        if (!prev) return prev;
        const isSubtask = prev.subtasks?.some((s) => s.id === updated.id);
        if (!isSubtask) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks.map((s) =>
            s.id === updated.id ? { ...s, ...updated } : s,
          ),
        };
      });
    };

    // A new subtask was created by another user
    const handleTaskCreated = ({ task: newTask }) => {
      if (newTask?.parentId !== taskId) return;
      queryClient.setQueryData(["task", taskId], (prev) => {
        if (!prev) return prev;
        const already = prev.subtasks?.some((s) => s.id === newTask.id);
        if (already) return prev;
        return { ...prev, subtasks: [...(prev.subtasks || []), newTask] };
      });
    };

    const handleTypingStart = ({ name, taskId: tid }) => {
      if (tid === taskId && name !== user?.name) setTypingUser(name);
    };

    const handleTypingStop = ({ taskId: tid }) => {
      if (tid === taskId) setTypingUser(null);
    };

    socket.on("comment:added", handleCommentAdded);
    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:created", handleTaskCreated);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("comment:added", handleCommentAdded);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:created", handleTaskCreated);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, taskId, user?.name, queryClient]);

  // ── Update task ──
  const updateTask = useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/tasks/${taskId}`, {
        ...data,
        workspaceId: task?.project?.workspaceId,
      });
      return res.data?.data || res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["task", taskId], (prev) => ({
        ...prev,
        ...updated,
      }));
      queryClient.invalidateQueries(["tasks", task?.projectId]);
      toast.success("Task updated");
      setIsEditing(false);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Update failed"),
  });

  // ── Add comment ──
  const addComment = useMutation({
    mutationFn: async (content) => {
      const res = await api.post(`/tasks/${taskId}/comments`, {
        content,
        workspaceId: task?.project?.workspaceId,
      });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      if (commentRef.current) commentRef.current.value = "";
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to add comment"),
  });

  // ── Create subtask ──
  const {
    register: regSub,
    handleSubmit: handleSub,
    reset: resetSub,
  } = useForm();

  const createSubtask = useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/tasks/project/${task?.projectId}`, {
        ...data,
        parentId: taskId,
        status: "TODO",
        workspaceId: task?.project?.workspaceId,
      });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      // ← removed cache update here, socket handles it for everyone
      resetSub();
      setShowSubtask(false);
      toast.success("Subtask added!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  // ── Toggle subtask ──
  const toggleSubtask = useMutation({
    mutationFn: async (subtask) => {
      const newStatus = subtask.status === "DONE" ? "TODO" : "DONE";
      const res = await api.put(`/tasks/${subtask.id}`, { status: newStatus });
      return res.data?.data || res.data;
    },
    onMutate: async (subtask) => {
      await queryClient.cancelQueries(["task", taskId]);
      const newStatus = subtask.status === "DONE" ? "TODO" : "DONE";
      queryClient.setQueryData(["task", taskId], (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subtasks: prev.subtasks?.map((st) =>
            st.id === subtask.id ? { ...st, status: newStatus } : st,
          ),
        };
      });
    },
    onError: () => {
      queryClient.invalidateQueries(["task", taskId]);
      toast.error("Failed to update subtask");
    },
  });

  // ── Edit form ──
  const { register, handleSubmit, reset: resetEdit } = useForm();

  const handleStartEdit = () => {
    resetEdit({
      title: task?.title,
      description: task?.description || "",
      priority: task?.priority,
      status: task?.status,
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditing(true);
  };

  // ── Typing indicator ──
  const handleCommentTyping = () => {
    if (!socket || !task?.project?.workspaceId) return;
    socket.emit("typing:start", {
      workspaceId: task.project.workspaceId,
      taskId,
    });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", {
        workspaceId: task.project.workspaceId,
        taskId,
      });
    }, 2000);
  };

  // ── Submit comment ──
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    const content = commentRef.current?.value?.trim();
    if (!content) return;
    addComment.mutate(content);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="skeleton h-6 w-2/5 rounded" />
          <div className="skeleton h-4 w-1/4 rounded" />
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="col-span-2 space-y-4">
              <div className="skeleton h-32 rounded-lg" />
              <div className="skeleton h-48 rounded-lg" />
            </div>
            <div className="space-y-4">
              <div className="skeleton h-40 rounded-lg" />
              <div className="skeleton h-32 rounded-lg" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!task)
    return (
      <Layout>
        <div className="flex items-center justify-center py-24 text-ink-4 text-sm">
          Task not found
        </div>
      </Layout>
    );

  const doneSubtasks =
    task.subtasks?.filter((s) => s.status === "DONE").length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[12px] text-ink-4 hover:text-ink-2 transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to board
          </button>
          <span className="text-ink-4 text-[12px]">/</span>
          <span className="text-[12px] text-ink-3 truncate max-w-xs">
            {task.title}
          </span>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left col ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Task header */}
            <div className="card-base p-5">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge type={task.priority} />
                <Badge type={task.status} />
                {task.dueDate && (
                  <span
                    className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded border ${new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "bg-danger/10 border-danger/20 text-danger/80" : "bg-surface-3 border-border-2 text-ink-4"}`}
                  >
                    📅{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              {isEditing ? (
                <form
                  onSubmit={handleSubmit((d) => updateTask.mutate(d))}
                  className="space-y-3"
                >
                  <Input
                    label="Title"
                    {...register("title", { required: true })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12.5px] font-medium text-ink-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      className="input-base px-3 py-2 resize-none"
                      placeholder="Task description..."
                      {...register("description")}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-medium text-ink-2">
                        Status
                      </label>
                      <select
                        {...register("status")}
                        className="input-base h-9 px-3"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-medium text-ink-2">
                        Priority
                      </label>
                      <select
                        {...register("priority")}
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
                      label="Due date"
                      type="date"
                      {...register("dueDate")}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1"
                      loading={updateTask.isPending}
                    >
                      Save changes
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h1 className="text-lg font-semibold text-ink-1 leading-snug tracking-tight">
                      {task.title}
                    </h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleStartEdit}
                      className="flex-shrink-0"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit
                    </Button>
                  </div>
                  {task.description ? (
                    <p className="text-[13px] text-ink-3 leading-relaxed">
                      {task.description}
                    </p>
                  ) : (
                    <button
                      onClick={handleStartEdit}
                      className="text-[12.5px] text-ink-4 hover:text-ink-2 italic transition-colors"
                    >
                      + Add description
                    </button>
                  )}
                </>
              )}
            </div>

            {/* ── Subtasks ── */}
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[12.5px] font-semibold text-ink-1">
                    Subtasks
                  </h3>
                  {totalSubtasks > 0 && (
                    <span className="text-[11px] text-ink-4 bg-surface-3 border border-border-2 px-1.5 py-0.5 rounded-full">
                      {doneSubtasks}/{totalSubtasks}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSubtask(true)}
                >
                  + Add subtask
                </Button>
              </div>

              {totalSubtasks > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-surface-4 rounded-full h-1 overflow-hidden">
                    <div
                      className="h-1 bg-success rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((doneSubtasks / totalSubtasks) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {task.subtasks?.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[12px] text-ink-4 mb-3">No subtasks yet</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowSubtask(true)}
                  >
                    + Add first subtask
                  </Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {task.subtasks?.map((st) => (
                    <SubtaskItem
                      key={st.id}
                      subtask={st}
                      onToggle={(st) => toggleSubtask.mutate(st)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Comments ── */}
            <div className="card-base p-5">
              <h3 className="text-[12.5px] font-semibold text-ink-1 mb-4">
                Comments
                {comments.length > 0 && (
                  <span className="ml-2 text-[11px] text-ink-4 font-normal">
                    {comments.length}
                  </span>
                )}
              </h3>

              <div className="space-y-4 mb-5">
                {comments.length === 0 ? (
                  <p className="text-[12px] text-ink-4 text-center py-4">
                    No comments yet — be the first to comment
                  </p>
                ) : (
                  comments.map((c, i) => (
                    <CommentItem
                      key={c.id || i}
                      comment={c}
                      currentUserId={user?.id}
                    />
                  ))
                )}

                {typingUser && (
                  <div className="flex items-center gap-2 text-[12px] text-ink-4 italic">
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 bg-ink-4 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    {typingUser} is typing...
                  </div>
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[10px] flex-shrink-0 mt-1.5">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <textarea
                    ref={commentRef}
                    rows={2}
                    placeholder="Write a comment..."
                    className="input-base px-3 py-2 resize-none flex-1 text-[12.5px]"
                    onChange={handleCommentTyping}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    loading={addComment.isPending}
                    className="self-end"
                  >
                    Send
                  </Button>
                </div>
              </form>
              <p className="text-[11px] text-ink-4 mt-1.5 ml-8">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>

          {/* ── Right col ── */}
          <div className="space-y-4">
            <div className="card-base p-4 space-y-4">
              <h3 className="text-[12.5px] font-semibold text-ink-1">
                Details
              </h3>

              <div>
                <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-2">
                  Status
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateTask.mutate({ status: s })}
                      className={`text-[11px] font-medium px-2 py-1.5 rounded-md border transition-all text-left ${task.status === s ? "bg-accent/10 border-accent/30 text-accent-300" : "bg-surface-3 border-border-2 text-ink-3 hover:border-border-3 hover:text-ink-2"}`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-2">
                  Assignee
                </p>
                <select
                  className="input-base h-9 px-3 w-full text-[12.5px]"
                  value={task.assigneeId || ""}
                  onChange={(e) =>
                    updateTask.mutate({ assigneeId: e.target.value || null })
                  }
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-2">
                  Created by
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-4 border border-border-2 flex items-center justify-center text-ink-3 font-semibold text-[10px]">
                    {task.creator?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-[12.5px] text-ink-2">
                    {task.creator?.name}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-2">
                  Created
                </p>
                <p className="text-[12.5px] text-ink-3">
                  {new Date(task.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <AIPanel
              task={task}
              onApplyDescription={(desc) =>
                updateTask.mutate({ description: desc })
              }
              onApplyDueDate={(date) => updateTask.mutate({ dueDate: date })}
            />
          </div>
        </div>
      </div>

      {/* ── Add Subtask Modal ── */}
      <Modal
        isOpen={showSubtask}
        onClose={() => {
          setShowSubtask(false);
          resetSub();
        }}
        title="Add Subtask"
      >
        <form
          onSubmit={handleSub((d) => createSubtask.mutate(d))}
          className="space-y-4"
        >
          <Input
            label="Subtask title"
            placeholder="What needs to be done?"
            {...regSub("title", { required: "Title is required" })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium text-ink-2">
              Priority
            </label>
            <select
              {...regSub("priority")}
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
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowSubtask(false);
                resetSub();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createSubtask.isPending}
            >
              Add Subtask →
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default TaskDetailPage;
