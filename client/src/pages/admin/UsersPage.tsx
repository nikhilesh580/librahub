import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Search, Plus, Edit, UserCog, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [editUser, setEditUser] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'MEMBER', phone: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, statusFilter, page],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await api.get('/members', { params });
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/members/${id}`, data),
    onSuccess: () => { toast.success('User updated'); setEditUser(null); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/members', data),
    onSuccess: () => { toast.success('User created'); setCreateOpen(false); setNewUser({ name: '', email: '', password: '', role: 'MEMBER', phone: '' }); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const users = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="page-title">Users</h1><p className="page-description">{meta.total} users registered</p></div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Add User</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" /></div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="LIBRARIAN">Librarian</SelectItem><SelectItem value="MEMBER">Member</SelectItem></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="BLOCKED">Blocked</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50"><th className="text-left py-3 px-4 font-medium">User</th><th className="text-left py-3 px-4 font-medium">Role</th><th className="text-left py-3 px-4 font-medium">Status</th><th className="text-left py-3 px-4 font-medium">Books</th><th className="text-left py-3 px-4 font-medium">Joined</th><th className="text-right py-3 px-4 font-medium">Actions</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b"><td colSpan={6} className="py-3 px-4"><div className="skeleton h-4 w-full" /></td></tr>
              )) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No users found</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4"><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div></td>
                  <td className="py-3 px-4"><Badge variant="outline">{u.role}</Badge></td>
                  <td className="py-3 px-4"><Badge variant="status" status={u.status}>{u.status}</Badge></td>
                  <td className="py-3 px-4">{u._count?.transactions || 0}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4 text-right"><Button variant="ghost" size="sm" onClick={() => setEditUser(u)}><Edit className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Update user details and permissions</DialogDescription></DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} /></div>
              <div><Label>Role</Label>
                <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="MEMBER">Member</SelectItem><SelectItem value="LIBRARIAN">Librarian</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={editUser.status} onValueChange={(v) => setEditUser({ ...editUser, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="BLOCKED">Blocked</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Max Books</Label><Input type="number" value={editUser.maxBooks || 5} onChange={(e) => setEditUser({ ...editUser, maxBooks: parseInt(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(editUser)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create User</DialogTitle><DialogDescription>Add a new user to the system</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></div>
            <div><Label>Password</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></div>
            <div><Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="MEMBER">Member</SelectItem><SelectItem value="LIBRARIAN">Librarian</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(newUser)} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
