import { useParams, Link } from 'react-router-dom';
import { vetRequests, getAnimalById, getFarmById } from '@/data/mockData';
import { StatusBadge, UrgencyBadge, CaseStatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function VetRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const request = vetRequests.find(r => r.id === id);
  const animal = request ? getAnimalById(request.animalId) : null;
  const farm = animal ? getFarmById(animal.farmId) : null;

  if (!request || !animal) return <div className="p-8 text-center text-muted-foreground">Request not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link to="/vet-requests" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Requests
      </Link>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{animal.name} ({animal.tagNumber})</h1>
            <p className="text-sm text-muted-foreground mt-1">{animal.species} · {animal.breed} · {farm?.name}</p>
          </div>
          <div className="flex gap-2">
            <UrgencyBadge urgency={request.urgency} />
            <CaseStatusBadge status={request.status} />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Farmer's Notes</p>
          <p className="text-sm text-foreground">{request.farmerNotes}</p>
        </div>

        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Submitted: {request.dateSubmitted}</span>
          {request.dateUpdated && <span>Updated: {request.dateUpdated}</span>}
        </div>

        {/* Status timeline */}
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {['Pending', 'Assigned', 'In Review', 'Completed'].map((step, i) => {
            const steps = ['Pending', 'Assigned', 'In Review', 'Completed'];
            const currentIdx = steps.indexOf(request.status);
            const isComplete = i <= currentIdx;
            return (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isComplete ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
                  {isComplete ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap ${isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step}</span>
                {i < 3 && <div className={`w-8 h-0.5 ${isComplete ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vet Response */}
      {request.vetResponse && (
        <div className="bg-card rounded-xl border border-success/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-success font-medium text-sm">
            <CheckCircle size={16} /> Vet Response
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Diagnosis</p>
            <p className="text-sm text-foreground mt-1">{request.vetResponse.diagnosis}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Treatment Recommendation</p>
            <p className="text-sm text-foreground mt-1">{request.vetResponse.treatmentRecommendation}</p>
          </div>
          {request.vetResponse.followUpRequired && request.vetResponse.followUpDate && (
            <p className="text-sm text-warning">Follow-up due: {request.vetResponse.followUpDate}</p>
          )}
          {request.vetResponse.vetNotes && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Vet Notes</p>
              <p className="text-sm text-foreground mt-1">{request.vetResponse.vetNotes}</p>
            </div>
          )}
          {request.vetResponse.consultationFee && (
            <p className="text-sm text-muted-foreground">Consultation fee: ${request.vetResponse.consultationFee}</p>
          )}
        </div>
      )}
    </div>
  );
}
