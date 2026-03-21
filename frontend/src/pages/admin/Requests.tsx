import { useState } from 'react';
import { vetRequests, getAnimalById, getUserById, demoUsers } from '@/data/mockData';
import { UrgencyBadge, CaseStatusBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusFilters = ['All', 'Pending', 'Assigned', 'In Review', 'Completed'] as const;

export default function AdminRequests() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('All');
  const [assignOpen, setAssignOpen] = useState(false);
  const filtered = filter === 'All' ? vetRequests : vetRequests.filter(r => r.status === filter);
  const availableVets = demoUsers.filter(u => u.role === 'vet' && u.availability === 'Available');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Verification Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">{vetRequests.length} total request{vetRequests.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusFilters.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${filter === s ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80'}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No requests found" description="Adjust your filters or wait for new submissions." />
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const animal = getAnimalById(r.animalId);
            const farmer = getUserById(r.farmerId);
            const vet = r.vetId ? getUserById(r.vetId) : null;
            return (
              <div key={r.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow duration-150">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{animal?.name} ({animal?.tagNumber})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{animal?.species} · {farmer?.name} · {r.dateSubmitted}</p>
                    {vet && <p className="text-xs text-primary mt-0.5 font-medium">Assigned to: {vet.name}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <UrgencyBadge urgency={r.urgency} />
                    <CaseStatusBadge status={r.status} />
                    {r.status === 'Pending' && !r.vetId && (
                      <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>Assign</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Vet</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {availableVets.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">No vets currently available</p> : availableVets.map(v => (
              <button key={v.id} onClick={() => { toast({ title: `Assigned to ${v.name}` }); setAssignOpen(false); }} className="w-full bg-accent rounded-xl p-4 text-left hover:bg-primary/10 transition-colors duration-150">
                <p className="font-medium text-sm text-foreground">{v.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{v.specialisations?.join(', ')} · {v.yearsExperience} years</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
