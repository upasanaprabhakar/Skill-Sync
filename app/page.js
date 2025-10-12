'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
  Logo, UsersIcon, SearchIcon, ChartIcon, BookIcon, TargetIcon,
  ArrowRightIcon, HeartIcon
} from './components/icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={styles.landingPage}>
      <nav className={styles.navbar}>
        <div className={`container ${styles.navContainer}`}>
          <Link href="/" className={styles.logo}>
            <Logo width={180} height={50} />
          </Link>
          
          <ul className={styles.navLinks}>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          
          <div className={styles.navButtons}>
            <button 
              className="btn btn-text"
              onClick={() => router.push('/login')}
            >
              Login
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => router.push('/register')}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <section id="home" className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <h1>Connect, Learn, and Grow with <span className={styles.highlight}>SkillSync</span></h1>
            <p>
              SkillSync connects students with experienced mentors to help them achieve 
              their goals. Whether you're looking to learn a new skill or share your 
              expertise, SkillSync has you covered.
            </p>
            <div className={styles.heroButtons}>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/register')}
              >
                Find a Mentor
                <ArrowRightIcon size={20} />
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/register')}
              >
                Join as Mentor
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className={styles.howItWorks}>
        <div className="container">
          <h2 className={styles.sectionTitle}>How SkillSync Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepIcon}>
                <UsersIcon size={40} />
              </div>
              <div className={styles.stepNumber}>01</div>
              <h3>Create Your Profile</h3>
              <p>
                Sign up as a student or mentor and create a profile that highlights 
                your skills and interests.
              </p>
            </div>
            
            <div className={styles.stepCard}>
              <div className={styles.stepIcon}>
                <SearchIcon size={40} />
              </div>
              <div className={styles.stepNumber}>02</div>
              <h3>Find Your Match</h3>
              <p>
                Get matched with a mentor or student who aligns with your learning 
                goals and expertise.
              </p>
            </div>
            
            <div className={styles.stepCard}>
              <div className={styles.stepIcon}>
                <ChartIcon size={40} />
              </div>
              <div className={styles.stepNumber}>03</div>
              <h3>Track Your Progress</h3>
              <p>
                Set goals, track your achievements, and celebrate milestones along 
                your learning journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="skills" className={styles.exploreSkills}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Explore Popular Skills</h2>
          <p className={styles.sectionSubtitle}>
            Discover the skills you can learn or teach on SkillSync
          </p>
          
          <div className={styles.skillsGrid}>
            <div className={styles.skillCard}>
              <div className={styles.skillIcon}>
                <BookIcon size={36} />
              </div>
              <h3>Web Development</h3>
              <p>Master HTML, CSS, JavaScript, and modern frameworks to build stunning websites and applications.</p>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/register')}
              >
                Learn More
              </button>
            </div>
            
            <div className={styles.skillCard}>
              <div className={styles.skillIcon}>
                <TargetIcon size={36} />
              </div>
              <h3>Data Structures & Algorithms</h3>
              <p>Build strong problem-solving skills and ace technical interviews with expert guidance.</p>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/register')}
              >
                Learn More
              </button>
            </div>
            
            <div className={styles.skillCard}>
              <div className={styles.skillIcon}>
                <HeartIcon size={36} />
              </div>
              <h3>Communication & Soft Skills</h3>
              <p>Develop leadership, presentation, and interpersonal skills for professional success.</p>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/register')}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBanner}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Ready to Start Your Journey?</h2>
            <p>
              Join SkillSync today and connect with mentors or students who share 
              your passion for learning and growth.
            </p>
            <div className={styles.ctaButtons}>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/register')}
              >
                Join as Mentor
                <ArrowRightIcon size={20} />
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/register')}
              >
                Join as Student
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <Logo width={140} height={49} />
              <p className={styles.copyright}>© 2025 SkillSync. All rights reserved.</p>
            </div>
            
            <div className={styles.footerLinks}>
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
              </ul>
            </div>
            
            <div className={styles.footerLinks}>
              <h4>Resources</h4>
              <ul>
                <li><a href="#mentors">Find Mentors</a></li>
                <li><a href="#students">Find Students</a></li>
                <li><a href="#help">Help Center</a></li>
              </ul>
            </div>
            
            <div className={styles.footerLinks}>
              <h4>Legal</h4>
              <ul>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#contact">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}