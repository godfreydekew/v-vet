import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchVetRequests } from '@/lib/services/vetRequests.service';
import { fetchLivestockById } from '@/lib/services/livestock.service';
import EmptyState from '@/components/EmptyState';
import { ShieldCheck, Loader2 } from 'lucide-react';

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
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function AnimalCell({ livestockId }: { livestockId: string }) {
  const { data } = useQuery({
    queryKey: ['livestock', livestockId],
    queryFn: () => fetchLivestockById(livestockId),
  });
  if (!data) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <div>
      <p className="font-medium text-sm text-foreground">
        {data.name ?? 'Unnamed'}{data.tag_number ? ` (${data.tag_number})` : ''}
      </p>
      <p className="text-xs text-muted-foreground capitalize">{data.species}</p>
    </div>
  );
}

export default function AdminRequests() {
  const [filter, setFilter] = useState<string>('All');

  const { data, isLoading } = useQuery({
    queryKey: ['vet-requests'],
    queryFn: () => fetchVetRequests({ limit: 500 }),
  });

  const requests = data?.data ?? [];
  const filtered = filter === 'All' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Verification Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {requests.length} total request{requests.length !== 1 ? 's' : ''}
        </p>
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
          icon={ShieldCheck}
          title="No requests found"
          description="Adjust your filters or wait for new submissions."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow duration-150"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <AnimalCell livestockId={r.livestock_id} />
                  <p className="text-xs text-muted-foreground mt-1">{fmt(r.submitted_at)}</p>
                  {r.farmer_notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">{r.farmer_notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${URGENCY_COLORS[r.urgency]}`}>
                    {r.urgency}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-accent text-foreground'}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
