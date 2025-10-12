'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from '../styles/AuthForm.module.css';
import Link from 'next/link';
import Layout from '../components/layout';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!form.password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    const loginPromise = signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    }).then(async (result) => {
      if (result?.error) {
        throw new Error(result.error);
      }

      const userResponse = await fetch('/api/auth/session');
      const sessionData = await userResponse.json();
      
      if (sessionData?.user) {
        localStorage.setItem('userId', sessionData.user.id.toString());
        localStorage.setItem('userEmail', sessionData.user.email);

        if (sessionData.user.role === 'MENTOR') {
          router.push('/dashboard/mentor');
        } else if (sessionData.user.role === 'STUDENT') {
          router.push('/dashboard/student');
        } else {
          router.push('/dashboard');
        }
        
        return sessionData.user;
      }
    });

    toast.promise(
      loginPromise,
      {
        loading: 'Logging in...',
        success: 'Welcome back!',
        error: (err) => err.message || 'Invalid email or password',
      }
    ).catch(() => {
      setLoading(false);
    });
  }

  return (
    <Layout pageType="login">
      <div className={styles.formContainer}>
        <h1 className={styles.heading}>Welcome Back</h1>
        <p className={styles.subheading}>Sign in to continue your journey with SkillSync.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
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