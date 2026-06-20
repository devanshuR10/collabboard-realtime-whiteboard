import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      {/* Left spacer */}
      <div className={styles.left} />

      {/* Centre: "Built for Digital Heroes" */}
      <div className={styles.centre}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className={styles.shieldIcon}
        >
          <path
            d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.builtText}>Built for&nbsp;</span>
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.heroLink}
          id="digital-heroes-link"
        >
          Digital Heroes
        </a>
      </div>

      {/* Right: credits */}
      <div className={styles.right}>
        <span className={styles.credit}>Devanshu Barsod</span>
        <span className={styles.separator}>·</span>
        <a
          href="mailto:devanshur583@gmail.com"
          className={styles.creditEmail}
        >
          devanshur583@gmail.com
        </a>
      </div>
    </footer>
  );
}
