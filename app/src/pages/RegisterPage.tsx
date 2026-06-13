/**
 * Registration page — powered by Supabase Auth.
 * On success, auto-signs in and redirects to dashboard.
 */
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Lock, Sparkles, Mail, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

function getPasswordChecks(pw: string) {
  return {
    length: pw.length >= 6,
    hasLetter: /[A-Za-z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordChecks = getPasswordChecks(password);
  const passwordValid = passwordChecks.length;
  const confirmValid = confirm.length > 0 && confirm === password;
  const formValid = emailValid && passwordValid && confirmValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !formValid) return;
    setError(null);
    setSubmitting(true);
    const result = await register(email.trim().toLowerCase(), password, displayName.trim() || undefined);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/app', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(255,212,0,0.18),transparent_34%),linear-gradient(135deg,#fffdf7,#ffffff_48%,#faf9f4)] px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        <div className="rounded-2xl border border-[#eee6cf] bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD400] text-[#151526] shadow-lg shadow-[#ffd400]/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Get started with a free account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-slate-600">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 pl-9"
                  required
                />
              </div>
              {email.length > 0 && !emailValid && (
                <p className="text-[11px] text-amber-600">Please enter a valid email address.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium text-slate-600">
                Display name <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Alex Chen"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10"
                maxLength={40}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-slate-600">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <ul className="mt-1.5 space-y-0.5 text-[11px]">
                  <PasswordRule ok={passwordChecks.length} label="At least 6 characters" />
                  <PasswordRule ok={passwordChecks.hasLetter} label="Contains a letter" />
                  <PasswordRule ok={passwordChecks.hasNumber} label="Contains a number" />
                </ul>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-xs font-medium text-slate-600">
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-10 pl-9"
                  required
                />
              </div>
              {confirm.length > 0 && !confirmValid && (
                <p className="text-[11px] text-red-600">Passwords don&apos;t match.</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !formValid}
              className="h-10 w-full bg-[#FFD400] text-sm font-bold text-[#151526] shadow-sm hover:bg-[#F2B900]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#8a6500] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
      <Check className={`h-3 w-3 ${ok ? 'opacity-100' : 'opacity-40'}`} />
      {label}
    </li>
  );
}
