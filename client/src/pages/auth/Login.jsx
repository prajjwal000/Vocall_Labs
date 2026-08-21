import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Crown,
  Briefcase,
  UserCheck,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { StaggeredWords, ShimmerHeading } from '../../components/ui/AnimatedText';

const DEMO_ACCOUNTS = [
  {
    roleTitle: 'Platform Admin',
    name: 'Alex Vance',
    email: 'platform.admin@nexus.com',
    badge: 'Superuser (*)',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    scope: 'Platform Console & Global RBAC',
    icon: <ShieldCheck className="w-4 h-4 text-rose-500" />,
  },
  {
    roleTitle: 'Organization Owner',
    name: 'Olivia Owner',
    email: 'owner@acme.com',
    badge: 'Owner (*)',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    scope: 'Acme Corp (Full Org Access)',
    icon: <Crown className="w-4 h-4 text-indigo-500" />,
  },
  {
    roleTitle: 'Department Manager',
    name: 'Marcus Manager',
    email: 'manager@acme.com',
    badge: 'Manager',
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    scope: 'Teams, Stages & Review Routing',
    icon: <Briefcase className="w-4 h-4 text-purple-500" />,
  },
  {
    roleTitle: 'Expense Approver',
    name: 'Arthur Approver',
    email: 'approver@acme.com',
    badge: 'Approver',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    scope: 'Finance Approvals & Requisition Inbox',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  },
  {
    roleTitle: 'Employee / Requester',
    name: 'Emma Employee',
    email: 'employee@acme.com',
    badge: 'Member',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    scope: 'Self-Service & Workflow Triggers',
    icon: <UserCheck className="w-4 h-4 text-blue-500" />,
  },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePersonaEmail, setActivePersonaEmail] = useState(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app/dashboard';

  const handleLoginWithCredentials = async (loginEmail, loginPassword) => {
    setLocalError('');
    setIsSubmitting(true);
    const result = await login({ email: loginEmail, password: loginPassword });
    setIsSubmitting(false);

    if (result.success) {
      if (loginEmail === 'platform.admin@nexus.com' && from === '/app/dashboard') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setLocalError(result.message || 'Invalid email or password');
      setActivePersonaEmail(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setLocalError('Please enter both your email address and password');
      return;
    }
    await handleLoginWithCredentials(email, password);
  };

  const handleSelectDemoAccount = (demo) => {
    setActivePersonaEmail(demo.email);
    setEmail(demo.email);
    setPassword('Password123');
    setLocalError('');
    handleLoginWithCredentials(demo.email, 'Password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-5 right-5 z-20 flex items-center space-x-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
          Toggle Theme
        </span>
        <ThemeToggle />
      </div>

      {/* Decorative Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/15 dark:bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10"
      >
        
        {/* Left Side: Brand Showcase & 1-Click Persona Deck */}
        <div className="lg:col-span-7 space-y-7 pr-0 lg:pr-4">
          
          {/* Logo & Headline */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-xs"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Enterprise Multi-Tenant Engine
              </span>
            </motion.div>

            <div className="flex items-center space-x-3.5">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.05 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/25 shrink-0"
              >
                N
              </motion.div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Nexus Platform
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <StaggeredWords text="Zero-Trust Isolation • Multi-Stage Approvals • Dual RBAC" delay={0.05} />
                </p>
              </div>
            </div>
          </div>

          {/* Value Highlights with Framer Motion cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <ShieldCheck className="w-4 h-4 text-indigo-500" />, title: 'Zero-Leak RBAC', desc: 'Tenant isolation & wildcard policies' },
              { icon: <Zap className="w-4 h-4 text-purple-500" />, title: 'Workflows', desc: 'Multi-stage approval routing' },
              { icon: <Sparkles className="w-4 h-4 text-emerald-500" />, title: 'Real-Time Feed', desc: 'Live dashboards & audit streams' },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/90 backdrop-blur-md shadow-xs space-y-1"
              >
                <div className="p-1.5 w-fit rounded-lg bg-slate-100 dark:bg-slate-800">
                  {card.icon}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 pt-1">{card.title}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{card.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* 1-Click Interactive Persona Deck */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>1-Click Interactive Persona Login</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                Password: "Password123"
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((demo) => {
                const isSelected = activePersonaEmail === demo.email && isSubmitting;
                return (
                  <motion.button
                    key={demo.email}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    type="button"
                    onClick={() => handleSelectDemoAccount(demo)}
                    disabled={isSubmitting}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer group flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-md shadow-indigo-500/10'
                        : 'bg-white/80 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/40 shadow-xs'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      {demo.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {demo.roleTitle}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border shrink-0 ${demo.badgeColor}`}>
                          {demo.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                        {demo.email}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {demo.scope}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Card */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Sign in to your Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your credentials or click any demo persona on the left.
              </p>
            </div>

            <AnimatePresence>
              {localError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start space-x-2"
                >
                  <span className="text-rose-500 font-bold shrink-0">⚠️</span>
                  <span>{localError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Remember session</span>
                </label>

                <Link
                  to="/forgot-password"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 group mt-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign in to Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an organization yet?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
                >
                  Create one now
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
