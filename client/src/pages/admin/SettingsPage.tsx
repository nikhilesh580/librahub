import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getErrorMessage } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      setFormData(data.data);
      return data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.put('/settings', data),
    onSuccess: () => { toast.success('Settings updated'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading || !formData) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const fields = [
    { key: 'libraryName', label: 'Library Name', type: 'text' },
    { key: 'maxBooksPerMember', label: 'Max Books Per Member', type: 'number' },
    { key: 'maxBorrowDays', label: 'Max Borrow Days', type: 'number' },
    { key: 'maxRenewals', label: 'Max Renewals', type: 'number' },
    { key: 'renewalDays', label: 'Renewal Duration (Days)', type: 'number' },
    { key: 'finePerDay', label: 'Fine Per Day ($)', type: 'number', step: '0.01' },
    { key: 'lostBookFine', label: 'Lost Book Fine ($)', type: 'number', step: '0.01' },
    { key: 'damagedBookFine', label: 'Damaged Book Fine ($)', type: 'number', step: '0.01' },
    { key: 'reservationExpiryDays', label: 'Reservation Expiry (Days)', type: 'number' },
    { key: 'maxReservationsPerUser', label: 'Max Reservations Per User', type: 'number' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="page-header"><h1 className="page-title">Library Settings</h1><p className="page-description">Configure library policies and limits</p></div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              <Label>{field.label}</Label>
              <Input
                type={field.type}
                step={field.step}
                value={formData[field.key] ?? ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
              />
            </div>
          ))}
          <Button className="w-full" onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
