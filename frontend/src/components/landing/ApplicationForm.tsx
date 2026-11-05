import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { authHintClass, authInputClass, authLabelClass, authSubmitClass } from "@/components/landing/AuthShell";
import { CAREERS_MAILTO, PARTNER_EMAIL } from "@/components/landing/Site";
import { careersService } from "@/lib/services/careers.service";
import { getApiError } from "@/lib/api";

const LANGUAGE_OPTIONS = ["English", "Shona", "Ndebele"];
const MAX_CV_BYTES = 5 * 1024 * 1024;
const MIN_ANSWER_LENGTH = 50;
export const LLM_QUESTION =
  "Tell us about something you built on top of an LLM. What went wrong, and how did you fix it?";

const NETWORK_ERROR_MESSAGE = "Your connection dropped. Your answers are saved here, so tap Send again.";

const textareaClass = authInputClass.replace("h-12", "min-h-[120px] py-3 leading-relaxed");
const invalidRingClass = "aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-600";

// Everything typed into the form except the CV (a file can't be saved) and the privacy consent.
// Keys match the inputs' ids, so an error can be shown under, and focus moved to, the right field.
type Fields = {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  languages: string[];
  other_language: string;
  portfolio_links: string;
  linkedin_url: string;
  preferred_pay: string;
  llm_project_answer: string;
  lives_in_zimbabwe: boolean;
};

const EMPTY_FIELDS: Fields = {
  full_name: "",
  email: "",
  phone: "",
  location: "",
  languages: [],
  other_language: "",
  portfolio_links: "",
  linkedin_url: "",
  preferred_pay: "",
  llm_project_answer: "",
  lives_in_zimbabwe: false,
};

// Field ids in the order they appear, so focus goes to the first problem on the page.
const FIELD_ORDER = [
  "full_name",
  "email",
  "phone",
  "location",
  "languages",
  "cv",
  "portfolio_links",
  "linkedin_url",
  "llm_project_answer",
  "lives_in_zimbabwe",
  "accepted_privacy",
];

type FieldErrors = Record<string, string>;

function draftStorageKey(roleId: string) {
  return `vvet-application-draft:${roleId}`;
}

// True once the applicant has typed or ticked anything worth keeping.
function hasAnyAnswer(fields: Fields) {
  return Object.values(fields).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim().length > 0;
    return value === true;
  });
}

function loadDraft(roleId: string): Fields | null {
  try {
    const saved = localStorage.getItem(draftStorageKey(roleId));
    if (!saved) return null;
    const draft: Fields = { ...EMPTY_FIELDS, ...JSON.parse(saved) };
    return hasAnyAnswer(draft) ? draft : null;
  } catch {
    return null;
  }
}

function saveDraft(roleId: string, fields: Fields) {
  try {
    if (hasAnyAnswer(fields)) {
      localStorage.setItem(draftStorageKey(roleId), JSON.stringify(fields));
    } else {
      localStorage.removeItem(draftStorageKey(roleId));
    }
  } catch {
    // Storage can be full or blocked (private browsing). The form still works without it.
  }
}

function clearDraft(roleId: string) {
  try {
    localStorage.removeItem(draftStorageKey(roleId));
  } catch {
    // Nothing to clear.
  }
}

function speaksRequiredLanguage(fields: Fields) {
  return (
    fields.languages.includes("Shona") ||
    fields.languages.includes("Ndebele") ||
    /shona|ndebele/i.test(fields.other_language)
  );
}

function validate(fields: Fields, cv: File | null, acceptedPrivacy: boolean): FieldErrors {
  const errors: FieldErrors = {};

  if (fields.full_name.trim().length < 2) {
    errors.full_name = "Enter your full name.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Enter an email address like name@example.com. We send the coding task here.";
  }
  if (fields.phone.trim().length < 7) {
    errors.phone = "Enter a phone or WhatsApp number, including the country code.";
  }
  if (fields.location.trim().length < 2) {
    errors.location = "Enter the town or city you live in.";
  }
  if (!speaksRequiredLanguage(fields)) {
    errors.languages = "This role needs someone who speaks Shona or Ndebele.";
  }
  if (!cv) {
    errors.cv = "Attach your CV as a PDF or Word document.";
  }
  if (fields.portfolio_links.trim().length < 5) {
    errors.portfolio_links = "Add at least one link to something you've built.";
  }
  const linkedin = fields.linkedin_url.trim();
  if (linkedin && !/^https?:\/\/\S+$/i.test(linkedin)) {
    errors.linkedin_url = "Paste the full link, starting with https://, or leave this empty.";
  }
  const answerLength = fields.llm_project_answer.trim().length;
  if (answerLength < MIN_ANSWER_LENGTH) {
    errors.llm_project_answer = `Tell us a little more: at least ${MIN_ANSWER_LENGTH} characters (you have ${answerLength}).`;
  }
  if (!fields.lives_in_zimbabwe) {
    errors.lives_in_zimbabwe = "This role is only open to people living in Zimbabwe.";
  }
  if (!acceptedPrivacy) {
    errors.accepted_privacy = "Confirm you've read the privacy notice.";
  }

  return errors;
}

// aria-describedby for an input: its hint (if it has one) and its error (if it has one).
function describedBy(id: string, hasHint: boolean, errors: FieldErrors) {
  const ids = [];
  if (hasHint) ids.push(`${id}-hint`);
  if (errors[id]) ids.push(`${id}-error`);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export default function ApplicationForm({ roleId }: { roleId: string }) {
  const [restoredDraft] = useState(() => loadDraft(roleId));
  const [fields, setFields] = useState<Fields>(() => restoredDraft ?? EMPTY_FIELDS);
  const [cv, setCv] = useState<File | null>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [website, setWebsite] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!submittedEmail) saveDraft(roleId, fields);
  }, [roleId, fields, submittedEmail]);

  function clearFieldError(id: string) {
    setFieldErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function updateField<K extends keyof Fields>(name: K, value: Fields[K]) {
    setFields((current) => ({ ...current, [name]: value }));
    clearFieldError(name === "other_language" ? "languages" : name);
  }

  function toggleLanguage(language: string) {
    const languages = fields.languages.includes(language)
      ? fields.languages.filter((l) => l !== language)
      : [...fields.languages, language];
    updateField("languages", languages);
  }

  function handleCvChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_CV_BYTES) {
      event.target.value = "";
      setCv(null);
      setFieldErrors((current) => ({ ...current, cv: "Your CV must be 5 MB or smaller." }));
      return;
    }
    setCv(file);
    clearFieldError("cv");
  }

  function focusFirstError(errors: FieldErrors) {
    const firstId = FIELD_ORDER.find((id) => errors[id]);
    if (!firstId) return;
    // Wait for React to render the error messages before moving focus.
    requestAnimationFrame(() => document.getElementById(firstId)?.focus());
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const errors = validate(fields, cv, acceptedPrivacy);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !cv) {
      focusFirstError(errors);
      return;
    }

    setIsSubmitting(true);
    setUploadPercent(0);
    try {
      await careersService.submitApplication(
        {
          role: roleId,
          full_name: fields.full_name.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim(),
          location: fields.location.trim(),
          languages: [...fields.languages, fields.other_language.trim()].filter(Boolean).join(", "),
          portfolio_links: fields.portfolio_links.trim(),
          llm_project_answer: fields.llm_project_answer.trim(),
          linkedin_url: fields.linkedin_url.trim(),
          preferred_pay: fields.preferred_pay.trim(),
          lives_in_zimbabwe: fields.lives_in_zimbabwe,
          accepted_privacy_notice: acceptedPrivacy,
          cv,
          website,
        },
        setUploadPercent,
      );
      clearDraft(roleId);
      setSubmittedEmail(fields.email.trim());
    } catch (err) {
      // No response at all means the connection dropped or timed out, not that we rejected the application.
      const connectionFailed = isAxiosError(err) && !err.response;
      setSubmitError(connectionFailed ? NETWORK_ERROR_MESSAGE : getApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <div className="rounded-[24px] bg-white p-8 text-center ring-1 ring-black/5" role="status">
        <CheckCircle2 size={40} className="mx-auto text-landing-pine" aria-hidden="true" />
        <h3 className="mt-4 font-display text-[1.375rem] font-semibold text-landing-ink">Application sent</h3>
        <p className="mx-auto mt-2 max-w-[48ch] text-[15px] leading-relaxed text-landing-muted">
          Thank you. We've emailed your coding task to <strong className="text-landing-ink">{submittedEmail}</strong>,
          with instructions for sending it back. If you can't see it, check your spam folder.
        </p>
      </div>
    );
  }

  const errorCount = Object.keys(fieldErrors).length;
  let submitLabel = "Send application";
  if (isSubmitting) {
    submitLabel = uploadPercent < 100 ? `Uploading your application… ${uploadPercent}%` : "Sending your application…";
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {restoredDraft && !cv && (
        <p className="rounded-xl bg-landing-mint px-4 py-3 text-sm leading-relaxed text-landing-ink">
          We've kept the answers you typed last time. Please attach your CV again.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" error={fieldErrors.full_name}>
          <input id="full_name" required maxLength={120} autoComplete="name"
            aria-invalid={Boolean(fieldErrors.full_name)} aria-describedby={describedBy("full_name", false, fieldErrors)}
            value={fields.full_name} onChange={(e) => updateField("full_name", e.target.value)}
            className={`${authInputClass} ${invalidRingClass}`} />
        </Field>
        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <input id="email" type="email" required autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email", false, fieldErrors)}
            value={fields.email} onChange={(e) => updateField("email", e.target.value)}
            className={`${authInputClass} ${invalidRingClass}`} />
        </Field>
        <Field label="Phone or WhatsApp number" htmlFor="phone" error={fieldErrors.phone}>
          <input id="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="+263 77 123 4567"
            aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={describedBy("phone", false, fieldErrors)}
            value={fields.phone} onChange={(e) => updateField("phone", e.target.value)}
            className={`${authInputClass} ${invalidRingClass}`} />
        </Field>
        <Field label="Town or city" htmlFor="location" error={fieldErrors.location}>
          <input id="location" required maxLength={120} autoComplete="address-level2" placeholder="e.g. Harare"
            aria-invalid={Boolean(fieldErrors.location)} aria-describedby={describedBy("location", false, fieldErrors)}
            value={fields.location} onChange={(e) => updateField("location", e.target.value)}
            className={`${authInputClass} ${invalidRingClass}`} />
        </Field>
      </div>

      <fieldset id="languages" tabIndex={-1} aria-describedby={describedBy("languages", true, fieldErrors)} className="focus:outline-none">
        <legend className={authLabelClass}>Languages you speak</legend>
        <p id="languages-hint" className={`${authHintClass} mt-1`}>You need to speak Shona or Ndebele for this role.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((language) => {
            const checked = fields.languages.includes(language);
            return (
              <label
                key={language}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-landing-pine ${
                  checked ? "bg-landing-mint text-landing-pine ring-landing-pine" : "bg-white text-landing-ink ring-landing-line hover:bg-landing-paper"
                }`}
              >
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleLanguage(language)} />
                {language}
              </label>
            );
          })}
          <input aria-label="Other languages" placeholder="Other" maxLength={60}
            value={fields.other_language} onChange={(e) => updateField("other_language", e.target.value)}
            className="h-10 w-36 rounded-full bg-white px-4 text-sm text-landing-ink ring-1 ring-inset ring-landing-line placeholder:text-landing-muted focus:outline-none focus:ring-2 focus:ring-landing-pine" />
        </div>
        <FieldError id="languages" error={fieldErrors.languages} />
      </fieldset>

      <Field label="CV" htmlFor="cv" hint="PDF or Word document, 5 MB at most." error={fieldErrors.cv}>
        <label
          htmlFor="cv"
          className={`flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-white px-4 text-[15px] ring-inset transition-shadow has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-landing-pine ${
            fieldErrors.cv ? "ring-2 ring-red-600" : "ring-1 ring-landing-line hover:ring-[#D4D0C9]"
          }`}
        >
          <Upload size={16} className="shrink-0 text-landing-muted" aria-hidden="true" />
          <span className={cv ? "truncate text-landing-ink" : "text-landing-muted"}>{cv ? cv.name : "Choose a file"}</span>
          <input id="cv" type="file" required accept=".pdf,.doc,.docx"
            aria-invalid={Boolean(fieldErrors.cv)} aria-describedby={describedBy("cv", true, fieldErrors)}
            onChange={handleCvChange} className="sr-only" />
        </label>
      </Field>

      <Field label="Links to your projects, GitHub or portfolio" htmlFor="portfolio_links"
        hint="One link per line. Tell us briefly what each one is." error={fieldErrors.portfolio_links}>
        <textarea id="portfolio_links" required maxLength={2000}
          aria-invalid={Boolean(fieldErrors.portfolio_links)} aria-describedby={describedBy("portfolio_links", true, fieldErrors)}
          value={fields.portfolio_links} onChange={(e) => updateField("portfolio_links", e.target.value)}
          className={`${textareaClass} ${invalidRingClass}`} />
      </Field>

      <Field label="LinkedIn (optional)" htmlFor="linkedin_url" error={fieldErrors.linkedin_url}>
        <input id="linkedin_url" type="url" maxLength={300} placeholder="https://linkedin.com/in/…"
          aria-invalid={Boolean(fieldErrors.linkedin_url)} aria-describedby={describedBy("linkedin_url", false, fieldErrors)}
          value={fields.linkedin_url} onChange={(e) => updateField("linkedin_url", e.target.value)}
          className={`${authInputClass} ${invalidRingClass}`} />
      </Field>

      <Field label="Preferred pay (optional)" htmlFor="preferred_pay" hint="Per month, in US dollars. A range is fine.">
        <input id="preferred_pay" maxLength={100}
          aria-describedby={describedBy("preferred_pay", true, fieldErrors)}
          value={fields.preferred_pay} onChange={(e) => updateField("preferred_pay", e.target.value)}
          className={authInputClass} />
      </Field>

      <Field label={LLM_QUESTION} htmlFor="llm_project_answer"
        hint={`At least ${MIN_ANSWER_LENGTH} characters. A few paragraphs is plenty. We read every answer.`}
        error={fieldErrors.llm_project_answer}>
        <textarea id="llm_project_answer" required maxLength={5000}
          aria-invalid={Boolean(fieldErrors.llm_project_answer)} aria-describedby={describedBy("llm_project_answer", true, fieldErrors)}
          value={fields.llm_project_answer} onChange={(e) => updateField("llm_project_answer", e.target.value)}
          className={`${textareaClass} ${invalidRingClass} min-h-[200px]`} />
      </Field>

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-[15px] leading-relaxed text-landing-ink">
          <input id="lives_in_zimbabwe" type="checkbox" required
            aria-invalid={Boolean(fieldErrors.lives_in_zimbabwe)} aria-describedby={describedBy("lives_in_zimbabwe", false, fieldErrors)}
            checked={fields.lives_in_zimbabwe} onChange={(e) => updateField("lives_in_zimbabwe", e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-landing-pine" />
          I live in Zimbabwe.
        </label>
        <FieldError id="lives_in_zimbabwe" error={fieldErrors.lives_in_zimbabwe} />
      </div>

      <div>
        <label className="flex items-start gap-3 text-[15px] leading-relaxed text-landing-ink">
          <input id="accepted_privacy" type="checkbox" required
            aria-invalid={Boolean(fieldErrors.accepted_privacy)} aria-describedby={describedBy("accepted_privacy", false, fieldErrors)}
            checked={acceptedPrivacy}
            onChange={(e) => {
              setAcceptedPrivacy(e.target.checked);
              clearFieldError("accepted_privacy");
            }}
            className="mt-1 h-4 w-4 shrink-0 accent-landing-pine" />
          <span>
            I've read the{" "}
            <Link to="/privacy" target="_blank" className="font-medium text-landing-pine underline decoration-landing-line underline-offset-4 hover:decoration-landing-pine">
              privacy notice
            </Link>{" "}
            and agree to V-Vet using my application to assess me for this role.
          </span>
        </label>
        <FieldError id="accepted_privacy" error={fieldErrors.accepted_privacy} />
      </div>

      {errorCount > 0 && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorCount === 1 ? "One answer needs fixing. It's marked above." : `${errorCount} answers need fixing. They're marked above.`}
        </p>
      )}
      {submitError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
        {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {submitLabel}
      </button>
      <div className={`${authHintClass} space-y-1 text-center`}>
        <p>After you apply, we'll email you a short coding task straight away.</p>
        <p>
          Questions about the role? Email{" "}
          <a href={CAREERS_MAILTO} className="font-medium text-landing-pine underline decoration-landing-line underline-offset-4 hover:decoration-landing-pine">
            {PARTNER_EMAIL}
          </a>
          .
        </p>
      </div>
    </form>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-2 text-sm font-medium text-red-700">
      {error}
    </p>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className={authLabelClass}>
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${htmlFor}-hint`} className={authHintClass}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
