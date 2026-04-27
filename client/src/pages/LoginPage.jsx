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
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-2xl border border-gray-100">

        {/* ── Left dark panel ── */}
        <div className="hidden md:flex flex-col justify-between w-5/12 bg-gray-950 p-8">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              T
            </div>
            <span className="text-white font-medium text-sm tracking-tight">TaskFlow Pro</span>
          </div>

          {/* Middle content */}
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-medium mb-3">
              Why teams choose us
            </p>
            <h2 className="text-white text-xl font-medium leading-snug mb-6">
              Everything your team needs to ship faster.
            </h2>
            <ul className="space-y-4">
              {[
                { icon: '⚡', title: 'AI-powered task breakdown', desc: 'Turn vague goals into clear subtasks instantly' },
                { icon: '👥', title: 'Real-time collaboration', desc: 'See changes as they happen, no refresh needed' },
                { icon: '📊', title: 'Analytics dashboard', desc: 'Track team productivity with visual insights' },
                { icon: '🔔', title: 'Smart notifications', desc: 'Stay updated via email and in-app alerts' },
              ].map(f => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="text-base mt-0.5">{f.icon}</span>
                  <div>
                    <p className="text-white/80 text-sm font-medium leading-tight">{f.title}</p>
                    <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/20 text-xs">© 2025 TaskFlow Pro. All rights reserved.</p>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-10 py-12">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">T</div>
            <span className="font-semibold text-gray-900">TaskFlow Pro</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Min 6 characters' }
                })}
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Sign in →
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Stats row — social proof */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { val: '10k+', label: 'Teams' },
              { val: '99.9%', label: 'Uptime' },
              { val: 'Free', label: 'To start' },
            ].map(s => (
              <div key={s.label} className="text-center bg-gray-50 rounded-xl py-3">
                <p className="text-sm font-semibold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;