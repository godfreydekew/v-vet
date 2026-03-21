import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnimalById, getFarmById, getObservationsByAnimal, getTreatmentsByAnimal, getVaccinationsByAnimal, calcAge, isOverdue, vetRequests } from '@/data/mockData';
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge';
import { ArrowLeft, Plus, Thermometer, Heart, Wind, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function AnimalProfile() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const animal = getAnimalById(id || '');
  const farm = animal ? getFarmById(animal.farmId) : null;
  const observations = getObservationsByAnimal(id || '');
  const treatmentsList = getTreatmentsByAnimal(id || '');
  const vaccinationsList = getVaccinationsByAnimal(id || '');
  const [obsOpen, setObsOpen] = useState(false);
  const [treatOpen, setTreatOpen] = useState(false);
  const [vaxOpen, setVaxOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);

  if (!animal) return <div className="p-8 text-center text-muted-foreground">Animal not found</div>;

  const canRequestVet = animal.healthStatus === 'Sick' || animal.healthStatus === 'Recovering';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <Link to={`/farms/${animal.farmId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Back to {farm?.name}
      </Link>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{animal.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{animal.tagNumber} · {animal.species} · {animal.breed}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              <span>{animal.gender}</span>
              <span>{calcAge(animal.dateOfBirth)}</span>
              <span>{animal.weight} kg</span>
            </div>
            {farm && <p className="text-xs text-muted-foreground mt-2">Farm: <Link to={`/farms/${farm.id}`} className="text-primary hover:underline">{farm.name}</Link></p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={animal.healthStatus} size="md" />
            {canRequestVet && (
              <Dialog open={reqOpen} onOpenChange={setReqOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive">Submit Vet Request</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Submit Vet Request</DialogTitle></DialogHeader>
                  <form onSubmit={e => { e.preventDefault(); toast({ title: 'Vet request submitted!' }); setReqOpen(false); }} className="space-y-4">
                    <div className="bg-accent rounded-lg p-3 text-sm"><strong>{animal.name}</strong> ({animal.tagNumber})</div>
                    <div className="space-y-2">
                      <Label>Urgency Level</Label>
                      <Select><SelectTrigger><SelectValue placeholder="Select urgency" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">🟢 Low</SelectItem>
                          <SelectItem value="Medium">🟡 Medium</SelectItem>
                          <SelectItem value="High">🔴 High</SelectItem>
                          <SelectItem value="Emergency">🚨 Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Describe what you've noticed</Label><Textarea placeholder="What are the symptoms? When did it start?" rows={4} /></div>
                    <Button type="submit" className="w-full">Submit Request</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccines</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            {[
              ['Tag Number', animal.tagNumber],
              ['Species', animal.species],
              ['Breed', animal.breed],
              ['Gender', animal.gender],
              ['Weight', `${animal.weight} kg`],
              ['Date of Birth', animal.dateOfBirth],
              ['Age', calcAge(animal.dateOfBirth)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
            {animal.notes && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground mt-1">{animal.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Health History Tab */}
        <TabsContent value="health" className="mt-4 space-y-4">
          <Dialog open={obsOpen} onOpenChange={setObsOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus size={16} className="mr-1" /> Log Observation</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Log Health Observation</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); toast({ title: 'Observation logged!' }); setObsOpen(false); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Body Temp (°C)</Label><Input type="number" step="0.1" placeholder="39.0" /></div>
                  <div className="space-y-2"><Label>Heart Rate (BPM)</Label><Input type="number" placeholder="70" /></div>
                  <div className="space-y-2"><Label>Resp. Rate</Label><Input type="number" placeholder="20" /></div>
                  <div className="space-y-2"><Label>Symptom Duration (days)</Label><Input type="number" placeholder="1" /></div>
                </div>
                <div className="space-y-2"><Label>Appetite Level</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Normal','Reduced','Poor','Absent'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Activity Level</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Normal','Lethargic','Restless','Aggressive'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Symptoms</Label><Textarea placeholder="Describe symptoms" rows={3} /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes" rows={2} /></div>
                <Button type="submit" className="w-full">Save Observation</Button>
              </form>
            </DialogContent>
          </Dialog>

          {observations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No observations logged yet</p></div>
          ) : (
            <div className="space-y-3">
              {observations.map(obs => (
                <div key={obs.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{obs.date}</p>
                    {obs.symptomDuration && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={12} /> {obs.symptomDuration} days</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {obs.bodyTemperature && <div className="flex items-center gap-1.5 text-xs"><Thermometer size={14} className="text-danger" />{obs.bodyTemperature}°C</div>}
                    {obs.heartRate && <div className="flex items-center gap-1.5 text-xs"><Heart size={14} className="text-danger" />{obs.heartRate} BPM</div>}
                    {obs.respiratoryRate && <div className="flex items-center gap-1.5 text-xs"><Wind size={14} className="text-primary" />{obs.respiratoryRate} br/min</div>}
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${obs.appetiteLevel === 'Normal' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>Appetite: {obs.appetiteLevel}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${obs.activityLevel === 'Normal' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>Activity: {obs.activityLevel}</span>
                  </div>
                  {obs.symptoms && <p className="text-sm text-foreground">{obs.symptoms}</p>}
                  {obs.notes && <p className="text-xs text-muted-foreground">{obs.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Treatments Tab */}
        <TabsContent value="treatments" className="mt-4 space-y-4">
          <Dialog open={treatOpen} onOpenChange={setTreatOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus size={16} className="mr-1" /> Log Treatment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Treatment</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); toast({ title: 'Treatment logged!' }); setTreatOpen(false); }} className="space-y-4">
                <div className="space-y-2"><Label>Treatment Name</Label><Input placeholder="e.g. Antibiotic injection" /></div>
                <div className="space-y-2"><Label>Drug / Medicine</Label><Input placeholder="e.g. Oxytetracycline" /></div>
                <div className="space-y-2"><Label>Dosage</Label><Input placeholder="e.g. 5ml per 100kg" /></div>
                <div className="space-y-2"><Label>Date</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Administered By</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Farmer','Vet','Other'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Outcome / Notes</Label><Textarea placeholder="How did the animal respond?" rows={3} /></div>
                <Button type="submit" className="w-full">Save Treatment</Button>
              </form>
            </DialogContent>
          </Dialog>

          {treatmentsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No treatments recorded yet</p></div>
          ) : (
            <div className="space-y-3">
              {treatmentsList.map(t => (
                <div key={t.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.drug} — {t.dosage}</p>
                  <p className="text-xs text-muted-foreground mt-1">Administered by: {t.administeredBy}</p>
                  {t.outcome && <p className="text-sm text-foreground mt-2">{t.outcome}</p>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Vaccinations Tab */}
        <TabsContent value="vaccinations" className="mt-4 space-y-4">
          <Dialog open={vaxOpen} onOpenChange={setVaxOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus size={16} className="mr-1" /> Log Vaccination</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Log Vaccination</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); toast({ title: 'Vaccination logged!' }); setVaxOpen(false); }} className="space-y-4">
                <div className="space-y-2"><Label>Vaccine Name</Label><Input placeholder="e.g. FMD Vaccine" /></div>
                <div className="space-y-2"><Label>Date Given</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Administered By</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{['Farmer','Vet','Other'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Next Due Date</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Optional notes" rows={2} /></div>
                <Button type="submit" className="w-full">Save Vaccination</Button>
              </form>
            </DialogContent>
          </Dialog>

          {vaccinationsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>No vaccinations recorded yet</p></div>
          ) : (
            <div className="space-y-3">
              {vaccinationsList.map(v => {
                const overdue = isOverdue(v.nextDueDate);
                return (
                  <div key={v.id} className={`bg-card rounded-xl border p-4 ${overdue ? 'border-danger/50' : 'border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-foreground">{v.vaccineName}</p>
                      {overdue && <span className="text-xs px-2 py-0.5 rounded-full bg-danger/15 text-danger font-medium">OVERDUE</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">Given: {v.dateGiven}</p>
                    <p className="text-sm text-muted-foreground">Administered by: {v.administeredBy}</p>
                    <p className={`text-sm mt-1 ${overdue ? 'text-danger font-medium' : 'text-muted-foreground'}`}>Next due: {v.nextDueDate}</p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
