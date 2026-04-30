// LoginPage.jsx — Dark premium split layout

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { user } = await authService.login(data);
      setUser(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-[880px] flex rounded-xl overflow-hidden border border-border-2 shadow-modal">

        {/* ── Left panel ── */}
        <div className="hidden md:flex flex-col justify-between w-[42%] bg-surface-1 p-8 border-r border-border-1 relative overflow-hidden">
          {/* Geometric accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

          {/* Grid decoration */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(232,160,69,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,160,69,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center text-surface-0 font-bold text-[11px] shadow-glow-sm">T</div>
              <span className="font-semibold text-ink-1 text-[13px]">TaskFlow<span className="text-accent-400"> Pro</span></span>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-[10.5px] font-semibold text-accent-400 uppercase tracking-[0.15em] mb-3">
              Ship faster, together
            </p>
            <h2 className="text-[22px] font-semibold text-ink-1 leading-[1.25] tracking-tight mb-4">
              Everything your team needs in one place.
            </h2>

            <div className="space-y-3 mt-6">
              {[
                { icon: '⚡', label: 'AI-powered task breakdown' },
                { icon: '👥', label: 'Real-time collaboration' },
                { icon: '📊', label: 'Visual progress tracking' },
                { icon: '🔔', label: 'Smart notifications' },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-sm">{f.icon}</span>
                  <span className="text-[12.5px] text-ink-3">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2">
            {[
              { val: '10k+', label: 'Teams' },
              { val: '99.9%', label: 'Uptime' },
              { val: 'Free', label: 'To start' },
            ].map(s => (
              <div key={s.label} className="bg-surface-2 border border-border-2 rounded-lg p-3">
                <p className="text-sm font-semibold text-ink-1">{s.val}</p>
                <p className="text-[10.5px] text-ink-4 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 bg-surface-2 flex flex-col justify-center px-8 py-10">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-surface-0 font-bold text-[10px]">T</div>
            <span className="font-semibold text-ink-1 text-[13px]">TaskFlow Pro</span>
          </div>

          <div className="mb-7">
            <h1 className="text-xl font-semibold text-ink-1 tracking-tight mb-1">Welcome back</h1>
            <p className="text-[12.5px] text-ink-3">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' },
              })}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12.5px] font-medium text-ink-2">Password</label>
                <Link to="/forgot-password" className="text-[11.5px] text-accent-400 hover:text-accent-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Min 6 characters' },
                })}
              />
            </div>

            <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
              Sign in →
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-1" />
            <span className="text-[11px] text-ink-4">or</span>
            <div className="flex-1 h-px bg-border-1" />
          </div>

          <p className="text-center text-[12.5px] text-ink-3">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;