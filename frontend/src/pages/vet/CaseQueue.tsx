import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchVetRequests } from '@/lib/services/vetRequests.service';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { ClipboardList, Loader2 } from 'lucide-react';

const STATUS_FILTERS = ['All', 'assigned', 'in_review', 'completed'] as const;

const STATUS_LABELS: Record<string, string> = {
  All: 'All',
  assigned: 'Assigned',
  in_review: 'In Review',
  completed: 'Completed',
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
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CaseQueue() {
  const [filter, setFilter] = useState<string>('All');

  const { data, isLoading } = useQuery({
    queryKey: ['vet-requests'],
    queryFn: () => fetchVetRequests({ limit: 200 }),
  });

  const cases = data?.data ?? [];
  const filtered = filter === 'All' ? cases : cases.filter((c) => c.status === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Case Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">{cases.length} total case{cases.length !== 1 ? 's' : ''}</p>
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
        <EmptyState icon={ClipboardList} title="No cases found" description="Cases assigned to you will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/vet/cases/${c.id}`}
              className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {c.livestock_name ?? 'Unnamed'}
                    {c.livestock_tag && <span className="text-muted-foreground"> ({c.livestock_tag})</span>}
                    {c.livestock_species && <span className="text-muted-foreground capitalize"> · {c.livestock_species}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{fmt(c.submitted_at)}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${URGENCY_COLORS[c.urgency]}`}>
                    {c.urgency}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
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
