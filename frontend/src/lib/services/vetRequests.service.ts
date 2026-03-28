import { api } from '@/lib/api';

export type RequestStatus = 'pending' | 'assigned' | 'in_review' | 'completed' | 'cancelled';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';
export type ResponseType = 'accept' | 'accept_supplement' | 'rediagnose';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface VetRequest {
  id: string;
  livestock_id: string;
  farm_id: string;
  farmer_id: string;
  vet_id: string | null;
  urgency: UrgencyLevel;
  farmer_notes: string | null;
  status: RequestStatus;
  submitted_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
  livestock_name: string | null;
  livestock_tag: string | null;
  livestock_species: string | null;
}

export interface VetRequestsListResponse {
  data: VetRequest[];
  count: number;
}

export interface VetRequestSubmitPayload {
  livestock_id: string;
  vet_id: string;
  urgency: UrgencyLevel;
  farmer_notes?: string | null;
}

export interface VetRequestUpdatePayload {
  status?: RequestStatus;
}

export interface VetResponse {
  id: string;
  vet_request_id: string;
  vet_id: string;
  response_type: ResponseType;
  diagnosis: string | null;
  treatment_recommendation: string | null;
  drug_name: string | null;
  dosage: string | null;
  confidence_level: ConfidenceLevel;
  follow_up_required: boolean;
  follow_up_date: string | null;
  vet_notes: string | null;
  responded_at: string;
}

export interface VetResponseCreatePayload {
  vet_request_id: string;
  vet_id: string;
  response_type: ResponseType;
  diagnosis?: string | null;
  treatment_recommendation?: string | null;
  drug_name?: string | null;
  dosage?: string | null;
  confidence_level?: ConfidenceLevel;
  follow_up_required?: boolean;
  follow_up_date?: string | null;
  vet_notes?: string | null;
}

export async function fetchVetRequests(params?: { skip?: number; limit?: number }): Promise<VetRequestsListResponse> {
  const { data } = await api.get('/vet-requests/', { params });
  return data;
}

export async function fetchVetRequestById(id: string): Promise<VetRequest> {
  const { data } = await api.get(`/vet-requests/${id}`);
  return data;
}

export async function createVetRequest(payload: VetRequestSubmitPayload): Promise<VetRequest> {
  const { data } = await api.post('/vet-requests/', payload);
  return data;
}

export async function updateVetRequest(id: string, payload: VetRequestUpdatePayload): Promise<VetRequest> {
  const { data } = await api.patch(`/vet-requests/${id}`, payload);
  return data;
}

export async function fetchVetResponse(requestId: string): Promise<VetResponse> {
  const { data } = await api.get(`/vet-requests/${requestId}/response`);
  return data;
}

export async function submitVetResponse(requestId: string, payload: VetResponseCreatePayload): Promise<VetResponse> {
  const { data } = await api.post(`/vet-requests/${requestId}/response`, payload);
  return data;
}
