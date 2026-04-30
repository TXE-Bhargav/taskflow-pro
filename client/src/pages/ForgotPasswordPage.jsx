// ForgotPasswordPage.jsx

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
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
          {sent ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 border border-success/20 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4">
                📬
              </div>
              <h1 className="text-lg font-semibold text-ink-1 mb-2">Check your email</h1>
              <p className="text-[12.5px] text-ink-3 leading-relaxed mb-6">
                If that email exists in our system, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link
                to="/login"
                className="text-[12.5px] text-accent-400 hover:text-accent-300 transition-colors font-medium"
              >
                ← Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-ink-1 tracking-tight mb-1">Forgot password?</h1>
                <p className="text-[12.5px] text-ink-3">Enter your email and we'll send you a reset link.</p>
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

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Send reset link →
                </Button>
              </form>

              <p className="text-center text-[12.5px] text-ink-3 mt-5">
                <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium transition-colors">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;