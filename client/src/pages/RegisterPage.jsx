import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student', description: 'Find opportunities and track skills' },
  { value: 'company', label: 'Company', description: 'Post opportunities and find talent' },
  { value: 'institution', label: 'Institution', description: 'Manage programs and students' },
];

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    company_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    institutionInviteCode: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Client-side confirm-password check
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords do not match.' });
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name,
        company_name: form.role === 'company' ? (form.company_name || form.name) : undefined,
        email: form.email,
        password: form.password,
        role: form.role,
        institutionInviteCode: form.role === 'institution' ? form.institutionInviteCode : undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.errors) {
        const mapped = {};
        err.errors.forEach((fe) => { mapped[fe.field] = fe.message; });
        setFieldErrors(mapped);
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight text-indigo-400 hover:text-indigo-300 transition-colors">
              SkillConnect
            </h1>
          </Link>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-xl shadow-black/20 space-y-5"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all
                ${fieldErrors.name ? 'border-red-500' : 'border-gray-700'}`}
              placeholder="John Doe"
            />
            {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all
                ${fieldErrors.email ? 'border-red-500' : 'border-gray-700'}`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all
                ${fieldErrors.password ? 'border-red-500' : 'border-gray-700'}`}
              placeholder="Min. 8 characters"
            />
            {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
            <p className="text-gray-600 text-xs mt-1">Must include uppercase, lowercase, and a number.</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <input
              id="reg-confirm"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-gray-800/60 border rounded-xl text-white placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all
                ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-700'}`}
              placeholder="••••••••"
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Role */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-300 mb-2">Account Type</legend>
            <div className="grid gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                    ${form.role === opt.value
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-gray-700 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={form.role === opt.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${form.role === opt.value ? 'border-indigo-400' : 'border-gray-600'}`}
                  >
                    {form.role === opt.value && (
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Company Name (conditional) */}
          {form.role === 'company' && (
            <div className="animate-in">
              <label htmlFor="reg-company" className="block text-sm font-medium text-gray-300 mb-1.5">
                Company Name <span className="text-gray-500 text-xs font-normal">(optional, defaults to Full Name)</span>
              </label>
              <input
                id="reg-company"
                name="company_name"
                type="text"
                value={form.company_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="Acme Corp"
              />
            </div>
          )}

          {/* Institution Invite Code (conditional) */}
          {form.role === 'institution' && (
            <div className="animate-in">
              <label htmlFor="reg-invite" className="block text-sm font-medium text-gray-300 mb-1.5">
                Institution Invite Code
              </label>
              <input
                id="reg-invite"
                name="institutionInviteCode"
                type="text"
                required
                value={form.institutionInviteCode}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="Enter your invite code"
              />
              <p className="text-gray-600 text-xs mt-1">
                Institution accounts require an authorized invite code.
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed
              text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-sm text-gray-500 text-center pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
