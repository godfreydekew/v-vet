import { api } from '@/lib/api';

export type Species = 'cattle' | 'sheep' | 'goat' | 'poultry' | 'pig' | 'other';
export type Gender = 'male' | 'female' | 'unknown';
export type HealthStatus = 'healthy' | 'sick' | 'recovering' | 'deceased';

export interface Livestock {
  id: string;
  farm_id: string;
  name: string | null;
  tag_number: string | null;
  species: Species;
  breed: string | null;
  gender: Gender | null;
  weight_kg: number | null;
  date_of_birth: string | null;
  acquired_date: string | null;
  health_status: HealthStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface LivestocksListResponse {
  data: Livestock[];
  count: number;
}

export interface LivestockCreatePayload {
  farm_id: string;
  species: Species;
  name?: string | null;
  tag_number?: string | null;
  breed?: string | null;
  gender?: Gender | null;
  weight_kg?: number | null;
  date_of_birth?: string | null;
  acquired_date?: string | null;
  health_status?: HealthStatus;
  notes?: string | null;
}

export interface LivestockUpdatePayload {
  name?: string | null;
  tag_number?: string | null;
  species?: Species;
  breed?: string | null;
  gender?: Gender | null;
  weight_kg?: number | null;
  date_of_birth?: string | null;
  acquired_date?: string | null;
  health_status?: HealthStatus;
  notes?: string | null;
}

export async function fetchLivestock(params?: { skip?: number; limit?: number }): Promise<LivestocksListResponse> {
  const res = await api.get('/livestock/', { params });
  return res.data;
}

export async function fetchLivestockById(id: string): Promise<Livestock> {
  const res = await api.get(`/livestock/${id}`);
  return res.data;
}

export async function createLivestock(payload: LivestockCreatePayload): Promise<Livestock> {
  const res = await api.post('/livestock/', payload);
  return res.data;
}

export async function updateLivestock(id: string, payload: LivestockUpdatePayload): Promise<Livestock> {
  const res = await api.patch(`/livestock/${id}`, payload);
  return res.data;
}

export async function deleteLivestock(id: string): Promise<{ message: string }> {
  const res = await api.delete(`/livestock/${id}`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Health Observations
// ---------------------------------------------------------------------------

export type AppetiteLevel = 'normal' | 'reduced' | 'poor' | 'absent';
export type ActivityLevel = 'normal' | 'lethargic' | 'restless' | 'aggressive';
export type MilkProduction = 'normal' | 'decreased' | 'stopped' | 'not_applicable';

export interface HealthObservation {
  id: string;
  livestock_id: string;
  logged_by: string;
  body_temp_celsius: number | null;
  heart_rate_bpm: number | null;
  respiratory_rate: number | null;
  appetite_level: AppetiteLevel | null;
  activity_level: ActivityLevel | null;
  symptoms: string | null;
  symptom_duration_days: number | null;
  milk_production: MilkProduction | null;
  notes: string | null;
  observed_at: string;
}

export interface HealthObservationCreatePayload {
  body_temp_celsius?: number | null;
  heart_rate_bpm?: number | null;
  respiratory_rate?: number | null;
  appetite_level?: AppetiteLevel | null;
  activity_level?: ActivityLevel | null;
  symptoms?: string | null;
  symptom_duration_days?: number | null;
  milk_production?: MilkProduction | null;
  notes?: string | null;
}

export async function fetchHealthObservations(livestockId: string): Promise<{ data: HealthObservation[]; count: number }> {
  const res = await api.get(`/livestock/${livestockId}/health-observations`);
  return res.data;
}

export async function createHealthObservation(livestockId: string, payload: HealthObservationCreatePayload): Promise<HealthObservation> {
  const res = await api.post(`/livestock/${livestockId}/health-observations`, payload);
  return res.data;
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export type AdministeredBy = 'farmer' | 'vet' | 'other';

export interface Treatment {
  id: string;
  livestock_id: string;
  logged_by: string;
  treatment_name: string;
  drug_used: string | null;
  dosage: string | null;
  date_given: string;
  administered_by: AdministeredBy;
  outcome_notes: string | null;
  created_at: string;
}

export interface TreatmentCreatePayload {
  treatment_name: string;
  date_given: string;
  administered_by: AdministeredBy;
  drug_used?: string | null;
  dosage?: string | null;
  outcome_notes?: string | null;
}

export async function fetchTreatments(livestockId: string): Promise<{ data: Treatment[]; count: number }> {
  const res = await api.get(`/livestock/${livestockId}/treatments`);
  return res.data;
}

export async function createTreatment(livestockId: string, payload: TreatmentCreatePayload): Promise<Treatment> {
  const res = await api.post(`/livestock/${livestockId}/treatments`, payload);
  return res.data;
}

// ---------------------------------------------------------------------------
// Vaccinations
// ---------------------------------------------------------------------------

export interface Vaccination {
  id: string;
  livestock_id: string;
  logged_by: string;
  vaccine_name: string;
  date_given: string;
  administered_by: AdministeredBy;
  next_due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface VaccinationCreatePayload {
  vaccine_name: string;
  date_given: string;
  administered_by: AdministeredBy;
  next_due_date?: string | null;
  notes?: string | null;
}

export async function fetchVaccinations(livestockId: string): Promise<{ data: Vaccination[]; count: number }> {
  const res = await api.get(`/livestock/${livestockId}/vaccinations`);
  return res.data;
}

export async function createVaccination(livestockId: string, payload: VaccinationCreatePayload): Promise<Vaccination> {
  const res = await api.post(`/livestock/${livestockId}/vaccinations`, payload);
  return res.data;
}
