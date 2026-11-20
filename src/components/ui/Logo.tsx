/** The crossed king and queen mark. Inline so it inherits nothing and loads instantly. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Duo Chess">
      <rect width="64" height="64" rx="16" fill="#141518" />
      <g transform="translate(17.5 56) rotate(22) scale(0.93)" fill="#5E9C76" stroke="#141518" strokeWidth="2.5" paintOrder="stroke" strokeLinejoin="round">
        <path d="M-1.6 -44h3.2v4h3.6v3.2h-3.6v3.4h-3.2v-3.4h-3.6v-3.2h3.6z" />
        <path d="M-10 -15c-3-8 1-18 10-18s13 10 10 18z" />
        <path d="M-9.5 -15h19l-2.5 9h-14z" />
        <rect x="-12" y="-7" width="24" height="7" rx="2.5" />
      </g>
      <g transform="translate(46.5 56) rotate(-22) scale(0.93)" fill="#ECECEE" stroke="#141518" strokeWidth="2.5" paintOrder="stroke" strokeLinejoin="round">
        <circle cx="-10.5" cy="-33" r="2.6" />
        <circle cx="-4" cy="-37" r="2.6" />
        <circle cx="4" cy="-37" r="2.6" />
        <circle cx="10.5" cy="-33" r="2.6" />
        <path d="M-10.5 -32l2.5 15h16l2.5 -15l-6 9l-1.5 -12l-4 10l-4 -10l-1.5 12z" />
        <path d="M-9 -16h18l-2.5 10h-13z" />
        <rect x="-12" y="-7" width="24" height="7" rx="2.5" />
      </g>
    </svg>
  );
}
