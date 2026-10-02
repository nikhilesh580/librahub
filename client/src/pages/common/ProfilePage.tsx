import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle, Save, Lock, Loader2 } from 'lucide-react';
import { formatDate } from '@/utils';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/auth/profile');
      setName(data.data.name);
      setPhone(data.data.phone || '');
      return data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/profile', data),
    onSuccess: (res) => { toast.success('Profile updated'); updateUser(res.data.data); setEditMode(false); queryClient.invalidateQueries({ queryKey: ['profile'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed'); setCurrentPassword(''); setNewPassword(''); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header"><h1 className="page-title">Profile</h1></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserCircle className="w-5 h-5" />Account Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">{user?.name?.charAt(0)}</div>
            <div>
              <p className="text-lg font-bold">{profile?.name || user?.name}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex gap-2 mt-1"><Badge variant="outline">{user?.role}</Badge><Badge variant="status" status={profile?.status || 'ACTIVE'}>{profile?.status || 'ACTIVE'}</Badge></div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} disabled={!editMode} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editMode} /></div>
            <div><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
            <div><Label>Member Since</Label><Input value={profile?.createdAt ? formatDate(profile.createdAt) : ''} disabled /></div>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button onClick={() => updateMutation.mutate({ name, phone })} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
              </>
            ) : <Button variant="outline" onClick={() => setEditMode(true)}>Edit Profile</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" />Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 chars, uppercase, number" /></div>
          <Button onClick={() => passwordMutation.mutate({ currentPassword, newPassword })} disabled={passwordMutation.isPending || !currentPassword || !newPassword}>
            {passwordMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Change Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
