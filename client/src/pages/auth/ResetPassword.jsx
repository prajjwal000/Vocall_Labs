import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authService } from '../../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordMeetsPolicy = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!password || !confirmPassword) {
      setLocalError('Please fill in both fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (
      !passwordMeetsPolicy.length ||
      !passwordMeetsPolicy.upper ||
      !passwordMeetsPolicy.lower ||
      !passwordMeetsPolicy.number
    ) {
      setLocalError('Password does not meet the security requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.resetPassword({ token, password });
      setSuccessMessage(res.message || 'Password has been updated successfully.');
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 -right-40 w-[30rem] h-[30rem] bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-glow-indigo">
                N
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs text-slate-400">
              Please choose a strong password to secure your account.
            </p>
          </div>

          {successMessage ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium leading-relaxed">
                {successMessage}
              </div>
              <div>
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-glow-indigo transition-all cursor-pointer inline-flex items-center justify-center space-x-1"
                >
                  <span>Proceed to Sign in</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {localError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-start space-x-2 animate-in fade-in duration-200">
                  <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                  <span>{localError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              {/* Password checklist */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-[11px] grid grid-cols-2 gap-1.5">
                <div className={`flex items-center space-x-1.5 ${passwordMeetsPolicy.length ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                  <span>{passwordMeetsPolicy.length ? '✓' : '•'}</span>
                  <span>8+ Characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordMeetsPolicy.upper ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                  <span>{passwordMeetsPolicy.upper ? '✓' : '•'}</span>
                  <span>Uppercase Letter</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordMeetsPolicy.lower ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                  <span>{passwordMeetsPolicy.lower ? '✓' : '•'}</span>
                  <span>Lowercase Letter</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${passwordMeetsPolicy.number ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                  <span>{passwordMeetsPolicy.number ? '✓' : '•'}</span>
                  <span>Number (0-9)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-glow-indigo transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 group pt-2.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating password...</span>
                  </div>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors text-xs"
                >
                  ← Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
