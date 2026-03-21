import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByVet, getAnimalById, getUserById } from '@/data/mockData';
import { UrgencyBadge, CaseStatusBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

const statusFilters = ['All', 'Assigned', 'In Review', 'Completed'] as const;

export default function CaseQueue() {
  const { user } = useAuth();
  const cases = getRequestsByVet(user?.id || '');
  const [filter, setFilter] = useState<string>('All');
  const filtered = filter === 'All' ? cases : cases.filter(c => c.status === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Case Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">{cases.length} total case{cases.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${filter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80'}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No cases found" description="Cases assigned to you will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const animal = getAnimalById(c.animalId);
            const farmer = getUserById(c.farmerId);
            return (
              <Link key={c.id} to={`/vet/cases/${c.id}`} className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{animal?.name} ({animal?.tagNumber})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{animal?.species} · {farmer?.name} · {c.dateSubmitted}</p>
                  </div>
                  <div className="flex gap-2">
                    <UrgencyBadge urgency={c.urgency} />
                    <CaseStatusBadge status={c.status} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
