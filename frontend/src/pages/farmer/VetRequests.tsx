import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchVetRequests } from '@/lib/services/vetRequests.service';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { Stethoscope, Loader2 } from 'lucide-react';


const STATUS_FILTERS = ['All', 'assigned', 'in_review', 'completed', 'cancelled'] as const;

const STATUS_LABELS: Record<string, string> = {
  All: 'All',
  assigned: 'Assigned',
  in_review: 'In Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  pending: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}


export default function FarmerVetRequests() {
  const [filter, setFilter] = useState<string>('All');

  const { data, isLoading } = useQuery({
    queryKey: ['vet-requests'],
    queryFn: () => fetchVetRequests({ limit: 200 }),
  });

  const requests = data?.data ?? [];
  const filtered = filter === 'All' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My Vet Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
              filter === s
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={26} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No requests found"
          description="Submit a vet request from an animal's profile to get started."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <Link
              key={req.id}
              to={`/vet-requests/${req.id}`}
              className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {req.livestock_name ?? 'Unnamed'}
                    {req.livestock_tag && <span className="text-muted-foreground"> ({req.livestock_tag})</span>}
                    {req.livestock_species && <span className="text-muted-foreground capitalize"> · {req.livestock_species}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmt(req.submitted_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${URGENCY_COLORS[req.urgency]}`}>
                    {req.urgency}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
