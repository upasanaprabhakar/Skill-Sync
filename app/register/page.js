'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Your API returns user directly, not wrapped in {user: ...}
      // So data.id exists, not data.user.id
      if (data.id) {
        localStorage.setItem('userId', data.id.toString());
        localStorage.setItem('userEmail', data.email);
        
        router.push('/dashboard');
      } else {
        throw new Error('Registration succeeded but user ID missing');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout pageType="register">
      <div className={styles.formContainer}>
        <h1 className={styles.heading}>Create your account</h1>
        <p className={styles.subheading}>Join SkillSync to connect with mentors and peers.</p>
        <form onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <Link href="/login" className={styles.link}>
          Already have an account? Log in
        </Link>
      </div>
    </Layout>
  );
}