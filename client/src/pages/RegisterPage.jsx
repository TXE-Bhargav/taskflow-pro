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
      await authService.register({
        name:     data.name,
        email:    data.email,
        password: data.password
      });
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
              Get started free
            </p>
            <h2 className="text-white text-xl font-medium leading-snug mb-2">
              Your team's new home for getting things done.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed mb-8">
              Join thousands of teams who use TaskFlow Pro to collaborate, track progress, and ship faster.
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: '10,000+', label: 'Teams using TaskFlow' },
                { val: '99.9%',   label: 'Uptime guaranteed' },
                { val: '5 min',   label: 'Average setup time' },
                { val: 'Free',    label: 'To get started' },
              ].map(s => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-white text-base font-semibold">{s.val}</p>
                  <p className="text-white/35 text-xs mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-white/20 text-xs">© 2025 TaskFlow Pro. All rights reserved.</p>
        </div>

        {/* ── Right form panel ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-10 py-10">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">T</div>
            <span className="font-semibold text-gray-900">TaskFlow Pro</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-1">
              Create your account
            </h1>
            <p className="text-sm text-gray-400">
              Start managing your tasks like a pro — it's free
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="John Doe"
              error={errors.name?.message}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name too short' }
              })}
            />

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

            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' }
              })}
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) =>
                  val === watch('password') || 'Passwords do not match'
              })}
            />

            {/* Password strength hint */}
            <p className="text-xs text-gray-400 -mt-1">
              Use at least 6 characters with a mix of letters and numbers.
            </p>

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-2"
              size="lg"
            >
              Create account →
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-300 text-center mt-4 leading-relaxed">
            By creating an account you agree to our{' '}
            <span className="text-gray-400 underline cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-gray-400 underline cursor-pointer">Privacy Policy</span>
          </p>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300 font-medium">Already a member?</span>
            <div className="flex-1 h-px bg-gray-100" />
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