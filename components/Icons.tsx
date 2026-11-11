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
// Three rings, each one linked to the other two: one God in three Persons.
export const TrinityIcon = () => (
  <Icon>
    <path d="M7.5 8.7a4.5 4.5 0 1 0 9.0 0a4.5 4.5 0 1 0 -9.0 0M3.8000000000000007 15a4.5 4.5 0 1 0 9.0 0a4.5 4.5 0 1 0 -9.0 0M11.2 15a4.5 4.5 0 1 0 9.0 0a4.5 4.5 0 1 0 -9.0 0" />
  </Icon>
);
// The earth with the sun rising over it: "In the beginning God created the heavens and the earth."
export const CreationIcon = () => (
  <Icon>
    <path d="M3.500 17.500a8.500 8.500 0 0 1 17 0zM2 17.500h20M12 3v2.500M5 6.500l1.700 1.700M19 6.500l-1.700 1.700" />
  </Icon>
);
// A child held within: "You wove me in my mother's womb."
export const LifeIcon = () => (
  <Icon>
    <path d="M12 3.500a8.500 8.500 0 1 0 0 17a8.500 8.500 0 0 0 0-17zM12 9.200a1.700 1.700 0 1 0 0 3.400a1.700 1.700 0 0 0 0-3.400zM9.400 16.500a2.700 2.700 0 0 1 5.200 0" />
  </Icon>
);
export const StormIcon = () => (
  <Icon>
    <path d="M7 15.500a4 4 0 0 1 .600-7.950a5.500 5.500 0 0 1 10.600 1.450a3.250 3.250 0 0 1-.700 6.500zM12.500 13l-2 3.500h3l-2 3.500" />
  </Icon>
);
export const ScalesIcon = () => (
  <Icon>
    <path d="M12 4v16M7.500 20h9M5 7.500h14M5 7.500l-2.500 6a2.700 2.700 0 0 0 5 0zM19 7.500l-2.500 6a2.700 2.700 0 0 0 5 0z" />
  </Icon>
);
export const GateIcon = () => (
  <Icon>
    <path d="M6 20.500V10a6 6 0 0 1 12 0v10.500M3.500 20.500h17M12 9.500v7M9.500 12h5" />
  </Icon>
);
export const TombIcon = () => (
  <Icon>
    <path d="M3 19.500h18M5.500 19.500v-5a6.500 6.500 0 0 1 13 0v5M14.500 19.500a4 4 0 1 1 6.500-4.500M9 19.500v-4a3 3 0 0 1 4-2.800" />
  </Icon>
);
export const FireIcon = () => (
  <Icon>
    <path d="M12 3.500c.500 3.500 4.500 5 4.500 9.500a4.500 4.500 0 0 1-9 0c0-1.800.800-2.800 1.800-3.800c.300 1.500 1 2.200 1.700 2.600c-.500-3 0-6 1-8.300zM4 20.500h16" />
  </Icon>
);
export const PrayIcon = () => (
  <Icon>
    <path d="M12 3.500c-1 2.500-3.500 5.500-3.500 9.500v3l-3 2.500v2h13v-2l-3-2.500v-3c0-4-2.500-7-3.500-9.500zM12 3.500v12" />
  </Icon>
);
export const HourglassIcon = () => (
  <Icon>
    <path d="M7 3.500h10M7 20.500h10M8 3.500c0 4 4 5.500 4 8.500s-4 4.500-4 8.500M16 3.500c0 4-4 5.500-4 8.500s4 4.500 4 8.500" />
  </Icon>
);
export const MindIcon = () => (
  <Icon>
    <path d="M9 18.500h6M10 21h4M8.500 15.500a6 6 0 1 1 7 0c-.600.500-1 1.200-1 2v1h-5v-1c0-.800-.400-1.500-1-2zM12 9v4M10 11h4" />
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
