// MingCute icons, exported from the Figma file so code and design match.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 22 22",
    fill: "none",
    "aria-hidden": true,
    focusable: false,
    ...props,
  } as const;
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M14.556 14.556l3.888 3.888M16.5 9.625a6.875 6.875 0 1 1-13.75 0 6.875 6.875 0 0 1 13.75 0Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base(props)}>
      <path
        d="M11 5.23C7.616 1.611 2.646 4.791 2.752 9.506c.063 2.806 2.26 5.495 6.59 8.067.252.15.648.376.99.568.415.235.921.235 1.336 0 .342-.192.738-.418.99-.568 4.33-2.572 6.527-5.261 6.59-8.067C19.354 4.791 14.384 1.611 11 5.23Z"
        stroke="currentColor"
        fill={filled ? "currentColor" : "none"}
        strokeWidth="1.833"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M2.75 2.75h.127c.463 0 .91.176 1.249.492.34.316.546.749.579 1.211l.733 10.279a.917.917 0 0 0 .915.851h10.298a.917.917 0 0 0 .902-.752l1.5-8.25a.917.917 0 0 0-.902-1.081H5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.875" cy="18.792" r="1.1" fill="currentColor" />
      <circle cx="16.042" cy="18.792" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M3.667 5.5h14.666M3.667 11h14.666M3.667 16.5h14.666"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6.4 15.6 15.6 6.4M8.25 6.4h7.35v7.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronIcon({ direction = "right", ...props }: IconProps & { direction?: "left" | "right" | "down" }) {
  const d = {
    right: "M8.25 4.583 14.667 11l-6.417 6.417",
    left: "M13.75 4.583 7.333 11l6.417 6.417",
    down: "M4.583 8.25 11 14.667l6.417-6.417",
  }[direction];
  return (
    <svg {...base(props)}>
      <path d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base(props)} viewBox="0 0 18 18">
      <path
        d="M9 1.5A7.5 7.5 0 0 0 2.66 13.02l-.76 2.56 2.56-.76A7.5 7.5 0 1 0 9 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10.78 12.43c-.51-.02-1.96-.22-3.48-1.73C5.79 9.18 5.59 7.73 5.57 7.22c-.01-.73.47-1.53.83-1.81.42-.33.92-.05 1.23.29l.97 1.44c.13.24.08.53-.13.71l-.69.52c.22.42.69 1.14 1.56 1.79l.48-.73c.17-.24.5-.29.73-.12l1.15.83c.15.11.25.38.13.65-.33.76-.96 1.32-1.73 1.32Z"
        fill="currentColor"
      />
    </svg>
  );
}
