// MingCute stage icons from the Figma "Stage stepper" component.
const p = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const stageIcons = [
  <path key="idea" {...p} d="M6.75 8.25v1.5m4.5-1.5v1.5M2.25 15h10.5a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3h-7.5a3 3 0 0 0-3 3v9Z" />,
  <g key="price">
    <path {...p} d="M2.804 9.167a1.5 1.5 0 0 1-.434-1.196l.354-3.89a1.5 1.5 0 0 1 1.358-1.357l3.889-.354a1.5 1.5 0 0 1 1.196.434l5.867 5.867a1.5 1.5 0 0 1 0 2.121l-4.243 4.243a1.5 1.5 0 0 1-2.12 0L2.803 9.167Z" />
    <circle cx="7.08" cy="7.08" r="1.5" stroke="currentColor" strokeWidth="2" />
  </g>,
  <path
    key="making"
    fill="currentColor"
    d="M12.738 1.712a1.5 1.5 0 0 1 .369 2.089L9.915 8.359l1.279 1.826a3 3 0 1 1-1.062 1.099L9 9.666l-1.133 1.618a3 3 0 1 1-1.061-1.1L8.084 8.358 4.893 3.8a1.5 1.5 0 0 1 .369-2.09L9 7.051l3.738-5.339ZM5.25 11.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm7.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
  />,
  <path key="ready" {...p} d="M3.75 7.5H12m-8.25 0v6a.75.75 0 0 0 .75.75H12M3.75 7.5 2.25 3.75h8.25L12 7.5m0 0v6.75m0-6.75h3M12 7.5l.75-3.75h3L15 7.5m-3 6.75h2.25a.75.75 0 0 0 .75-.75v-6M9 12h.75" />,
  <path key="delivered" {...p} d="M2.252 7.5 8.54 2.608a.75.75 0 0 1 .92 0L15.748 7.5H14.25v6.75a.75.75 0 0 1-.75.75h-9a.75.75 0 0 1-.75-.75V7.5H2.252Z" />,
];

export function StageIcon({ index, size = 18 }: { index: number; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      {stageIcons[index]}
    </svg>
  );
}
