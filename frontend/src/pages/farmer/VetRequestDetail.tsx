import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchVetRequestById, fetchVetResponse } from '@/lib/services/vetRequests.service';
import { fetchLivestockById } from '@/lib/services/livestock.service';
import { fetchFarmById } from '@/lib/services/farms.service';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_STEPS = ['assigned', 'in_review', 'completed'] as const;
const STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  in_review: 'In Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VetRequestDetail() {
  const { id } = useParams<{ id: string }>();

  const requestQuery = useQuery({
    queryKey: ['vet-request', id],
    queryFn: () => fetchVetRequestById(id!),
    enabled: !!id,
  });

  const req = requestQuery.data;

  const animalQuery = useQuery({
    queryKey: ['livestock', req?.livestock_id],
    queryFn: () => fetchLivestockById(req!.livestock_id),
    enabled: !!req?.livestock_id,
  });

  const farmQuery = useQuery({
    queryKey: ['farm', req?.farm_id],
    queryFn: () => fetchFarmById(req!.farm_id),
    enabled: !!req?.farm_id,
  });

  const responseQuery = useQuery({
    queryKey: ['vet-response', id],
    queryFn: () => fetchVetResponse(id!),
    enabled: req?.status === 'completed',
    retry: false,
  });

  if (requestQuery.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>;
  }

  if (!req) {
    return <div className="p-8 text-center text-muted-foreground">Request not found.</div>;
  }

  const animal = animalQuery.data;
  const farm = farmQuery.data;
  const vetResponse = responseQuery.data;
  const currentStepIdx = STATUS_STEPS.indexOf(req.status as typeof STATUS_STEPS[number]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link to="/vet-requests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Requests
      </Link>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {animal ? `${animal.name ?? 'Unnamed'}${animal.tag_number ? ` (${animal.tag_number})` : ''}` : '—'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {[animal?.species, animal?.breed, farm?.name].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${URGENCY_COLORS[req.urgency]}`}>
              {req.urgency}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-accent text-foreground">
              {STATUS_LABELS[req.status] ?? req.status}
            </span>
          </div>
        </div>

        {req.farmer_notes && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your Notes</p>
            <p className="text-sm text-foreground">{req.farmer_notes}</p>
          </div>
        )}

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Submitted: {fmt(req.submitted_at)}</span>
          {req.updated_at && <span>Updated: {fmt(req.updated_at)}</span>}
        </div>

        {/* Status timeline */}
        {req.status !== 'cancelled' && (
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {STATUS_STEPS.map((step, i) => {
              const isComplete = i <= currentStepIdx;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isComplete ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
                    {isComplete ? <CheckCircle size={13} /> : i + 1}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {STATUS_LABELS[step]}
                  </span>
                  {i < STATUS_STEPS.length - 1 && <div className={`w-8 h-0.5 ${isComplete ? 'bg-primary' : 'bg-border'}`} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vet response */}
      {req.status === 'completed' && (
        <div className="bg-card rounded-xl border border-green-500/30 p-6 space-y-3">
          {vetResponse ? (
            <>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold text-sm">
                <CheckCircle size={16} /> Vet Response
              </div>
              {vetResponse.diagnosis && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Diagnosis</p>
                  <p className="text-sm text-foreground mt-1">{vetResponse.diagnosis}</p>
                </div>
              )}
              {vetResponse.treatment_recommendation && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Treatment Recommendation</p>
                  <p className="text-sm text-foreground mt-1">{vetResponse.treatment_recommendation}</p>
                </div>
              )}
              {vetResponse.drug_name && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Drug / Dosage</p>
                  <p className="text-sm text-foreground mt-1">{[vetResponse.drug_name, vetResponse.dosage].filter(Boolean).join(' — ')}</p>
                </div>
              )}
              {vetResponse.follow_up_required && vetResponse.follow_up_date && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Follow-up due: {fmt(vetResponse.follow_up_date)}</p>
              )}
              {vetResponse.vet_notes && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Vet Notes</p>
                  <p className="text-sm text-foreground mt-1">{vetResponse.vet_notes}</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
