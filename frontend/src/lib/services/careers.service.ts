/**
 * Careers service: submits job applications from the public careers page.
 * Field names mirror the form fields of POST /careers/applications.
 */
import { api } from '@/lib/api';

export interface JobApplicationPayload {
  role: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  languages: string;
  portfolio_links: string;
  llm_project_answer: string;
  linkedin_url: string;
  preferred_pay: string;
  lives_in_zimbabwe: boolean;
  accepted_privacy_notice: boolean;
  cv: File;
  /** Honeypot: hidden from people, so it is only filled in by bots. */
  website: string;
}

const SUBMIT_TIMEOUT_MS = 3 * 60 * 1000;

export const careersService = {
  /** onUploadProgress receives a whole-number percentage from 0 to 100. */
  async submitApplication(
    payload: JobApplicationPayload,
    onUploadProgress?: (percent: number) => void,
  ): Promise<void> {
    const form = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      form.append(key, value instanceof File ? value : String(value));
    }
    await api.post('/careers/applications', form, {
      timeout: SUBMIT_TIMEOUT_MS,
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          onUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
  },
};
