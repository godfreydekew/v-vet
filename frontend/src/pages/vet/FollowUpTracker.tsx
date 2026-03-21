import { useAuth } from '@/contexts/AuthContext';
import { getRequestsByVet, getAnimalById, getFarmById, getUserById, isOverdue } from '@/data/mockData';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function FollowUpTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const cases = getRequestsByVet(user?.id || '');
  const followUps = cases.filter(c => c.vetResponse?.followUpRequired && c.vetResponse?.followUpDate).map(c => ({
    ...c,
    followUpDate: c.vetResponse!.followUpDate!,
    overdue: isOverdue(c.vetResponse!.followUpDate!),
  })).sort((a, b) => {
    if (a.overdue && !b.overdue) return -1;
    if (!a.overdue && b.overdue) return 1;
    return 0;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Follow-up Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">{followUps.length} follow-up{followUps.length !== 1 ? 's' : ''} scheduled</p>
      </div>

      {followUps.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No follow-ups due" description="Animals flagged for follow-up will appear here." />
      ) : (
        <div className="space-y-2">
          {followUps.map(fu => {
            const animal = getAnimalById(fu.animalId);
            const farmer = getUserById(fu.farmerId);
            return (
              <div key={fu.id} className={`bg-card rounded-xl border p-4 transition-all duration-150 hover:shadow-sm ${fu.overdue ? 'border-danger/50' : 'border-border'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{animal?.name} ({animal?.tagNumber})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{farmer?.name} · Follow-up: {fu.followUpDate}</p>
                    {fu.vetResponse?.diagnosis && <p className="text-xs text-muted-foreground mt-1 truncate">{fu.vetResponse.diagnosis}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {fu.overdue && <AlertCircle size={16} className="text-danger" />}
                    <Button size="sm" variant="outline" onClick={() => toast({ title: 'Marked complete!' })} className="gap-1.5">
                      <CheckCircle size={14} /> Complete
                    </Button>
                    <Link to={`/vet/cases/${fu.id}`} className="text-sm text-primary hover:underline font-medium">View</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
