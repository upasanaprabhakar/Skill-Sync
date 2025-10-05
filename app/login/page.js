'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../styles/AuthForm.module.css';
import Link from 'next/link';
import Layout from '../components/layout';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Fetch user data to get userId and role
      const userResponse = await fetch('/api/auth/session');
      const sessionData = await userResponse.json();
      
      if (sessionData?.user) {
        // Store userId in localStorage
        localStorage.setItem('userId', sessionData.user.id.toString());
        localStorage.setItem('userEmail', sessionData.user.email);

        // Redirect based on role
        if (sessionData.user.role === 'MENTOR') {
          router.push('/dashboard/mentor');
        } else if (sessionData.user.role === 'STUDENT') {
          router.push('/dashboard/student');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout pageType="login">
      <div className={styles.formContainer}>
        <h1 className={styles.heading}>Welcome Back</h1>
        <p className={styles.subheading}>Sign in to continue your journey with SkillSync.</p>
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <div className={styles.optionsContainer}>
            <div className={styles.checkboxContainer}>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#" className={styles.forgotPasswordLink}>
              Forgot password?
            </a>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <Link href="/register" className={styles.link}>
          Don&apos;t have an account? Sign up now
        </Link>
      </div>
    </Layout>
  );
}