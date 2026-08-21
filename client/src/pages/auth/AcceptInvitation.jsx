import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invitationService } from '../../services/invitationService';
import { useAuthStore } from '../../store/authStore';
import { useWorkspaceStore } from '../../store/workspaceStore';

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, checkAuth } = useAuthStore();
  const { setActiveOrganization } = useWorkspaceStore();

  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  // New user registration fields
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      setIsLoading(true);
      try {
        const res = await invitationService.getInvitationByToken(token);
        if (res.success && res.data) {
          setInvitation(res.data);
        } else {
          setErrorState(res.message || 'Invalid invitation link');
        }
      } catch (err) {
        setErrorState(
          err.response?.data?.message || 'Failed to load invitation. The link may have expired or was revoked.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const passwordMeetsPolicy = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  };

  const handleAcceptNewUser = async (e) => {
    e.preventDefault();
    setLocalError('');

    const { firstName, lastName, password, confirmPassword } = formData;

    if (!firstName.trim() || !lastName.trim() || !password) {
      setLocalError('Please fill in all required fields');
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
      setLocalError('Password does not satisfy security requirements');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await invitationService.acceptInvitation(token, {
        firstName,
        lastName,
        password,
      });

      if (res.success) {
        await checkAuth();
        if (res.data?.organization) {
          setActiveOrganization(res.data.organization);
        }
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptExistingUser = async () => {
    setLocalError('');
    setIsSubmitting(true);
    try {
      const res = await invitationService.acceptInvitation(token, {});
      if (res.success) {
        await checkAuth();
        if (res.data?.organization) {
          setActiveOrganization(res.data.organization);
        }
        navigate('/app/dashboard', { replace: true });
      }
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (errorState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Invitation Unavailable</h2>
            <p className="text-sm text-slate-500 mt-2">{errorState}</p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Go to Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExistingUser = invitation?.existingUser;
  const isCurrentlyLoggedInWithMatchingEmail = user && user.email === invitation?.email;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100 space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-lg shadow-indigo-200">
            N
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            You're invited!
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Join <span className="font-semibold text-slate-900">{invitation?.organizationName}</span> on Nexus
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {invitation?.email}
          </div>
        </div>

        {localError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            {localError}
          </div>
        )}

        {isExistingUser ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-indigo-900">Existing Nexus Account</p>
              <p>
                An account with <span className="font-medium text-slate-900">{invitation?.email}</span> already exists.
              </p>
            </div>

            {isCurrentlyLoggedInWithMatchingEmail ? (
              <button
                type="button"
                onClick={handleAcceptExistingUser}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Joining workspace...' : `Accept & Join ${invitation?.organizationName}`}
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full inline-flex justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                >
                  Sign in to Accept Invitation
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleAcceptNewUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {/* Password Policy Helper */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className={`flex items-center ${passwordMeetsPolicy.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.length ? '✓' : '•'}</span> At least 8 characters
              </div>
              <div className={`flex items-center ${passwordMeetsPolicy.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.upper ? '✓' : '•'}</span> At least one uppercase letter
              </div>
              <div className={`flex items-center ${passwordMeetsPolicy.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.lower ? '✓' : '•'}</span> At least one lowercase letter
              </div>
              <div className={`flex items-center ${passwordMeetsPolicy.number ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className="mr-1.5">{passwordMeetsPolicy.number ? '✓' : '•'}</span> At least one number
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Creating account & joining...' : 'Create Account & Join'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
