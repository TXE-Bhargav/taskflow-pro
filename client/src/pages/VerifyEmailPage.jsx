import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  // 4 possible states: loading | success | already_verified | error
  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    let called = false;

    const verify = async () => {
      if (called) return;
      called = true;

      try {
        const res = await authService.verifyEmail(token);

        // Backend tells us exactly what happened
        if (res.status === 'already_verified') {
          setStatus('already_verified');
        } else {
          setStatus('success');
        }
        setMessage(res.message);

      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          'Verification failed. Link may be expired.'
        );
      }
    };

    verify();
    return () => { called = true; };
  }, []);

  // Auto redirect on success only (not already_verified)
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => navigate('/login'), 4000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-72 h-72 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-100 rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-10 text-center border border-gray-100">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
            T
          </div>
          <span className="font-bold text-xl text-gray-900">TaskFlow Pro</span>
        </div>

        {/* ── LOADING ── */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verifying your email
              </h2>
              <p className="text-gray-400 text-sm">Please wait a moment...</p>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center ring-8 ring-green-50">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Email Verified! 🎉
              </h2>
              <p className="text-gray-500 text-sm">{message}</p>
              <p className="text-gray-300 text-xs mt-2">
                Redirecting to login in a few seconds...
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ animation: 'progress 4s linear forwards' }}
              />
            </div>
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-100 text-sm"
            >
              Go to Login now →
            </Link>
          </div>
        )}

        {/* ── ALREADY VERIFIED ── */}
        {status === 'already_verified' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center ring-8 ring-blue-50">
              <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Already Verified ✓
              </h2>
              <p className="text-gray-500 text-sm">{message}</p>
              <p className="text-gray-400 text-xs mt-2">
                No action needed — your account is ready to use.
              </p>
            </div>

            {/* Info box */}
            <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-4 text-left">
              <p className="text-blue-700 text-xs font-medium mb-1">What does this mean?</p>
              <p className="text-blue-500 text-xs leading-relaxed">
                Your email was already verified. This happens if you clicked the verification link more than once. Your account is fully active!
              </p>
            </div>

            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-100 text-sm"
            >
              Go to Login →
            </Link>
          </div>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center ring-8 ring-red-50">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-400 text-sm">{message}</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition-all shadow-md shadow-indigo-100 text-sm"
              >
                Go to Login
              </Link>
              <Link
                to="/register"
                className="w-full inline-flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Create new account
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmailPage;