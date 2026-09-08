import type { Metadata } from "next";
import DemoWorkspace from "@/components/DemoWorkspace";

export const metadata: Metadata = {
  title: "Live demo · Dylug",
  description: "Explore the Dylug community chat experience.",
};

export default function DemoPage() {
  return <DemoWorkspace />;
}
