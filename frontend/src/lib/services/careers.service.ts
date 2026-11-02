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
  lives_in_zimbabwe: boolean;
  accepted_privacy_notice: boolean;
  cv: File;
  /** Honeypot: hidden from people, so it is only filled in by bots. */
  website: string;
}

export const careersService = {
  async submitApplication(payload: JobApplicationPayload): Promise<void> {
    const form = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      form.append(key, value instanceof File ? value : String(value));
    }
    await api.post('/careers/applications', form);
  },
};
