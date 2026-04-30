import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

const WorkspaceSettingsPage = () => {
  const { id: workspaceId } = useParams();
  const navigate            = useNavigate();
  const queryClient         = useQueryClient();
  const { user }            = useAuthStore();
  const [showRemove, setShowRemove]   = useState(null);

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn:  async () => {
      const res = await api.get(`/workspaces/${workspaceId}`);
      return res.data?.data || res.data;
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    values: { name: workspace?.name || '', description: workspace?.description || '' }
  });

  const updateWorkspace = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch(`/workspaces/${workspaceId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', workspaceId]);
      queryClient.invalidateQueries(['workspaces']);
      toast.success('Workspace updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  });

  const removeMember = useMutation({
    mutationFn: async (memberId) => {
      const res = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workspace', workspaceId]);
      toast.success('Member removed');
      setShowRemove(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed')
  });

  const myRole = workspace?.members?.find(m => m.user.id === user?.id)?.role;
  const isAdmin = myRole === 'OWNER' || myRole === 'ADMIN';

  if (isLoading) return (
    <Layout>
      <div className="space-y-4 animate-pulse max-w-2xl">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-40 rounded-lg" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(`/workspace/${workspaceId}`)}
            className="text-[12px] text-ink-4 hover:text-ink-2 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-ink-4 text-[12px]">/</span>
          <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest">
            Workspace settings
          </p>
        </div>

        {/* ── General settings ── */}
        <div className="card-base p-5 mb-4">
          <p className="text-[12.5px] font-semibold text-ink-1 mb-4">General</p>
          <form onSubmit={handleSubmit(d => updateWorkspace.mutate(d))} className="space-y-4">
            <Input
              label="Workspace name"
              placeholder="My Workspace"
              error={errors.name?.message}
              disabled={!isAdmin}
              {...register('name', { required: 'Name is required' })}
            />
            <Input
              label="Description"
              placeholder="What is this workspace for?"
              disabled={!isAdmin}
              {...register('description')}
            />
            {isAdmin && (
              <Button type="submit" size="sm" loading={updateWorkspace.isPending}>
                Save changes
              </Button>
            )}
          </form>
        </div>

        {/* ── Members ── */}
        <div className="card-base p-5">
          <p className="text-[12.5px] font-semibold text-ink-1 mb-4">
            Members · {workspace?.members?.length || 0}
          </p>
          <div className="space-y-1">
            {workspace?.members?.map(m => (
              <div
                key={m.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[10px]">
                    {m.user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-ink-1 leading-tight">
                      {m.user.name}
                      {m.user.id === user?.id && (
                        <span className="ml-1.5 text-[10px] text-ink-4 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-ink-4">{m.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full border
                    ${m.role === 'OWNER'  ? 'bg-accent/10 border-accent/20 text-accent-300' :
                      m.role === 'ADMIN'  ? 'bg-info/10 border-info/20 text-info/80' :
                      'bg-surface-4 border-border-2 text-ink-4'}`}
                  >
                    {m.role}
                  </span>
                  {m.status === 'PENDING' && (
                    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full border bg-warning/10 border-warning/20 text-warning/80">
                      Pending
                    </span>
                  )}
                  {isAdmin && m.user.id !== user?.id && m.role !== 'OWNER' && (
                    <button
                      onClick={() => setShowRemove(m.user)}
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

        {/* Danger zone */}
        {myRole === 'OWNER' && (
          <div className="mt-4 card-base p-5 border-danger/20">
            <p className="text-[12.5px] font-semibold text-danger/80 mb-2">Danger zone</p>
            <p className="text-[12px] text-ink-4 mb-4">
              Deleting a workspace permanently removes all projects, tasks, and member data.
            </p>
            <Button variant="danger" size="sm">Delete workspace</Button>
          </div>
        )}
      </div>

      {/* Remove member confirm */}
      <Modal
        isOpen={!!showRemove}
        onClose={() => setShowRemove(null)}
        title="Remove member"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-ink-2 leading-relaxed">
            Are you sure you want to remove <strong className="text-ink-1">{showRemove?.name}</strong> from this workspace? They will lose access to all projects.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={removeMember.isPending}
              onClick={() => removeMember.mutate(showRemove.id)}
            >
              Remove member
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default WorkspaceSettingsPage;