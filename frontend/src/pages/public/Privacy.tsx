import { PARTNER_EMAIL, PageHero, PublicPage } from "@/components/landing/Site";

// Keep this page in step with what the product actually collects and which services it uses.
// It should be reviewed by someone who knows Zimbabwe's Cyber and Data Protection Act before launch.
const LAST_UPDATED = "2 November 2026";

type Section = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

const SECTIONS: Section[] = [
  {
    title: "Who we are",
    paragraphs: [
      `V-Vet runs a livestock health service for farmers in Zimbabwe, mostly through WhatsApp, and the website at vvet.org. In this notice, "we" means V-Vet. If you have any questions about your information, email ${PARTNER_EMAIL}.`,
    ],
  },
  {
    title: "If you use V-Vet as a farmer",
    paragraphs: ["When you chat with V-Vet on WhatsApp or use the web app, we collect:"],
    items: [
      "Your name, phone number, district and farm details.",
      "The messages, voice notes and photos you send us.",
      "Records about your animals, such as births, deaths, illnesses, treatments and vaccinations.",
      "What a vet decides about a case you send them.",
    ],
  },
  {
    title: "If you apply for a job",
    paragraphs: ["When you apply through our careers page, we collect:"],
    items: [
      "Your name, email address, phone number and town.",
      "The languages you speak.",
      "Your CV, links to your work and your LinkedIn profile if you share it.",
      "Your answers on the form, and the coding task you send back.",
    ],
  },
  {
    title: "How we use it",
    items: [
      "To understand what's wrong with an animal, work out how urgent it is, and get the case to a vet when needed.",
      "To keep each animal's record, send reminders and check back on how an animal is doing.",
      "To improve how V-Vet asks questions and decides what to do. Vets review these changes.",
      "For job applications: only to decide whether to hire you, and to contact you about your application.",
    ],
  },
  {
    title: "Who we share it with",
    paragraphs: [
      "We never sell your information. We share it only where we need to:",
    ],
    items: [
      "With vets, when a case needs their review. They see the case and the animal's history.",
      "With the government veterinary services, when the law requires us to report certain animal diseases.",
      "With the services that run V-Vet: Meta (WhatsApp), OpenAI and ElevenLabs (understanding messages and voice notes), Supabase (storing photos), Microsoft Azure (our servers), Vercel (our website) and Google (email).",
    ],
  },
  {
    title: "Where it's stored",
    paragraphs: [
      "Some of the services above store information outside Zimbabwe. We only use services that protect it with security measures such as encryption, and we keep access within our team to the people who need it.",
    ],
  },
  {
    title: "How long we keep it",
    items: [
      "Farmer and animal records: for as long as you use V-Vet. If you ask us to delete your account, we delete your information, apart from anything the law requires us to keep.",
      "Job applications: for up to 6 months after we make a decision on the role, then we delete them. If you'd like us to keep your application for future roles, tell us.",
    ],
  },
  {
    title: "Your rights",
    paragraphs: [
      `Under Zimbabwe's Cyber and Data Protection Act, you can ask to see the information we hold about you, ask us to correct it, or ask us to delete it. You can also object to how we use it. Email ${PARTNER_EMAIL} and we'll reply within 30 days. If you're not happy with our answer, you can complain to the Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ), which oversees data protection.`,
    ],
  },
  {
    title: "Changes to this notice",
    paragraphs: [
      "If we change how we use your information, we'll update this page and the date below. For bigger changes, we'll tell farmers on WhatsApp.",
    ],
  },
];

export default function Privacy() {
  return (
    <PublicPage>
      <PageHero
        title="Privacy notice"
        lead="What information V-Vet collects, why we need it, and what you can ask us to do with it."
      />
      <section className="px-4 py-16 sm:px-6 md:py-24">
        <div className="mx-auto max-w-[720px] space-y-12">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.01em] text-landing-ink sm:text-[1.75rem]">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-[16px] leading-relaxed text-landing-muted">
                  {paragraph}
                </p>
              ))}
              {section.items && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[16px] leading-relaxed text-landing-muted marker:text-landing-pine">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <p className="border-t border-landing-line pt-6 text-sm text-landing-muted">Last updated {LAST_UPDATED}.</p>
        </div>
      </section>
    </PublicPage>
  );
}
