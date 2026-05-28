import { ReactNode } from "react";
import DashboardShell from "../components/dashboard/DashboardShell";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
