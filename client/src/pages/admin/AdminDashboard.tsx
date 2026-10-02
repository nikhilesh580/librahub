import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { AdminDashboard as AdminDashboardType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Users, BookCopy, ArrowLeftRight, Clock,
  DollarSign, CalendarClock, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { formatDate } from '@/utils';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', '#818cf8', '#a78bfa', '#c4b5fd'];

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/admin');
      return data.data as AdminDashboardType;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="page-title">Dashboard</h1><p className="page-description">Welcome back, Administrator</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="stat-card"><div className="skeleton h-4 w-24 mb-2" /><div className="skeleton h-8 w-16" /></div>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const charts = data?.charts;

  const statCards = [
    { label: 'Total Books', value: stats?.totalBooks || 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Copies', value: stats?.totalCopies || 0, icon: BookCopy, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Available', value: stats?.availableCopies || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Issued', value: stats?.issuedCopies || 0, icon: ArrowLeftRight, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Overdue', value: stats?.overdueBooks || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Members', value: stats?.totalMembers || 0, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Reservations', value: stats?.pendingReservations || 0, icon: CalendarClock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Fines Collected', value: `$${(stats?.collectedFines || 0).toFixed(0)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Overview of your library operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card group animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Borrowing Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Monthly Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: '0.5rem', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="issues" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Issues" />
                <Line type="monotone" dataKey="returns" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Returns" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Books by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts?.categoryDistribution?.filter(c => c.value > 0) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(charts?.categoryDistribution || []).map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Most Borrowed & Active Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most Borrowed Books</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(charts?.mostBorrowedBooks || []).slice(0, 8)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="borrowCount" fill="#6366f1" radius={[0, 4, 4, 0]} name="Times Borrowed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto scrollbar-thin">
              {(data?.recentTransactions || []).map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tx.status === 'ISSUED' ? 'bg-blue-500' : tx.status === 'RETURNED' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.bookCopy?.book?.title}</p>
                    <p className="text-xs text-muted-foreground">{tx.user?.name} • {formatDate(tx.createdAt)}</p>
                  </div>
                  <Badge variant="status" status={tx.status}>{tx.status}</Badge>
                </div>
              ))}
              {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
