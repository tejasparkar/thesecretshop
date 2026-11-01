import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../lib/api.js';
import Lines from '../components/Lines.jsx';

function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = isLogin ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
      const fallback = user.role === 'admin' ? '/admin' : '/';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth wrap">
      <div className="auth__intro">
        <p className="eyebrow">( {isLogin ? 'Welcome back' : 'Join the club'} )</p>
        <Lines as="h1" lines={isLogin ? ['Sign', 'in.'] : ['Create', 'account.']} />
      </div>
      <form className="card auth__form" onSubmit={submit}>
        {!isLogin && (
          <label className="field">
            <span>Name</span>
            <input className="input" required value={form.name} onChange={set('name')} autoComplete="name" />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </label>
        <label className="field">
          <span>Password</span>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn--block" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
        <p className="auth__switch">
          {isLogin ? <>New here? <Link to="/register" state={location.state}>Create an account</Link></> : <>Have an account? <Link to="/login" state={location.state}>Sign in</Link></>}
        </p>
        {isLogin && (
          <p className="auth__hint">
            Demo: <code>demo@thesecretshop.com / demo123</code><br />
            Admin: <code>admin@thesecretshop.com / admin123</code>
          </p>
        )}
      </form>
    </div>
  );
}

export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;
