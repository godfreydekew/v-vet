// V-Vet Mock Data
export type UserRole = 'farmer' | 'vet' | 'admin';
export type HealthStatus = 'Healthy' | 'Recovering' | 'Sick' | 'Deceased';
export type FarmType = 'Livestock' | 'Dairy' | 'Poultry' | 'Mixed' | 'Crop';
export type Species = 'Cattle' | 'Sheep' | 'Goat' | 'Poultry';
export type AppetiteLevel = 'Normal' | 'Reduced' | 'Poor' | 'Absent';
export type ActivityLevel = 'Normal' | 'Lethargic' | 'Restless' | 'Aggressive';
export type MilkProduction = 'Normal' | 'Decreased' | 'Stopped' | 'Not Applicable';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Emergency';
export type CaseStatus = 'Pending' | 'Assigned' | 'In Review' | 'Completed';
export type AdministeredBy = 'Farmer' | 'Vet' | 'Other';
export type VetAvailability = 'Available' | 'Busy' | 'Unavailable';
export type VerificationType = 'Accept' | 'Supplement' | 'Re-diagnose';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface DemoUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  licenceNumber?: string;
  specialisations?: string[];
  yearsExperience?: number;
  availability?: VetAvailability;
}

export interface Farm {
  id: string;
  farmerId: string;
  name: string;
  type: FarmType;
  address: string;
  city: string;
  country: string;
  hectares: number;
  description?: string;
  createdAt: string;
  lastActivity: string;
}

export interface Animal {
  id: string;
  farmId: string;
  farmerId: string;
  tagNumber: string;
  name: string;
  species: Species;
  breed: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  weight: number;
  healthStatus: HealthStatus;
  acquisitionDate?: string;
  notes?: string;
}

export interface HealthObservation {
  id: string;
  animalId: string;
  date: string;
  bodyTemperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  appetiteLevel: AppetiteLevel;
  activityLevel: ActivityLevel;
  symptoms: string;
  symptomDuration?: number;
  milkProduction?: MilkProduction;
  notes?: string;
}

export interface Treatment {
  id: string;
  animalId: string;
  date: string;
  name: string;
  drug: string;
  dosage: string;
  administeredBy: AdministeredBy;
  outcome?: string;
}

export interface Vaccination {
  id: string;
  animalId: string;
  vaccineName: string;
  dateGiven: string;
  administeredBy: AdministeredBy;
  nextDueDate: string;
  notes?: string;
}

export interface VetRequest {
  id: string;
  animalId: string;
  farmerId: string;
  vetId?: string;
  urgency: UrgencyLevel;
  status: CaseStatus;
  farmerNotes: string;
  dateSubmitted: string;
  dateUpdated?: string;
  vetResponse?: VetResponse;
}

export interface VetResponse {
  verificationType: VerificationType;
  diagnosis: string;
  treatmentRecommendation: string;
  confidenceLevel: ConfidenceLevel;
  followUpRequired: boolean;
  followUpDate?: string;
  vetNotes: string;
  consultationFee?: number;
}

export interface ActivityEvent {
  id: string;
  type: 'observation' | 'treatment' | 'vaccination' | 'vet_request' | 'registration' | 'farm_added' | 'animal_added';
  description: string;
  date: string;
  userId?: string;
  animalId?: string;
  farmId?: string;
}

// ─── Helpers ───
const today = new Date();
const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return formatDate(d); };
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return formatDate(d); };
const monthsAgo = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() - n); return formatDate(d); };
const monthsFromNow = (n: number) => { const d = new Date(); d.setMonth(d.getMonth() + n); return formatDate(d); };

const calcAge = (dob: string): string => {
  const [dd, mm, yyyy] = dob.split('/').map(Number);
  const birth = new Date(yyyy, mm - 1, dd);
  const months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''}`;
};

export { calcAge };

// ─── Demo Users ───
export const demoUsers: DemoUser[] = [
  {
    id: 'farmer-1',
    email: 'farmer@vvet.com',
    password: 'demo1234',
    name: 'Mary Chivhu',
    role: 'farmer',
    phone: '+263 77 123 4567',
    address: 'Chivhu, Zimbabwe',
  },
  {
    id: 'vet-1',
    email: 'vet@vvet.com',
    password: 'demo1234',
    name: 'Dr Moyo',
    role: 'vet',
    phone: '+263 77 987 6543',
    licenceNumber: 'VET-ZW-2014-0892',
    specialisations: ['Cattle', 'Sheep'],
    yearsExperience: 12,
    availability: 'Available',
  },
  {
    id: 'admin-1',
    email: 'admin@vvet.com',
    password: 'demo1234',
    name: 'Admin',
    role: 'admin',
    phone: '+263 77 000 0000',
  },
];

// ─── Farms ───
export const farms: Farm[] = [
  {
    id: 'farm-1',
    farmerId: 'farmer-1',
    name: 'Chivhu Farm',
    type: 'Livestock',
    address: '12 Rural Road',
    city: 'Chivhu',
    country: 'Zimbabwe',
    hectares: 45,
    description: 'Main livestock farm specializing in cattle and small stock.',
    createdAt: '15/01/2024',
    lastActivity: formatDate(today),
  },
  {
    id: 'farm-2',
    farmerId: 'farmer-1',
    name: 'Hillside Pasture',
    type: 'Mixed',
    address: 'Hillside Area',
    city: 'Chivhu',
    country: 'Zimbabwe',
    hectares: 22,
    description: 'Mixed farm with cattle and sheep on rolling pasture.',
    createdAt: '03/06/2024',
    lastActivity: daysAgo(5),
  },
];

// ─── Animals ───
export const animals: Animal[] = [
  // Chivhu Farm
  { id: 'animal-1', farmId: 'farm-1', farmerId: 'farmer-1', tagNumber: 'GV001', name: 'Shumba', species: 'Cattle', breed: 'Holstein', gender: 'Female', dateOfBirth: '20/03/2023', weight: 550, healthStatus: 'Sick', notes: 'Previously treated for tick-borne illness 4 months ago.' },
  { id: 'animal-2', farmId: 'farm-1', farmerId: 'farmer-1', tagNumber: 'GV002', name: 'Bhoura', species: 'Cattle', breed: 'Mashona', gender: 'Male', dateOfBirth: '15/03/2022', weight: 480, healthStatus: 'Healthy' },
  { id: 'animal-3', farmId: 'farm-1', farmerId: 'farmer-1', tagNumber: 'GV003', name: 'Nhema', species: 'Cattle', breed: 'Mashona', gender: 'Female', dateOfBirth: '10/03/2024', weight: 380, healthStatus: 'Recovering', notes: 'Recovering from respiratory issue.' },
  { id: 'animal-4', farmId: 'farm-1', farmerId: 'farmer-1', tagNumber: 'SP001', name: 'Chena', species: 'Sheep', breed: 'Merino', gender: 'Female', dateOfBirth: '05/09/2024', weight: 72, healthStatus: 'Healthy' },
  { id: 'animal-5', farmId: 'farm-1', farmerId: 'farmer-1', tagNumber: 'GT001', name: 'Mhuru', species: 'Goat', breed: 'Boer', gender: 'Male', dateOfBirth: '20/03/2025', weight: 45, healthStatus: 'Healthy' },
  { id: 'animal-6', farmId: 'farm-1', farmerId: 'farmer-1', tagNumber: 'PL001', name: 'Jongwe', species: 'Poultry', breed: 'Rhode Island Red', gender: 'Female', dateOfBirth: '10/07/2025', weight: 2.1, healthStatus: 'Healthy' },
  // Hillside Pasture
  { id: 'animal-7', farmId: 'farm-2', farmerId: 'farmer-1', tagNumber: 'HV001', name: 'Rukato', species: 'Cattle', breed: 'Hereford', gender: 'Female', dateOfBirth: '15/03/2021', weight: 520, healthStatus: 'Healthy' },
  { id: 'animal-8', farmId: 'farm-2', farmerId: 'farmer-1', tagNumber: 'HS001', name: 'Pfumbi', species: 'Sheep', breed: 'Dorper', gender: 'Male', dateOfBirth: '01/09/2023', weight: 95, healthStatus: 'Healthy' },
];

// ─── Health Observations ───
export const healthObservations: HealthObservation[] = [
  {
    id: 'obs-1',
    animalId: 'animal-1',
    date: formatDate(today),
    bodyTemperature: 40.2,
    heartRate: 88,
    appetiteLevel: 'Poor',
    activityLevel: 'Lethargic',
    symptoms: 'Not eating, head down, ticks behind ears',
    symptomDuration: 2,
    milkProduction: 'Decreased',
    notes: 'Condition worsening. Similar to episode 4 months ago.',
  },
  {
    id: 'obs-2',
    animalId: 'animal-1',
    date: monthsAgo(4),
    bodyTemperature: 39.8,
    appetiteLevel: 'Reduced',
    activityLevel: 'Lethargic',
    symptoms: 'Lethargy, reduced feed intake',
    symptomDuration: 3,
    milkProduction: 'Decreased',
  },
  {
    id: 'obs-3',
    animalId: 'animal-3',
    date: daysAgo(10),
    bodyTemperature: 39.5,
    heartRate: 72,
    respiratoryRate: 28,
    appetiteLevel: 'Reduced',
    activityLevel: 'Lethargic',
    symptoms: 'Coughing, nasal discharge',
    symptomDuration: 4,
    milkProduction: 'Not Applicable',
  },
];

// ─── Treatments ───
export const treatments: Treatment[] = [
  {
    id: 'treat-1',
    animalId: 'animal-1',
    date: monthsAgo(4),
    name: 'Antibiotic Injection',
    drug: 'Oxytetracycline',
    dosage: '5ml per 100kg',
    administeredBy: 'Vet',
    outcome: 'Recovered within 5 days',
  },
  {
    id: 'treat-2',
    animalId: 'animal-3',
    date: daysAgo(8),
    name: 'Respiratory Treatment',
    drug: 'Tulathromycin',
    dosage: '2.5ml per 100kg',
    administeredBy: 'Vet',
    outcome: 'Improving steadily',
  },
];

// ─── Vaccinations ───
export const vaccinations: Vaccination[] = [
  { id: 'vax-1', animalId: 'animal-1', vaccineName: 'FMD Vaccine', dateGiven: monthsAgo(6), administeredBy: 'Vet', nextDueDate: monthsFromNow(2) },
  { id: 'vax-2', animalId: 'animal-2', vaccineName: 'FMD Vaccine', dateGiven: monthsAgo(3), administeredBy: 'Vet', nextDueDate: monthsFromNow(3) },
  { id: 'vax-3', animalId: 'animal-4', vaccineName: 'Bluetongue Vaccine', dateGiven: monthsAgo(8), administeredBy: 'Farmer', nextDueDate: daysAgo(14), notes: 'OVERDUE' },
];

// ─── Vet Requests ───
export const vetRequests: VetRequest[] = [
  {
    id: 'req-1',
    animalId: 'animal-1',
    farmerId: 'farmer-1',
    vetId: 'vet-1',
    urgency: 'High',
    status: 'Assigned',
    farmerNotes: 'Shumba haasi kudya — not eating for 2 days, has ticks, seems cold. This happened before 4 months ago.',
    dateSubmitted: daysAgo(1),
    dateUpdated: formatDate(today),
  },
  {
    id: 'req-2',
    animalId: 'animal-3',
    farmerId: 'farmer-1',
    vetId: 'vet-1',
    urgency: 'Medium',
    status: 'Completed',
    farmerNotes: 'Nhema has been coughing for 4 days and has nasal discharge.',
    dateSubmitted: daysAgo(12),
    dateUpdated: daysAgo(8),
    vetResponse: {
      verificationType: 'Supplement',
      diagnosis: 'Bovine Respiratory Disease (BRD). Likely triggered by stress and weather change.',
      treatmentRecommendation: 'Tulathromycin 2.5ml/100kg single injection. Isolate for 5 days. Monitor temperature daily.',
      confidenceLevel: 'High',
      followUpRequired: true,
      followUpDate: daysFromNow(3),
      vetNotes: 'Animal responding well to treatment. Continue monitoring.',
      consultationFee: 25,
    },
  },
  {
    id: 'req-3',
    animalId: 'animal-2',
    farmerId: 'farmer-1',
    vetId: 'vet-1',
    urgency: 'Low',
    status: 'Completed',
    farmerNotes: 'Routine check requested before breeding season.',
    dateSubmitted: daysAgo(30),
    dateUpdated: daysAgo(25),
    vetResponse: {
      verificationType: 'Accept',
      diagnosis: 'Animal in excellent health. Good body condition score.',
      treatmentRecommendation: 'No treatment needed. Clear for breeding.',
      confidenceLevel: 'High',
      followUpRequired: false,
      vetNotes: 'Strong bull, good genetics.',
    },
  },
  {
    id: 'req-4',
    animalId: 'animal-7',
    farmerId: 'farmer-1',
    vetId: 'vet-1',
    urgency: 'Low',
    status: 'Completed',
    farmerNotes: 'Routine vaccination check.',
    dateSubmitted: daysAgo(45),
    dateUpdated: daysAgo(40),
    vetResponse: {
      verificationType: 'Accept',
      diagnosis: 'Healthy cow, all vaccinations up to date.',
      treatmentRecommendation: 'Continue current vaccination schedule.',
      confidenceLevel: 'High',
      followUpRequired: false,
      vetNotes: 'Well maintained animal.',
    },
  },
];

// ─── Activity Events ───
export const activityEvents: ActivityEvent[] = [
  { id: 'evt-1', type: 'observation', description: 'Health observation logged for Shumba (GV001)', date: formatDate(today), userId: 'farmer-1', animalId: 'animal-1' },
  { id: 'evt-2', type: 'vet_request', description: 'Vet request submitted for Shumba — High urgency', date: daysAgo(1), userId: 'farmer-1', animalId: 'animal-1' },
  { id: 'evt-3', type: 'treatment', description: 'Treatment administered to Nhema (GV003)', date: daysAgo(8), animalId: 'animal-3' },
  { id: 'evt-4', type: 'observation', description: 'Health observation logged for Nhema (GV003)', date: daysAgo(10), userId: 'farmer-1', animalId: 'animal-3' },
  { id: 'evt-5', type: 'vaccination', description: 'FMD vaccination given to Bhoura (GV002)', date: monthsAgo(3), animalId: 'animal-2' },
  { id: 'evt-6', type: 'registration', description: 'New farmer registered: Mary Chivhu', date: '15/01/2024', userId: 'farmer-1' },
  { id: 'evt-7', type: 'farm_added', description: 'New farm added: Chivhu Farm', date: '15/01/2024', farmId: 'farm-1' },
  { id: 'evt-8', type: 'animal_added', description: 'New animal registered: Shumba (GV001)', date: '20/01/2024', animalId: 'animal-1' },
];

// ─── Helper functions ───
export function getAnimalById(id: string) { return animals.find(a => a.id === id); }
export function getFarmById(id: string) { return farms.find(f => f.id === id); }
export function getUserById(id: string) { return demoUsers.find(u => u.id === id); }
export function getAnimalsByFarm(farmId: string) { return animals.filter(a => a.farmId === farmId); }
export function getFarmsByFarmer(farmerId: string) { return farms.filter(f => f.farmerId === farmerId); }
export function getAnimalsByFarmer(farmerId: string) { return animals.filter(a => a.farmerId === farmerId); }
export function getObservationsByAnimal(animalId: string) { return healthObservations.filter(o => o.animalId === animalId); }
export function getTreatmentsByAnimal(animalId: string) { return treatments.filter(t => t.animalId === animalId); }
export function getVaccinationsByAnimal(animalId: string) { return vaccinations.filter(v => v.animalId === animalId); }
export function getRequestsByFarmer(farmerId: string) { return vetRequests.filter(r => r.farmerId === farmerId); }
export function getRequestsByVet(vetId: string) { return vetRequests.filter(r => r.vetId === vetId); }
export function isOverdue(dateStr: string): boolean {
  const [dd, mm, yyyy] = dateStr.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd) < today;
}
