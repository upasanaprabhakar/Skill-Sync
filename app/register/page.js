'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from '../styles/AuthForm.module.css';
import Link from 'next/link';
import Layout from '../components/layout';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!form.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);

    const registerPromise = fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      return data;
    });

    toast.promise(
      registerPromise,
      {
        loading: 'Creating your account...',
        success: 'Account created! Redirecting to login...',
        error: (err) => err.message || 'Registration failed',
      }
    ).then(() => {
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    }).catch(() => {
      setLoading(false);
    });
  }

  return (
    <Layout pageType="register">
      <div className={styles.formContainer}>
        <h1 className={styles.heading}>Create your account</h1>
        <p className={styles.subheading}>Join SkillSync to connect with mentors and peers.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Create a password (min 6 characters)"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            required
            minLength={6}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <Link href="/login" className={styles.link}>
          Already have an account? Log in
        </Link>
      </div>
    </Layout>
  );
}