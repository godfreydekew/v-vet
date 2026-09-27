import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { fetchAdminFarmers, type AdminFarmer } from '@/lib/services/admin.service';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import EmptyState from '@/components/EmptyState';
import { Search, Users, Loader2 } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'onboarding';
type SortOption = 'newest' | 'recently_active' | 'most_messages' | 'most_animals';

function sortFarmers(farmers: AdminFarmer[], sortBy: SortOption): AdminFarmer[] {
  const sorted = [...farmers];
  if (sortBy === 'newest') {
    sorted.sort((a, b) => (b.registered_at ?? '').localeCompare(a.registered_at ?? ''));
  } else if (sortBy === 'recently_active') {
    sorted.sort((a, b) => (b.last_message_at ?? '').localeCompare(a.last_message_at ?? ''));
  } else if (sortBy === 'most_messages') {
    sorted.sort((a, b) => b.message_count - a.message_count);
  } else if (sortBy === 'most_animals') {
    sorted.sort((a, b) => b.animal_count - a.animal_count);
  }
  return sorted;
}

function matchesSearch(farmer: AdminFarmer, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const searchableFields = [farmer.full_name, farmer.phone_number, farmer.email, farmer.district];
  return searchableFields.some((value) => (value ?? '').toLowerCase().includes(query));
}

function StatusBadge({ farmer }: { farmer: AdminFarmer }) {
  if (farmer.status === 'onboarding') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        Onboarding
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Active
    </span>
  );
}

export default function AdminFarmers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-farmers'],
    queryFn: fetchAdminFarmers,
  });

  const farmers = data?.data ?? [];
  const onboardingCount = farmers.filter((f) => f.status === 'onboarding').length;

  const visibleFarmers = sortFarmers(
    farmers.filter(
      (f) => (statusFilter === 'all' || f.status === statusFilter) && matchesSearch(f, search)
    ),
    sortBy
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Farmers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading
            ? 'Loading…'
            : `${farmers.length} registered farmer${farmers.length !== 1 ? 's' : ''}` +
              (onboardingCount > 0 ? ` · ${onboardingCount} still onboarding` : '')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email or district…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="md:w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All farmers</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="md:w-48" aria-label="Sort farmers">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="recently_active">Recently active</SelectItem>
            <SelectItem value="most_messages">Most messages</SelectItem>
            <SelectItem value="most_animals">Most animals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      ) : isError ? (
        <p className="text-center text-sm text-destructive py-10">Unable to load farmers. Please refresh and try again.</p>
      ) : visibleFarmers.length === 0 ? (
        <EmptyState icon={Users} title="No farmers found" description="Farmers appear here once they message V-Vet on WhatsApp." />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Messages</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead className="text-right">Farms</TableHead>
                <TableHead className="text-right">Animals</TableHead>
                <TableHead className="text-right">Sick</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleFarmers.map((f) => (
                <TableRow key={f.user_id ?? f.whatsapp_user_id}>
                  <TableCell className="min-w-48">
                    <p className="font-medium text-sm text-foreground">{f.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {f.phone_number ? `+${f.phone_number}` : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {f.has_web_account ? f.email : 'No web login yet'}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{f.district ?? '—'}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {f.registered_at ? (
                      <>
                        <p>{format(new Date(f.registered_at), 'd MMM yyyy')}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(f.registered_at), { addSuffix: true })}
                        </p>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <p>{f.message_count}</p>
                    {f.messages_last_7_days > 0 && (
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {f.messages_last_7_days} this week
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {f.last_message_at
                      ? formatDistanceToNow(new Date(f.last_message_at), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell className="text-right text-sm">{f.farm_count}</TableCell>
                  <TableCell className="text-right text-sm">{f.animal_count}</TableCell>
                  <TableCell className="text-right text-sm">
                    {f.sick_count > 0 ? (
                      <span className="font-medium text-red-600 dark:text-red-400">{f.sick_count}</span>
                    ) : (
                      0
                    )}
                  </TableCell>
                  <TableCell><StatusBadge farmer={f} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
