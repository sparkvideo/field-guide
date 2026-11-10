import { Suspense } from "react";
import { Reader } from "@/components/Reader";

export const metadata = { title: "Bible · Apologetics Field Guide" };

export default function ReadPage() {
  return (
    <Suspense fallback={null}>
      <Reader />
    </Suspense>
  );
}
