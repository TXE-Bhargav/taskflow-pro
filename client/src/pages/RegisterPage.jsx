// RegisterPage.jsx — Dark premium split layout

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.register({ name: data.name, email: data.email, password: data.password });
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-[880px] flex rounded-xl overflow-hidden border border-border-2 shadow-modal">

        {/* ── Left panel ── */}
        <div className="hidden md:flex flex-col justify-between w-[42%] bg-surface-1 p-8 border-r border-border-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(232,160,69,1) 1px, transparent 1px), linear-gradient(90deg, rgba(232,160,69,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

          <div className="relative z-10 flex items-center gap-2">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center text-surface-0 font-bold text-[11px]">T</div>
            <span className="font-semibold text-ink-1 text-[13px]">TaskFlow<span className="text-accent-400"> Pro</span></span>
          </div>

          <div className="relative z-10">
            <p className="text-[10.5px] font-semibold text-accent-400 uppercase tracking-[0.15em] mb-3">
              Get started free
            </p>
            <h2 className="text-[22px] font-semibold text-ink-1 leading-[1.25] tracking-tight mb-6">
              Your team's new home for getting things done.
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {[
                { val: '10,000+', label: 'Teams using TaskFlow' },
                { val: '99.9%',   label: 'Uptime guaranteed' },
                { val: '5 min',   label: 'Average setup time' },
                { val: 'Free',    label: 'To get started' },
              ].map(s => (
                <div key={s.label} className="bg-surface-2 border border-border-2 rounded-lg p-3">
                  <p className="text-sm font-semibold text-ink-1">{s.val}</p>
                  <p className="text-[10.5px] text-ink-4 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-[11px] text-ink-4">© 2025 TaskFlow Pro. All rights reserved.</p>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 bg-surface-2 flex flex-col justify-center px-8 py-10">

          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-surface-0 font-bold text-[10px]">T</div>
            <span className="font-semibold text-ink-1 text-[13px]">TaskFlow Pro</span>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink-1 tracking-tight mb-1">Create your account</h1>
            <p className="text-[12.5px] text-ink-3">Start managing your tasks — it's free</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <Input
              label="Full name"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name too short' },
              })}
            />
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
            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              error={errors.password?.message}
              hint="Use at least 6 characters with a mix of letters and numbers"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('password') || 'Passwords do not match',
              })}
            />

            <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
              Create account →
            </Button>
          </form>

          <p className="text-[11px] text-ink-4 text-center mt-4 leading-relaxed">
            By creating an account you agree to our{' '}
            <span className="text-ink-3 underline cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-ink-3 underline cursor-pointer">Privacy Policy</span>
          </p>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border-1" />
            <span className="text-[11px] text-ink-4">already a member?</span>
            <div className="flex-1 h-px bg-border-1" />
          </div>

          <Link to="/login">
            <Button variant="secondary" className="w-full" size="lg">
              Sign in instead
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;