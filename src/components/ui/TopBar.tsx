import Link from "next/link";
import type { ReactNode } from "react";
import { GitHubButton } from "./GitHubButton";
import { Logo } from "./Logo";
import styles from "./ui.module.css";

/** Slim header shared by every page. `children` go on the right, before the GitHub link. */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}>
        <Logo size={30} />
        <span>Duo Chess</span>
      </Link>
      <div className={styles.topActions}>
        {children}
        <GitHubButton compact />
      </div>
    </header>
  );
}
