import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiError } from '@/lib/api';
import {
  fetchVetRequestById,
  fetchVetResponse,
  submitVetResponse,
  updateVetRequest,
  type ResponseType,
  type ConfidenceLevel,
  type VetResponseCreatePayload,
} from '@/lib/services/vetRequests.service';
import { fetchLivestockById } from '@/lib/services/livestock.service';
import { fetchFarmById } from '@/lib/services/farms.service';
import {
  fetchHealthObservations,
  fetchTreatments,
  fetchVaccinations,
} from '@/lib/services/livestock.service';
import { ArrowLeft, Thermometer, Heart, Wind, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  emergency: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  assigned: 'Assigned',
  in_review: 'In Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(date: string | null) {
  return !!date && new Date(date) < new Date();
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [responseForm, setResponseForm] = useState<Omit<VetResponseCreatePayload, 'vet_request_id' | 'vet_id'>>({
    response_type: 'accept',
    diagnosis: '',
    treatment_recommendation: '',
    drug_name: '',
    dosage: '',
    confidence_level: 'high',
    follow_up_required: false,
    follow_up_date: null,
    vet_notes: '',
  });

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

  const obsQuery = useQuery({
    queryKey: ['health-obs', req?.livestock_id],
    queryFn: () => fetchHealthObservations(req!.livestock_id),
    enabled: !!req?.livestock_id,
  });

  const treatQuery = useQuery({
    queryKey: ['treatments', req?.livestock_id],
    queryFn: () => fetchTreatments(req!.livestock_id),
    enabled: !!req?.livestock_id,
  });

  const vaxQuery = useQuery({
    queryKey: ['vaccinations', req?.livestock_id],
    queryFn: () => fetchVaccinations(req!.livestock_id),
    enabled: !!req?.livestock_id,
  });

  const responseQuery = useQuery({
    queryKey: ['vet-response', id],
    queryFn: () => fetchVetResponse(id!),
    enabled: req?.status === 'completed',
    retry: false,
  });

  const markInReview = useMutation({
    mutationFn: () => updateVetRequest(id!, { status: 'in_review' }),
    onSuccess: () => {
      toast({ title: 'Case marked as In Review.' });
      queryClient.invalidateQueries({ queryKey: ['vet-request', id] });
      queryClient.invalidateQueries({ queryKey: ['vet-requests'] });
    },
    onError: (err) => toast({ title: getApiError(err), variant: 'destructive' }),
  });

  const submitResponse = useMutation({
    mutationFn: () =>
      submitVetResponse(id!, {
        ...responseForm,
        vet_request_id: id!,
        vet_id: req!.vet_id!,
      }),
    onSuccess: () => {
      toast({ title: 'Response submitted. Case completed.' });
      queryClient.invalidateQueries({ queryKey: ['vet-request', id] });
      queryClient.invalidateQueries({ queryKey: ['vet-response', id] });
      queryClient.invalidateQueries({ queryKey: ['vet-requests'] });
    },
    onError: (err) => toast({ title: getApiError(err), variant: 'destructive' }),
  });

  if (requestQuery.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>;
  }

  if (!req) {
    return <div className="p-8 text-center text-muted-foreground">Case not found.</div>;
  }

  const animal = animalQuery.data;
  const farm = farmQuery.data;
  const observations = obsQuery.data?.data ?? [];
  const treatments = treatQuery.data?.data ?? [];
  const vaccinations = vaxQuery.data?.data ?? [];
  const vetResponse = responseQuery.data;
  const isCompleted = req.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link to="/vet/cases" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Cases
      </Link>

      {/* Animal + request summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {animal ? `${animal.name ?? 'Unnamed'} ${animal.tag_number ? `(${animal.tag_number})` : ''}` : '—'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {[animal?.species, animal?.breed, farm?.name].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-start">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${URGENCY_COLORS[req.urgency]}`}>
              {req.urgency}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-accent text-foreground">
              {STATUS_LABELS[req.status] ?? req.status}
            </span>
          </div>
        </div>

        {req.farmer_notes && (
          <div className="mt-4 p-3 bg-accent rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Farmer's Notes</p>
            <p className="text-sm text-foreground">{req.farmer_notes}</p>
          </div>
        )}

        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <span>Submitted: {fmt(req.submitted_at)}</span>
          {req.updated_at && <span>Updated: {fmt(req.updated_at)}</span>}
        </div>

        {req.status === 'assigned' && (
          <div className="mt-4">
            <Button type="button" size="sm" onClick={() => markInReview.mutate()} disabled={markInReview.isPending}>
              {markInReview.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
              Start Review
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Animal records */}
        <div>
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
              <TabsTrigger value="vaccines">Vaccines</TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="mt-4 space-y-3">
              {obsQuery.isLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
              ) : observations.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No observations</p>
              ) : observations.map((obs) => (
                <div key={obs.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">{fmt(obs.observed_at)}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {obs.body_temp_celsius && <span className="flex items-center gap-1"><Thermometer size={12} className="text-red-500" />{obs.body_temp_celsius}°C</span>}
                    {obs.heart_rate_bpm && <span className="flex items-center gap-1"><Heart size={12} className="text-red-500" />{obs.heart_rate_bpm} BPM</span>}
                    {obs.respiratory_rate && <span className="flex items-center gap-1"><Wind size={12} className="text-blue-500" />{obs.respiratory_rate} br/min</span>}
                    {obs.symptom_duration_days && <span className="flex items-center gap-1"><Clock size={12} />{obs.symptom_duration_days}d</span>}
                  </div>
                  {obs.symptoms && <p className="text-sm text-foreground">{obs.symptoms}</p>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="treatments" className="mt-4 space-y-3">
              {treatQuery.isLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
              ) : treatments.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No treatments</p>
              ) : treatments.map((t) => (
                <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="font-medium text-sm">{t.treatment_name} — {fmt(t.date_given)}</p>
                  {(t.drug_used || t.dosage) && <p className="text-sm text-muted-foreground">{[t.drug_used, t.dosage].filter(Boolean).join(', ')}</p>}
                  {t.outcome_notes && <p className="text-sm mt-1">{t.outcome_notes}</p>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="vaccines" className="mt-4 space-y-3">
              {vaxQuery.isLoading ? (
                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
              ) : vaccinations.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-sm">No vaccinations</p>
              ) : vaccinations.map((v) => (
                <div key={v.id} className={`bg-card rounded-xl border p-4 ${isOverdue(v.next_due_date) ? 'border-destructive/50' : 'border-border'}`}>
                  <p className="font-medium text-sm">{v.vaccine_name}</p>
                  <p className="text-sm text-muted-foreground">Given: {fmt(v.date_given)}</p>
                  {v.next_due_date && <p className={`text-sm mt-0.5 ${isOverdue(v.next_due_date) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>Due: {fmt(v.next_due_date)}</p>}
                  {isOverdue(v.next_due_date) && <span className="text-xs text-destructive font-medium">OVERDUE</span>}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Vet response */}
        <div>
          {isCompleted && vetResponse ? (
            <div className="bg-card rounded-xl border border-green-500/30 p-6 space-y-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                <CheckCircle size={16} /> Case Completed
              </div>
              <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Diagnosis</p><p className="text-sm mt-1">{vetResponse.diagnosis ?? '—'}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Treatment</p><p className="text-sm mt-1">{vetResponse.treatment_recommendation ?? '—'}</p></div>
              {vetResponse.drug_name && <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Drug / Dosage</p><p className="text-sm mt-1">{[vetResponse.drug_name, vetResponse.dosage].filter(Boolean).join(' — ')}</p></div>}
              {vetResponse.vet_notes && <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p><p className="text-sm mt-1">{vetResponse.vet_notes}</p></div>}
              {vetResponse.follow_up_required && vetResponse.follow_up_date && (
                <div><p className="text-xs text-muted-foreground uppercase tracking-wide">Follow-up</p><p className="text-sm mt-1">{fmt(vetResponse.follow_up_date)}</p></div>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Submit Response</h2>
              <form
                onSubmit={(e) => { e.preventDefault(); submitResponse.mutate(); }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Verification</Label>
                  <Select
                    value={responseForm.response_type}
                    onValueChange={(v) => setResponseForm((p) => ({ ...p, response_type: v as ResponseType }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accept">Accept farmer's assessment</SelectItem>
                      <SelectItem value="accept_supplement">Accept and supplement</SelectItem>
                      <SelectItem value="rediagnose">Re-diagnose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Diagnosis</Label>
                  <Textarea
                    placeholder="Your diagnosis"
                    rows={3}
                    value={responseForm.diagnosis ?? ''}
                    onChange={(e) => setResponseForm((p) => ({ ...p, diagnosis: e.target.value || null }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Treatment Recommendation</Label>
                  <Textarea
                    placeholder="Drug, dosage, method, duration"
                    rows={3}
                    value={responseForm.treatment_recommendation ?? ''}
                    onChange={(e) => setResponseForm((p) => ({ ...p, treatment_recommendation: e.target.value || null }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Drug Name</Label>
                    <Input
                      placeholder="e.g. Oxytetracycline"
                      value={responseForm.drug_name ?? ''}
                      onChange={(e) => setResponseForm((p) => ({ ...p, drug_name: e.target.value || null }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      placeholder="e.g. 10mg/kg"
                      value={responseForm.dosage ?? ''}
                      onChange={(e) => setResponseForm((p) => ({ ...p, dosage: e.target.value || null }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confidence Level</Label>
                  <Select
                    value={responseForm.confidence_level}
                    onValueChange={(v) => setResponseForm((p) => ({ ...p, confidence_level: v as ConfidenceLevel }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="followup"
                    checked={responseForm.follow_up_required}
                    onCheckedChange={(v) => setResponseForm((p) => ({ ...p, follow_up_required: v }))}
                  />
                  <Label htmlFor="followup">Follow-up required</Label>
                </div>
                {responseForm.follow_up_required && (
                  <div className="space-y-2">
                    <Label>Follow-up Date</Label>
                    <Input
                      type="date"
                      value={responseForm.follow_up_date ?? ''}
                      onChange={(e) => setResponseForm((p) => ({ ...p, follow_up_date: e.target.value || null }))}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Vet Notes</Label>
                  <Textarea
                    placeholder="Additional notes"
                    rows={2}
                    value={responseForm.vet_notes ?? ''}
                    onChange={(e) => setResponseForm((p) => ({ ...p, vet_notes: e.target.value || null }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitResponse.isPending}>
                  {submitResponse.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
                  Submit Response & Complete
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
