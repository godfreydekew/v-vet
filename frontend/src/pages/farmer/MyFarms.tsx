import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFarmsByFarmer, getAnimalsByFarm, type Farm } from '@/data/mockData';
import { FarmTypeBadge } from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Link } from 'react-router-dom';
import { Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function MyFarms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const myFarms = getFarmsByFarmer(user?.id || '');
  const [open, setOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Farm added successfully!' });
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">My Farms</h1>
          <p className="text-sm text-muted-foreground mt-1">{myFarms.length} farm{myFarms.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus size={16} /> Add Farm</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Farm</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2"><Label>Farm Name *</Label><Input placeholder="e.g. Sunrise Farm" required /></div>
              <div className="space-y-2">
                <Label>Farm Type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['Livestock','Dairy','Poultry','Mixed','Crop'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>City</Label><Input placeholder="City" /></div>
                <div className="space-y-2"><Label>Country</Label><Input placeholder="Country" /></div>
              </div>
              <div className="space-y-2"><Label>Size (hectares)</Label><Input type="number" placeholder="0" /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Save Farm</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {myFarms.length === 0 ? (
        <EmptyState icon={Building2} title="No farms yet" description="Add your first farm to start tracking your livestock." actionLabel="Add Farm" onAction={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myFarms.map(farm => {
            const animalCount = getAnimalsByFarm(farm.id).length;
            return (
              <Link key={farm.id} to={`/farms/${farm.id}`} className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-150 block">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{farm.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{farm.city}, {farm.country}</p>
                  </div>
                  <FarmTypeBadge type={farm.type} />
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span>{animalCount} animals</span>
                  <span>{farm.hectares} ha</span>
                  <span>Last activity: {farm.lastActivity}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
