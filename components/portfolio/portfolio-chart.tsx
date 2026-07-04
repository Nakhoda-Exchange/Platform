// ponytail: static placeholder trend chart. A real time-series chart (with
// range tabs + data) is separate work.
export function PortfolioChart() {
  return (
    <svg
      viewBox="0 0 358 120"
      className="h-[120px] w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,92 C45,84 75,98 115,74 C155,52 195,64 235,42 C275,26 315,36 358,16 L358,120 L0,120 Z"
        fill="var(--color-brand)"
        fillOpacity="0.1"
      />
      <path
        d="M0,92 C45,84 75,98 115,74 C155,52 195,64 235,42 C275,26 315,36 358,16"
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
