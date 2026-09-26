/**
 * Admin service — superuser-only overview endpoints.
 * Field names mirror the backend AdminFarmerRow schema exactly.
 */
import { api } from '@/lib/api';

/** "onboarding" = started on WhatsApp but hasn't finished onboarding yet. */
export type FarmerStatus = 'onboarding' | 'active';

export interface AdminFarmer {
  user_id: string | null;
  whatsapp_user_id: string | null;
  full_name: string | null;
  phone_number: string | null;
  email: string | null;
  district: string | null;
  address: string | null;
  preferred_language: string | null;
  status: FarmerStatus;
  has_web_account: boolean;
  registered_at: string | null;
  /** Messages the farmer sent on WhatsApp (V-Vet's replies are not counted). */
  message_count: number;
  messages_last_7_days: number;
  last_message_at: string | null;
  farm_count: number;
  /** Animals still on the farm (not sold, deceased, etc.). */
  animal_count: number;
  cattle_count: number;
  sick_count: number;
}

export interface AdminFarmersResponse {
  data: AdminFarmer[];
  count: number;
}

/** Superuser — every farmer (web + WhatsApp) with registration, message, farm and animal stats. */
export async function fetchAdminFarmers(): Promise<AdminFarmersResponse> {
  const { data } = await api.get<AdminFarmersResponse>('/admin/farmers');
  return data;
}
