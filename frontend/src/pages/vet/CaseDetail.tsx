import { useParams, Link } from 'react-router-dom';
import { vetRequests, getAnimalById, getFarmById, getUserById, getObservationsByAnimal, getTreatmentsByAnimal, getVaccinationsByAnimal, calcAge, isOverdue } from '@/data/mockData';
import { StatusBadge, UrgencyBadge, CaseStatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Thermometer, Heart, Wind, Clock, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const request = vetRequests.find(r => r.id === id);
  const animal = request ? getAnimalById(request.animalId) : null;
  const farm = animal ? getFarmById(animal.farmId) : null;
  const farmer = request ? getUserById(request.farmerId) : null;
  const observations = animal ? getObservationsByAnimal(animal.id) : [];
  const treatmentsList = animal ? getTreatmentsByAnimal(animal.id) : [];
  const vaccinationsList = animal ? getVaccinationsByAnimal(animal.id) : [];

  if (!request || !animal) return <div className="p-8 text-center text-muted-foreground">Case not found</div>;

  const isCompleted = request.status === 'Completed';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link to="/vet/cases" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to Cases
      </Link>

      {/* Animal summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{animal.name} ({animal.tagNumber})</h1>
            <p className="text-sm text-muted-foreground mt-1">{animal.species} · {animal.breed} · {animal.gender} · {calcAge(animal.dateOfBirth)} · {animal.weight}kg</p>
            <p className="text-xs text-muted-foreground mt-1">Farm: {farm?.name} · Farmer: {farmer?.name}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={animal.healthStatus} size="md" />
            <UrgencyBadge urgency={request.urgency} />
          </div>
        </div>
        <div className="mt-4 p-3 bg-accent rounded-lg">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Farmer's Notes</p>
          <p className="text-sm text-foreground">{request.farmerNotes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Animal Records */}
        <div>
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
              <TabsTrigger value="vaccines">Vaccines</TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="mt-4 space-y-3">
              {observations.length === 0 ? <p className="text-center py-6 text-muted-foreground text-sm">No observations</p> : observations.map(obs => (
                <div key={obs.id} className="bg-card rounded-xl border border-border p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">{obs.date}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {obs.bodyTemperature && <span className="flex items-center gap-1"><Thermometer size={12} className="text-danger" />{obs.bodyTemperature}°C</span>}
                    {obs.heartRate && <span className="flex items-center gap-1"><Heart size={12} className="text-danger" />{obs.heartRate} BPM</span>}
                    {obs.respiratoryRate && <span className="flex items-center gap-1"><Wind size={12} className="text-primary" />{obs.respiratoryRate}</span>}
                  </div>
                  <p className="text-sm text-foreground">{obs.symptoms}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="treatments" className="mt-4 space-y-3">
              {treatmentsList.length === 0 ? <p className="text-center py-6 text-muted-foreground text-sm">No treatments</p> : treatmentsList.map(t => (
                <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                  <p className="font-medium text-sm">{t.name} — {t.date}</p>
                  <p className="text-sm text-muted-foreground">{t.drug}, {t.dosage}</p>
                  {t.outcome && <p className="text-sm mt-1">{t.outcome}</p>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="vaccines" className="mt-4 space-y-3">
              {vaccinationsList.length === 0 ? <p className="text-center py-6 text-muted-foreground text-sm">No vaccinations</p> : vaccinationsList.map(v => (
                <div key={v.id} className={`bg-card rounded-xl border p-4 ${isOverdue(v.nextDueDate) ? 'border-danger/50' : 'border-border'}`}>
                  <p className="font-medium text-sm">{v.vaccineName}</p>
                  <p className="text-sm text-muted-foreground">Given: {v.dateGiven} · Due: {v.nextDueDate}</p>
                  {isOverdue(v.nextDueDate) && <span className="text-xs text-danger font-medium">OVERDUE</span>}
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Vet Response */}
        <div>
          {isCompleted && request.vetResponse ? (
            <div className="bg-card rounded-xl border border-success/30 p-6 space-y-3">
              <div className="flex items-center gap-2 text-success font-semibold"><CheckCircle size={16} /> Case Completed</div>
              <div><p className="text-xs text-muted-foreground uppercase">Diagnosis</p><p className="text-sm mt-1">{request.vetResponse.diagnosis}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Treatment</p><p className="text-sm mt-1">{request.vetResponse.treatmentRecommendation}</p></div>
              <div><p className="text-xs text-muted-foreground uppercase">Notes</p><p className="text-sm mt-1">{request.vetResponse.vetNotes}</p></div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Submit Response</h2>
              <form onSubmit={e => { e.preventDefault(); toast({ title: 'Response submitted!' }); }} className="space-y-4">
                <div className="space-y-2"><Label>Verification</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>
                    <SelectItem value="Accept">Accept farmer's assessment</SelectItem>
                    <SelectItem value="Supplement">Accept and supplement</SelectItem>
                    <SelectItem value="Re-diagnose">Re-diagnose</SelectItem>
                  </SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Diagnosis</Label><Textarea placeholder="Your diagnosis" rows={3} /></div>
                <div className="space-y-2"><Label>Treatment Recommendation</Label><Textarea placeholder="Drug, dosage, method, duration" rows={3} /></div>
                <div className="space-y-2"><Label>Confidence Level</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>
                    {['Low','Medium','High'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="followup" /><Label htmlFor="followup">Follow-up required</Label>
                </div>
                <div className="space-y-2"><Label>Vet Notes</Label><Textarea placeholder="Additional notes" rows={2} /></div>
                <div className="space-y-2"><Label>Consultation Fee ($)</Label><Input type="number" placeholder="0" /></div>
                <Button type="submit" className="w-full">Submit Response & Complete</Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
