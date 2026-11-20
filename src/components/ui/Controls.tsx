"use client";

import styles from "./ui.module.css";

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );
}

interface SegmentedProps<T> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  testId?: string;
}

/** A row of mutually exclusive pills. Compares values with JSON so objects (clock presets) work. */
export function Segmented<T>({ options, value, onChange, disabled, testId }: SegmentedProps<T>) {
  const key = JSON.stringify(value);
  return (
    <div className={styles.segmented} data-testid={testId}>
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          disabled={disabled}
          className={JSON.stringify(o.value) === key ? styles.segActive : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
