import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ProfilePage = () => {
  const { user, setUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: user?.name || '' }
  });

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      const res = await api.patch('/users/profile', data);
      return res.data;
    },
    onSuccess: (updated) => {
      // Update store + localStorage
      const newUser = { ...user, name: updated.name };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed')
  });

  return (
    <Layout>
      <div className="max-w-lg">
        <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest mb-1">
          Account
        </p>
        <h1 className="text-[22px] font-semibold text-ink-1 tracking-tight mb-8">
          Profile
        </h1>

        {/* Avatar */}
        <div className="card-base p-5 mb-4">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center text-accent-300 font-bold text-xl">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-ink-1">{user?.name}</p>
              <p className="text-[12px] text-ink-4">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(d => updateProfile.mutate(d))} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Your name"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Too short' }
              })}
            />
            <Input
              label="Email address"
              value={user?.email}
              disabled
              hint="Email cannot be changed"
            />
            <Button type="submit" size="sm" loading={updateProfile.isPending}>
              Save changes
            </Button>
          </form>
        </div>

        {/* Account info */}
        <div className="card-base p-5">
          <p className="text-[12.5px] font-semibold text-ink-1 mb-3">Account info</p>
          <div className="space-y-2 text-[12.5px]">
            <div className="flex justify-between">
              <span className="text-ink-4">Account ID</span>
              <span className="text-ink-3 font-mono text-[11px]">{user?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;