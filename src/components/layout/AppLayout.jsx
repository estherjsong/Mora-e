import { Outlet, Link, useLocation } from 'react-router-dom';
import { CalendarDays, RotateCw, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: CalendarDays, label: '홈' },
  { path: '/routines', icon: RotateCw, label: '루틴 관리' },
  { path: '/statistics', icon: BarChart3, label: '통계' },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 hover:w-48 transition-all duration-300 group bg-card border-r border-border flex flex-col items-center py-6 shrink-0 overflow-hidden">
        <div className="mb-10 px-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 w-full px-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2 w-full pt-2">
          <p className="text-[10px] text-muted-foreground leading-tight opacity-0 group-hover:opacity-100 transition-opacity px-2">
            일정·루틴은 이 브라우저 저장소에만 저장됩니다.
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}