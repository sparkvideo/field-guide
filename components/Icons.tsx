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
export const CrossIcon = () => (
  <Icon>
    <path d="M12 3.500v17M7 8.500h10" />
  </Icon>
);
export const TabletsIcon = () => (
  <Icon>
    <path d="M4.500 19.500V9a3.500 3.500 0 0 1 7 0v10.500zM12.500 19.500V9a3.500 3.500 0 0 1 7 0v10.500zM7 12h2M7 15h2M15 12h2M15 15h2" />
  </Icon>
);
export const TriangleIcon = () => (
  <Icon>
    <path d="M12 4.500l8.500 14.500h-17z" />
  </Icon>
);
export const BookIcon = () => (
  <Icon>
    <path d="M12 6.500c-2-1.300-4.800-1.700-8-1.300v12.300c3.200-.4 6 0 8 1.300 2-1.300 4.800-1.700 8-1.300V5.200c-3.200-.4-6 0-8 1.300zM12 6.500v12.300" />
  </Icon>
);
export const WordsIcon = () => (
  <Icon>
    <path d="M4 6.500h16M4 12h16M4 17.500h9" />
  </Icon>
);
export const DoorIcon = () => (
  <Icon>
    <path d="M13.500 4.500h5v15h-5M10 8.500l-3.500 3.500 3.500 3.500M6.500 12h8" />
  </Icon>
);
export const PenIcon = () => (
  <Icon>
    <path d="M4.500 19.500l1-4.500L16 4.500l3.500 3.500L9 18.500z" />
  </Icon>
);
export const NoteIcon = () => (
  <Icon>
    <path d="M6 3.500h9l4 4v13H6zM9.500 12h6M9.500 16h4" />
  </Icon>
);

export const GameIcon = () => (
  <Icon>
    <rect x="3" y="7.500" width="18" height="10" rx="3.500" />
    <path d="M7.500 10.500v4M5.500 12.500h4" />
    <circle cx="15" cy="13.500" r="0.800" fill="currentColor" />
    <circle cx="17.500" cy="11.500" r="0.800" fill="currentColor" />
  </Icon>
);

/** The app's emblem (the same picture as the home-screen icon). */
export function Mark({ size = 48 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/icons/mark.png" width={size} height={size} alt="" style={{ borderRadius: size * 0.24, flex: "none" }} />;
}
