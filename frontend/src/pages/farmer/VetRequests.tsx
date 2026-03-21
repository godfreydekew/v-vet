import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByFarmer, getAnimalById } from '@/data/mockData';
import { UrgencyBadge, CaseStatusBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

const statusFilters = ['All', 'Pending', 'Assigned', 'In Review', 'Completed'] as const;

export default function FarmerVetRequests() {
  const { user } = useAuth();
  const requests = getRequestsByFarmer(user?.id || '');
  const [filter, setFilter] = useState<string>('All');

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My Vet Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${filter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80'}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No requests found" description="Submit a vet request from an animal's profile to get started." />
      ) : (
        <div className="space-y-2">
          {filtered.map(req => {
            const animal = getAnimalById(req.animalId);
            return (
              <Link key={req.id} to={`/vet-requests/${req.id}`} className="block bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{animal?.name} ({animal?.tagNumber})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{animal?.species} · {req.dateSubmitted}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <UrgencyBadge urgency={req.urgency} />
                    <CaseStatusBadge status={req.status} />
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
