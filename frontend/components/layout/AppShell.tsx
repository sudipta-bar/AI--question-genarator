import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';

export function AppShell({ breadcrumb, children }: { breadcrumb: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <TopBar breadcrumb={breadcrumb} />
      <main className="mobile-content md:ml-[200px]">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
