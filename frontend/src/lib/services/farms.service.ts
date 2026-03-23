import { api } from '@/lib/api';

export type FarmType = 'livestock' | 'dairy' | 'poultry' | 'mixed' | 'crop';

export interface Farm {
  id: string;
  name: string;
  farm_type: FarmType;
  address: string | null;
  city: string | null;
  country: string | null;
  size_hectares: number | null;
  description: string | null;
  is_active: boolean;
  farmer_id: string;
  created_at: string;
  updated_at: string | null;
}

export interface FarmsListResponse {
  data: Farm[];
  count: number;
}

export interface FarmCreatePayload {
  name: string;
  farm_type: FarmType;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  size_hectares?: number | null;
  description?: string | null;
  is_active?: boolean;
}

export type FarmUpdatePayload = Partial<FarmCreatePayload>;

export async function fetchFarms(params?: { skip?: number; limit?: number }): Promise<FarmsListResponse> {
  const res = await api.get('/farms/', { params });
  return res.data;
}

export async function fetchFarmById(farmId: string): Promise<Farm> {
  const res = await api.get(`/farms/${farmId}`);
  return res.data;
}

export async function createFarm(payload: FarmCreatePayload): Promise<Farm> {
  const res = await api.post('/farms/', payload);
  return res.data;
}

export async function updateFarm(farmId: string, payload: FarmUpdatePayload): Promise<Farm> {
  const res = await api.patch(`/farms/${farmId}`, payload);
  return res.data;
}

export async function deleteFarm(farmId: string): Promise<{ message: string }> {
  const res = await api.delete(`/farms/${farmId}`);
  return res.data;
}

export async function fetchFarmLivestock(farmId: string, params?: { skip?: number; limit?: number }) {
  const res = await api.get(`/farms/${farmId}/livestock`, { params });
  return res.data;
}
