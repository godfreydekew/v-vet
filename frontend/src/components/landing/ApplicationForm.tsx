import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { authHintClass, authInputClass, authLabelClass, authSubmitClass } from "@/components/landing/AuthShell";
import { careersService } from "@/lib/services/careers.service";
import { getApiError } from "@/lib/api";

const LANGUAGE_OPTIONS = ["English", "Shona", "Ndebele"];
const MAX_CV_BYTES = 5 * 1024 * 1024;
const MIN_ANSWER_LENGTH = 50;
export const LLM_QUESTION =
  "Tell us about something you built on top of an LLM. What went wrong, and how did you fix it?";

const textareaClass = authInputClass.replace("h-12", "min-h-[120px] py-3 leading-relaxed");

export default function ApplicationForm({ roleId }: { roleId: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [otherLanguage, setOtherLanguage] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [preferredPay, setPreferredPay] = useState("");
  const [answer, setAnswer] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [livesInZimbabwe, setLivesInZimbabwe] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [website, setWebsite] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const speaksRequiredLanguage =
    languages.includes("Shona") || languages.includes("Ndebele") || /shona|ndebele/i.test(otherLanguage);

  function toggleLanguage(language: string) {
    setLanguages((current) =>
      current.includes(language) ? current.filter((l) => l !== language) : [...current, language],
    );
  }

  function handleCvChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_CV_BYTES) {
      setError("Your CV must be 5 MB or smaller.");
      event.target.value = "";
      setCv(null);
      return;
    }
    setError(null);
    setCv(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!cv) {
      setError("Please attach your CV.");
      return;
    }
    if (answer.trim().length < MIN_ANSWER_LENGTH) {
      setError("Please tell us a little more in your answer about building with an LLM.");
      return;
    }
    if (!speaksRequiredLanguage) {
      setError("This role needs someone who speaks Shona or Ndebele.");
      return;
    }
    if (!livesInZimbabwe) {
      setError("This role is only open to people living in Zimbabwe.");
      return;
    }
    if (!acceptedPrivacy) {
      setError("Please confirm you've read the privacy notice.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await careersService.submitApplication({
        role: roleId,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        languages: [...languages, otherLanguage.trim()].filter(Boolean).join(", "),
        portfolio_links: portfolioLinks.trim(),
        llm_project_answer: answer.trim(),
        linkedin_url: linkedinUrl.trim(),
        preferred_pay: preferredPay.trim(),
        lives_in_zimbabwe: livesInZimbabwe,
        accepted_privacy_notice: acceptedPrivacy,
        cv,
        website,
      });
      setSubmittedEmail(email.trim());
    } catch (err) {
      setError(getApiError(err));
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name">
          <input id="full_name" required minLength={2} maxLength={120} autoComplete="name"
            value={fullName} onChange={(e) => setFullName(e.target.value)} className={authInputClass} />
        </Field>
        <Field label="Email" htmlFor="email">
          <input id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} />
        </Field>
        <Field label="Phone or WhatsApp number" htmlFor="phone">
          <input id="phone" type="tel" required minLength={7} maxLength={30} autoComplete="tel" placeholder="+263 77 123 4567"
            value={phone} onChange={(e) => setPhone(e.target.value)} className={authInputClass} />
        </Field>
        <Field label="Town or city" htmlFor="location">
          <input id="location" required minLength={2} maxLength={120} autoComplete="address-level2" placeholder="e.g. Harare"
            value={location} onChange={(e) => setLocation(e.target.value)} className={authInputClass} />
        </Field>
      </div>

      <fieldset>
        <legend className={authLabelClass}>Languages you speak</legend>
        <p className={`${authHintClass} mt-1`}>You need to speak Shona or Ndebele for this role.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((language) => {
            const checked = languages.includes(language);
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
            value={otherLanguage} onChange={(e) => setOtherLanguage(e.target.value)}
            className="h-10 w-36 rounded-full bg-white px-4 text-sm text-landing-ink ring-1 ring-inset ring-landing-line placeholder:text-landing-muted focus:outline-none focus:ring-2 focus:ring-landing-pine" />
        </div>
      </fieldset>

      <Field label="CV" htmlFor="cv" hint="PDF or Word document, 5 MB at most.">
        <label
          htmlFor="cv"
          className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-white px-4 text-[15px] ring-1 ring-inset ring-landing-line transition-shadow hover:ring-[#D4D0C9] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-landing-pine"
        >
          <Upload size={16} className="shrink-0 text-landing-muted" aria-hidden="true" />
          <span className={cv ? "truncate text-landing-ink" : "text-landing-muted"}>{cv ? cv.name : "Choose a file"}</span>
          <input id="cv" type="file" required accept=".pdf,.doc,.docx" onChange={handleCvChange} className="sr-only" />
        </label>
      </Field>

      <Field label="Links to your projects, GitHub or portfolio" htmlFor="portfolio_links" hint="One link per line. Tell us briefly what each one is.">
        <textarea id="portfolio_links" required minLength={5} maxLength={2000}
          value={portfolioLinks} onChange={(e) => setPortfolioLinks(e.target.value)} className={textareaClass} />
      </Field>

      <Field label="LinkedIn (optional)" htmlFor="linkedin_url">
        <input id="linkedin_url" type="url" maxLength={300} placeholder="https://linkedin.com/in/…"
          value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className={authInputClass} />
      </Field>

      <Field label="Preferred pay (optional)" htmlFor="preferred_pay" hint="Per month, in US dollars. A range is fine.">
        <input id="preferred_pay" maxLength={100}
          value={preferredPay} onChange={(e) => setPreferredPay(e.target.value)} className={authInputClass} />
      </Field>

      <Field label={LLM_QUESTION} htmlFor="llm_project_answer" hint="A few paragraphs is plenty. We read every answer.">
        <textarea id="llm_project_answer" required minLength={MIN_ANSWER_LENGTH} maxLength={5000}
          value={answer} onChange={(e) => setAnswer(e.target.value)} className={`${textareaClass} min-h-[200px]`} />
      </Field>

      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-landing-ink">
        <input type="checkbox" required checked={livesInZimbabwe} onChange={(e) => setLivesInZimbabwe(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-landing-pine" />
        I live in Zimbabwe.
      </label>

      <label className="flex items-start gap-3 text-[15px] leading-relaxed text-landing-ink">
        <input type="checkbox" required checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-landing-pine" />
        <span>
          I've read the{" "}
          <Link to="/privacy" target="_blank" className="font-medium text-landing-pine underline decoration-landing-line underline-offset-4 hover:decoration-landing-pine">
            privacy notice
          </Link>{" "}
          and agree to V-Vet using my application to assess me for this role.
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={authSubmitClass}>
        {isSubmitting && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {isSubmitting ? "Sending your application…" : "Send application"}
      </button>
      <p className={`${authHintClass} text-center`}>
        After you apply, we'll email you a short coding task straight away.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className={authLabelClass}>
        {label}
      </label>
      {children}
      {hint && <p className={authHintClass}>{hint}</p>}
    </div>
  );
}
