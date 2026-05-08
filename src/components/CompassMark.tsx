type Props = {
  className?: string;
  title?: string;
};

/**
 * Compass-rose brand mark.
 * Minimal, geometric — reads at favicon scale and at hero scale.
 * Stroke uses currentColor so it can be tinted ink, accent, or surface.
 */
export function CompassMark({ className, title = "Startup Compass" }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      {/* Cardinal points */}
      <path
        d="M16 4 L18 14 L16 16 L14 14 Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M16 28 L14 18 L16 16 L18 18 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M28 16 L18 14 L16 16 L18 18 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M4 16 L14 18 L16 16 L14 14 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}
