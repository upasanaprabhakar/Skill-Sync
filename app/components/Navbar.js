// components/Navbar.js

import Link from 'next/link';
import styles from '../styles/Navbar.module.css';
import Logo from './logo.js';

export default function Navbar({ pageType }) {
  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Logo size={300} /> {/* <-- Increased logo size */}
        </Link>

        <div className={styles.navLinks}>
          <Link href="/#home">Home</Link>
          <Link href="/#about">About</Link>
          <Link href="/#contact">Contact</Link>

          {pageType === 'login' && (
            <Link href="/register" className={styles.ctaButton}>
              Sign Up
            </Link>
          )}
          {pageType === 'register' && (
            <Link href="/login" className={styles.ctaButton}>
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}