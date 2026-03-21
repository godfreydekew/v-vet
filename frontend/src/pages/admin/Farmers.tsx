import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiError } from '@/lib/api';
import { fetchUsers, registerUser, type UserCreatePayload } from '@/lib/services/users.service';
import type { User } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EmptyState from '@/components/EmptyState';
import { Search, Plus, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INITIAL_FORM: UserCreatePayload = {
  full_name: '',
  email: '',
  password: '',
  phone_number: '',
  address: '',
  role: 'farmer',
};

export default function AdminFarmers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UserCreatePayload>(INITIAL_FORM);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', 'farmer'],
    queryFn: async () => {
      const res = await fetchUsers({ limit: 200 });
      return res.data.filter((u: User) => u.role === 'farmer');
    },
  });

  const register = useMutation({
    mutationFn: (payload: UserCreatePayload) => registerUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'farmer'] });
      toast({ title: 'Farmer registered successfully.' });
      setForm(INITIAL_FORM);
      setOpen(false);
    },
    onError: (err) => toast({ title: getApiError(err), variant: 'destructive' }),
  });

  const farmers = data ?? [];
  const filtered = farmers.filter(
    (f: User) =>
      (f.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      f.email.toLowerCase().includes(search.toLowerCase())
  );

  const field = (key: keyof typeof INITIAL_FORM) => ({
    value: (form[key] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Farmers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? 'Loading…' : `${farmers.length} registered farmer${farmers.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="sm" className="gap-1.5"><Plus size={16} /> Register Farmer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register Farmer</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); register.mutate(form); }}
              className="space-y-4"
            >
              <div className="space-y-2"><Label>Full Name</Label><Input required {...field('full_name')} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" required {...field('email')} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" required minLength={8} {...field('password')} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input {...field('phone_number')} /></div>
              <div className="space-y-2"><Label>Address</Label><Input {...field('address')} /></div>
              <Button type="submit" className="w-full" disabled={register.isPending}>
                {register.isPending && <Loader2 size={15} className="animate-spin mr-2" />}
                Register Farmer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search farmers…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      ) : isError ? (
        <p className="text-center text-sm text-destructive py-10">Unable to load farmers. Please refresh and try again.</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No farmers found" description="Register farmers to see them here." actionLabel="Register Farmer" onAction={() => setOpen(true)} />
      ) : (
        <div className="space-y-2">
          {filtered.map((f: User) => (
            <div key={f.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{f.full_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {f.email}{f.phone_number ? ` · ${f.phone_number}` : ''}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {f.address ?? ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
