import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowLeftRight, Clock, AlertTriangle, Users, CalendarClock, BookMarked, Search, Plus, RotateCcw } from 'lucide-react';
import { formatDate } from '@/utils';

export default function LibrarianDashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['librarian-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/librarian');
      return data.data;
    },
    refetchInterval: 30000,
  });

  const stats = data?.stats;

  const statCards = [
    { label: "Today's Issues", value: stats?.todayIssues || 0, icon: BookMarked, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: "Today's Returns", value: stats?.todayReturns || 0, icon: RotateCcw, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Overdue Books', value: stats?.overdueBooks || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Reservations', value: stats?.pendingReservations || 0, icon: CalendarClock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Available Books', value: stats?.availableBooks || 0, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Members', value: stats?.activeMembers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const quickActions = [
    { label: 'Issue Book', icon: BookMarked, path: '/librarian/issue', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Return Book', icon: RotateCcw, path: '/librarian/returns', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Add Book', icon: Plus, path: '/librarian/books/new', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Search Member', icon: Search, path: '/librarian/members', color: 'bg-amber-600 hover:bg-amber-700' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="page-title">Librarian Dashboard</h1></div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="stat-card"><div className="skeleton h-4 w-24 mb-2" /><div className="skeleton h-8 w-16" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Librarian Dashboard</h1>
        <p className="page-description">Manage daily library operations</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            className={`h-auto py-4 flex flex-col items-center gap-2 text-white ${action.color}`}
            onClick={() => navigate(action.path)}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.recentTransactions || []).map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${tx.status === 'ISSUED' ? 'bg-blue-500' : 'bg-green-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.bookCopy?.book?.title}</p>
                  <p className="text-xs text-muted-foreground">{tx.user?.name} • {formatDate(tx.createdAt)}</p>
                </div>
                <Badge variant="status" status={tx.status}>{tx.status}</Badge>
              </div>
            ))}
            {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-6">No recent transactions</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
