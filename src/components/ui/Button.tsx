import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import styles from "./ui.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  children?: ReactNode;
}

export function Button({ variant = "secondary", size = "md", icon, children, className, ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], !children && styles.iconOnly, className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...rest}>
      {icon && <Icon name={icon} size={size === "lg" ? 20 : size === "sm" ? 16 : 18} />}
      {children}
    </button>
  );
}
