// ResetPasswordPage.jsx

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  // No token in URL — show error immediately
  if (!token) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="card-base p-7 text-center">
            <div className="w-12 h-12 bg-danger/10 border border-danger/20 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">
              ⚠️
            </div>
            <h1 className="text-lg font-semibold text-ink-1 mb-2">Invalid reset link</h1>
            <p className="text-[12.5px] text-ink-3 leading-relaxed mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password" className="text-[12.5px] text-accent-400 hover:text-accent-300 font-medium transition-colors">
              Request new link →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.resetPassword(token, data.newPassword);
      toast.success('Password reset! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed — link may have expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center text-surface-0 font-bold text-[11px] shadow-glow-sm">T</div>
          <span className="font-semibold text-ink-1 text-[13px]">TaskFlow<span className="text-accent-400"> Pro</span></span>
        </div>

        <div className="card-base p-7">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink-1 tracking-tight mb-1">Set new password</h1>
            <p className="text-[12.5px] text-ink-3">Choose a strong password for your account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              error={errors.newPassword?.message}
              {...register('newPassword', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />

            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === watch('newPassword') || 'Passwords do not match',
              })}
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Reset password →
            </Button>
          </form>

          <p className="text-center text-[12.5px] text-ink-3 mt-5">
            <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;