import { Welcome } from "@/components/Welcome";

export const metadata = { title: "Welcome · Apologetics Field Guide" };

// The same welcome screen, available any time at /welcome.
export default function WelcomePage() {
  return <Welcome always />;
}
