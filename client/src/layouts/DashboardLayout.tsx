import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, BookOpen, Users, ArrowLeftRight, CalendarClock,
  DollarSign, BarChart3, Bell, Settings, LogOut, Menu, X,
  BookCopy, UserCog, ScrollText, Library, ChevronLeft, FileText,
  UserCircle, BookMarked, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Books', path: '/admin/books', icon: BookOpen },
  { label: 'Members', path: '/admin/users', icon: Users },
  { label: 'Authors', path: '/admin/authors', icon: UserCog },
  { label: 'Categories', path: '/admin/categories', icon: BookCopy },
  { label: 'Publishers', path: '/admin/publishers', icon: Library },
  { label: 'Transactions', path: '/admin/transactions', icon: ArrowLeftRight },
  { label: 'Reservations', path: '/admin/reservations', icon: CalendarClock },
  { label: 'Fines', path: '/admin/fines', icon: DollarSign },
  { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const librarianNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard },
  { label: 'Books', path: '/librarian/books', icon: BookOpen },
  { label: 'Members', path: '/librarian/members', icon: Users },
  { label: 'Issue Book', path: '/librarian/issue', icon: BookMarked },
  { label: 'Returns', path: '/librarian/returns', icon: ArrowLeftRight },
  { label: 'Reservations', path: '/librarian/reservations', icon: CalendarClock },
  { label: 'Reports', path: '/librarian/reports', icon: FileText },
];

const memberNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Browse Books', path: '/books', icon: BookOpen },
  { label: 'My Books', path: '/my-books', icon: BookMarked },
  { label: 'Reservations', path: '/reservations', icon: CalendarClock },
  { label: 'Fines', path: '/fines', icon: CreditCard },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Profile', path: '/profile', icon: UserCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user?.role === 'ADMIN'
    ? adminNavItems
    : user?.role === 'LIBRARIAN'
    ? librarianNavItems
    : memberNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-all duration-300 ease-in-out",
          collapsed ? "w-[70px]" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-16 px-4 border-b border-white/10", collapsed ? "justify-center" : "gap-3")}>
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold tracking-tight">LibraHub</h1>
              <p className="text-xs text-white/50">Library Management</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white/60 hover:text-white hover:bg-white/10 hidden lg:flex h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-white/60 hover:text-white hover:bg-white/10 lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 sidebar-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "sidebar-link",
                  isActive ? "sidebar-link-active" : "sidebar-link-inactive",
                  collapsed && "justify-center px-2"
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-[20px] flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info & Logout */}
        <div className={cn("p-3 border-t border-white/10", collapsed && "flex flex-col items-center")}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-white/50 truncate">{user?.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              "sidebar-link sidebar-link-inactive w-full text-red-300 hover:text-red-200 hover:bg-red-500/20",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn("flex-1 transition-all duration-300 flex flex-col min-h-screen", collapsed ? "lg:ml-[70px]" : "lg:ml-64")}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate(user?.role === 'MEMBER' ? '/notifications' : '#')}>
              <Bell className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-border/40 py-5 px-4 lg:px-8 bg-card/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground text-center sm:text-left">
            <div>
              <span className="font-semibold text-foreground">LibraHub</span>
              <span className="mx-1.5">—</span>
              <span>Library Management System</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span>
                Developed by <span className="font-medium text-foreground">Nikhilesh Tripathi</span>
              </span>
              <span>•</span>
              <a
                href="https://github.com/nikhilesh580/librahub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
