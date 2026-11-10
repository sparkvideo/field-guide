// Small line icons, drawn here so the app needs no icon library and no emoji.
import type { ReactNode } from "react";

function Icon({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="icon">
      {children}
    </svg>
  );
}

export const FlameIcon = () => (
  <Icon>
    <path d="M12 3c.5 3.2 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-1.6.7-2.8 1.6-3.7.3 1.3 1 2 1.9 2.2C10.400 8.500 10.800 5.500 12 3z" />
  </Icon>
);
export const TargetIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" />
  </Icon>
);
export const DrillIcon = () => (
  <Icon>
    <rect x="3.500" y="6.500" width="13" height="10" rx="2" />
    <path d="M7.500 4h11a2 2 0 0 1 2 2v8" />
    <path d="M7 11.500h6" />
  </Icon>
);
export const CardIcon = ({ size = 18 }: { size?: number }) => (
  <Icon size={size}>
    <rect x="3" y="5" width="18" height="14" rx="2.500" />
    <path d="M7 10h10M7 14h6" />
  </Icon>
);
export const BellIcon = () => (
  <Icon>
    <path d="M6 16.500V11a6 6 0 1 1 12 0v5.500l1.500 1.500h-15z" />
    <path d="M10 20.500a2 2 0 0 0 4 0" />
  </Icon>
);

/** The app's emblem (same drawing as the home-screen icon). */
export function Mark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true" style={{ borderRadius: size * 0.24, flex: "none" }}>
      <rect width="512" height="512" fill="#1a211c" />
      <path d="M256 92l15 45 45 15-45 15-15 45-15-45-45-15 45-15z" fill="#e6c877" />
      <path d="M256 254c-36-24-86-30-138-22v172c52-8 102-2 138 22z" fill="#d4b062" />
      <path d="M256 254c36-24 86-30 138-22v172c-52-8-102-2-138 22z" fill="#efe3bd" />
      <path d="M256 254v172" stroke="#0c0f0d" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}
