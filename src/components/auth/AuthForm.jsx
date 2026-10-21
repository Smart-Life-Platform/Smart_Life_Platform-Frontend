import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AuthForm() {
  const isRegister = useLocation().pathname === '/register';
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await (isRegister ? signUp(form) : signIn(form));
      navigate('/planner');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">{isRegister ? 'Start planning your days with clarity.' : 'Sign in to continue to your planner.'}</p>
        <form onSubmit={submit}>
          <label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input type="password" required minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button full-width" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <Link className="text-button" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Already have an account? Sign in' : 'New here? Create an account'}</Link>
      </section>
    </main>
  );
}
