// VerifyEmailPage.jsx — Dark premium centered card

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token found in the link.'); return; }
    let called = false;
    const verify = async () => {
      if (called) return;
      called = true;
      try {
        const res = await authService.verifyEmail(token);
        setStatus(res.status === 'already_verified' ? 'already_verified' : 'success');
        setMessage(res.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. Link may be expired.');
      }
    };
    verify();
    return () => { called = true; };
  }, []);

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => navigate('/login'), 4000);
    return () => clearTimeout(t);
  }, [status, navigate]);

  const states = {
    loading: {
      icon: (
        <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      ),
      iconBg: 'bg-accent/10 border-accent/20',
      title: 'Verifying your email',
      sub: 'Please wait a moment...',
    },
    success: {
      icon: (
        <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      iconBg: 'bg-success/10 border-success/20',
      title: 'Email verified',
      sub: null,
    },
    already_verified: {
      icon: (
        <svg className="w-6 h-6 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-info/10 border-info/20',
      title: 'Already verified',
      sub: null,
    },
    error: {
      icon: (
        <svg className="w-6 h-6 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      iconBg: 'bg-danger/10 border-danger/20',
      title: 'Verification failed',
      sub: null,
    },
  };

  const s = states[status];

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-surface-2 border border-border-2 rounded-xl shadow-modal w-full max-w-sm p-8 text-center animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-surface-0 font-bold text-[10px]">T</div>
          <span className="font-semibold text-ink-1 text-[13px]">TaskFlow<span className="text-accent-400"> Pro</span></span>
        </div>

        {/* Icon */}
        <div className={`w-14 h-14 ${s.iconBg} border rounded-full flex items-center justify-center mx-auto mb-5`}>
          {s.icon}
        </div>

        <h2 className="text-base font-semibold text-ink-1 mb-2">{s.title}</h2>

        {message && <p className="text-[12.5px] text-ink-3 mb-5 leading-relaxed">{message}</p>}
        {s.sub    && <p className="text-[12px] text-ink-4 mb-5">{s.sub}</p>}

        {/* Success progress bar */}
        {status === 'success' && (
          <div className="w-full bg-surface-4 rounded-full h-0.5 overflow-hidden mb-5">
            <div className="h-full bg-accent rounded-full" style={{ animation: 'progress 4s linear forwards' }} />
          </div>
        )}

        {/* Already verified info */}
        {status === 'already_verified' && (
          <div className="bg-info/10 border border-info/20 rounded-lg p-3 text-left mb-5">
            <p className="text-[11.5px] text-info/80 leading-relaxed">
              Your email was already verified. This happens if you clicked the link more than once. Your account is fully active.
            </p>
          </div>
        )}

        {/* CTAs */}
        {status !== 'loading' && (
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center h-9 bg-accent hover:bg-accent-300 text-surface-0 font-semibold rounded-md text-[13px] transition-colors"
            >
              Go to login →
            </Link>
            {status === 'error' && (
              <Link
                to="/register"
                className="w-full inline-flex items-center justify-center h-9 bg-surface-3 hover:bg-surface-4 border border-border-2 text-ink-2 font-medium rounded-md text-[13px] transition-colors"
              >
                Create new account
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;