import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Layouts
import DashboardLayout from '@/layouts/DashboardLayout';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UsersPage from '@/pages/admin/UsersPage';
import SettingsPage from '@/pages/admin/SettingsPage';
import AuditLogsPage from '@/pages/admin/AuditLogsPage';
import { AuthorsPage, CategoriesPage, PublishersPage } from '@/pages/admin/CrudPages';

// Librarian Pages
import LibrarianDashboard from '@/pages/librarian/LibrarianDashboard';
import IssueBookPage from '@/pages/librarian/IssueBookPage';
import ReturnBookPage from '@/pages/librarian/ReturnBookPage';

// Member Pages
import MemberDashboard from '@/pages/member/MemberDashboard';

// Common Pages
import BooksPage from '@/pages/common/BooksPage';
import BookDetailPage from '@/pages/common/BookDetailPage';
import TransactionsPage from '@/pages/common/TransactionsPage';
import ReservationsPage from '@/pages/common/ReservationsPage';
import FinesPage from '@/pages/common/FinesPage';
import NotificationsPage from '@/pages/common/NotificationsPage';
import ReportsPage from '@/pages/common/ReportsPage';
import ProfilePage from '@/pages/common/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'LIBRARIAN') return <Navigate to="/librarian/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'LIBRARIAN') return <Navigate to="/librarian/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Page not found</p>
        <a href="/" className="text-primary hover:underline">Go home</a>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* Member Routes */}
      <Route path="/dashboard" element={<ProtectedRoute roles={['MEMBER']}><MemberDashboard /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
      <Route path="/books/:id" element={<ProtectedRoute><BookDetailPage /></ProtectedRoute>} />
      <Route path="/my-books" element={<ProtectedRoute roles={['MEMBER']}><TransactionsPage /></ProtectedRoute>} />
      <Route path="/reservations" element={<ProtectedRoute roles={['MEMBER']}><ReservationsPage userView /></ProtectedRoute>} />
      <Route path="/fines" element={<ProtectedRoute roles={['MEMBER']}><FinesPage userView /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Librarian Routes */}
      <Route path="/librarian/dashboard" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><LibrarianDashboard /></ProtectedRoute>} />
      <Route path="/librarian/books" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><BooksPage /></ProtectedRoute>} />
      <Route path="/librarian/books/new" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><div className="text-center py-16"><h2 className="text-xl font-bold">Add Book</h2><p className="text-muted-foreground">Use the Books page to manage books</p></div></ProtectedRoute>} />
      <Route path="/librarian/books/:id" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><BookDetailPage /></ProtectedRoute>} />
      <Route path="/librarian/members" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><UsersPage /></ProtectedRoute>} />
      <Route path="/librarian/issue" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><IssueBookPage /></ProtectedRoute>} />
      <Route path="/librarian/returns" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><ReturnBookPage /></ProtectedRoute>} />
      <Route path="/librarian/reservations" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><ReservationsPage /></ProtectedRoute>} />
      <Route path="/librarian/reports" element={<ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}><ReportsPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/books" element={<ProtectedRoute roles={['ADMIN']}><BooksPage /></ProtectedRoute>} />
      <Route path="/admin/books/new" element={<ProtectedRoute roles={['ADMIN']}><div className="text-center py-16"><h2 className="text-xl font-bold">Add Book</h2><p className="text-muted-foreground">Use the Books page to manage books</p></div></ProtectedRoute>} />
      <Route path="/admin/books/:id" element={<ProtectedRoute roles={['ADMIN']}><BookDetailPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/authors" element={<ProtectedRoute roles={['ADMIN']}><AuthorsPage /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute roles={['ADMIN']}><CategoriesPage /></ProtectedRoute>} />
      <Route path="/admin/publishers" element={<ProtectedRoute roles={['ADMIN']}><PublishersPage /></ProtectedRoute>} />
      <Route path="/admin/transactions" element={<ProtectedRoute roles={['ADMIN']}><TransactionsPage /></ProtectedRoute>} />
      <Route path="/admin/reservations" element={<ProtectedRoute roles={['ADMIN']}><ReservationsPage /></ProtectedRoute>} />
      <Route path="/admin/fines" element={<ProtectedRoute roles={['ADMIN']}><FinesPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['ADMIN']}><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute roles={['ADMIN']}><SettingsPage /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '0.75rem', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', border: '1px solid hsl(var(--border))' },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
