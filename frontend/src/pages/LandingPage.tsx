import { Link } from "react-router-dom";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import {
  ArrowRight,
  HeartPulse,
  Play,
  TrendingDown,
  Wallet,
  Languages,
  LogIn,
  Mail,
  Mic,
  Smartphone,
  Stethoscope,
  History,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import farmerCheckImage from "@/assets/problem-farmer-check.webp";
import farmerPhoneImage from "@/assets/help-farmer-phone.webp";
import farmerImage from "@/assets/landing-hero.jpg";
import whatsappScreenshot from "@/assets/whatsapp-screenshot.jpg";
import TriageDemo from "@/components/landing/TriageDemo";
import {
  ExampleChip,
  HeroCasePanel,
  RegistrationForm,
  VetQueue,
} from "@/components/landing/CaseVisuals";
import { AwardList } from "@/components/landing/Awards";
import WhatsAppIcon from "@/components/landing/WhatsAppIcon";
import {
  Accent,
  CheckList,
  ClosingBand,
  PARTNER_EMAIL,
  PARTNER_MAILTO,
  PublicPage,
  WHATSAPP_LINK,
  balance,
  pillPrimary,
  pillPrimaryOnDark,
  pillSecondary,
  pillSecondaryOnDark,
  sectionHeading,
} from "@/components/landing/Site";

const TRUST_MARQUEE = [
  { icon: Languages, label: "Shona, Ndebele and English" },
  { icon: Mic, label: "Voice notes, photos or text" },
  { icon: Smartphone, label: "No app to download" },
  { icon: Stethoscope, label: "Vet-reviewed escalation" },
  { icon: History, label: "Full animal history" },
  { icon: ShieldCheck, label: "Every alert explains why" },
];

const FARMER_CAN_SEND = [
  "Text messages",
  "Voice notes",
  "Photos of the animal",
  "In Shona, Ndebele or English",
];

const LOSSES = [
  { icon: HeartPulse, label: "Animal deaths" },
  { icon: TrendingDown, label: "Reduced productivity" },
  { icon: Wallet, label: "Lost income" },
];

const HOW_VVET_HELPS = [
  "Recognise potential livestock health problems",
  "Access AI-assisted guidance",
  "Understand when veterinary attention is needed",
];

const VET_GETS = [
  "Cases sorted by urgency",
  "Symptoms, photos and voice notes in one place",
  "The animal's record: births, treatments and past cases",
  "A way to send the diagnosis, treatment plan and follow-up date back to the farmer",
];

function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const entrance = (delay: number): MotionProps =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section id="top" className="relative bg-[linear-gradient(166deg,#1B6549_0%,#112111_100%)] text-white">
      <div className="relative mx-auto flow-root max-w-[1160px] px-4 pb-8 pt-28 text-center sm:px-6 md:pb-[72px] md:pt-[132px]">
        <motion.h1
          {...entrance(0)}
          className="mx-auto max-w-[24ch] font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl md:text-[4.25rem]"
          style={balance}
        >
          Animal health, <br className="hidden sm:block" />
          <span className="text-landing-leaf">one WhatsApp message</span> away.
        </motion.h1>

        <motion.p
          {...entrance(0.08)}
          className="mx-auto mt-5 max-w-[58ch] text-[17px] leading-relaxed text-white/85 md:text-lg"
          style={{ textWrap: "pretty" } as React.CSSProperties}
        >
          Report a sick livestock, reach a vet when it matters, and manage a more productive herd
          through whatsapp using your local language.
        </motion.p>

        <motion.div
          {...entrance(0.16)}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a href={PARTNER_MAILTO} className={pillPrimaryOnDark}>
            Partner with us
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={pillSecondaryOnDark}>
            <WhatsAppIcon size={16} />
            Start on WhatsApp
          </a>
        </motion.div>

        <motion.p {...entrance(0.22)} className="mt-5 text-sm text-white/75">
          <a href="#awards" className="underline decoration-white/30 underline-offset-4 hover:decoration-white">
            Winner of NVIDIA AI Day, Henley Business School and Just Imagine If 2026
          </a>
        </motion.p>

        <motion.div {...entrance(0.3)} className="mx-auto mt-7 max-w-[1000px] md:mt-12">
          <HeroCasePanel />
        </motion.div>
      </div>
    </section>
  );
}

function TrustMarquee() {
  const doubled = [...TRUST_MARQUEE, ...TRUST_MARQUEE];
  return (
    <div className="group overflow-hidden border-b border-landing-line py-7">
      <ul className="flex w-max animate-marquee gap-14 group-hover:[animation-play-state:paused]">
        {doubled.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            aria-hidden={index >= TRUST_MARQUEE.length}
            className="flex items-center gap-2.5 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.14em] text-landing-ink"
          >
            <item.icon size={18} strokeWidth={1.75} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProblemCollage() {
  return (
    <div className="relative pb-8 pt-8">
      <div className="absolute inset-y-0 left-[30%] right-0 rounded-[28px] bg-landing-rose" aria-hidden="true" />
      <figure className="relative h-[400px] w-[72%] overflow-hidden rounded-[24px] shadow-[0_30px_50px_-24px_rgba(17,33,17,0.5)] sm:h-[470px]">
        <img
          src={farmerCheckImage}
          alt="A farmer crouching in a kraal, checking the neck of a cow with a concerned expression"
          className="h-full w-full object-cover object-[50%_30%]"
        />
        <figcaption className="absolute bottom-3 left-3">
          {/* <ExampleChip label="Illustrative photo" /> */}
        </figcaption>
      </figure>
      <ul className="absolute bottom-14 right-3 w-[46%] space-y-2.5 sm:right-5 sm:w-[44%]">
        {LOSSES.map((loss) => (
          <li
            key={loss.label}
            className="flex items-center gap-2.5 rounded-2xl bg-white p-2.5 text-sm font-semibold leading-snug text-landing-ink shadow-[0_16px_40px_-18px_rgba(17,33,17,0.45)] ring-1 ring-black/5 sm:gap-3 sm:p-3 sm:text-[15px]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-landing-rose sm:h-9 sm:w-9">
              <loss.icon size={17} strokeWidth={1.75} aria-hidden="true" />
            </span>
            {loss.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function HelpCollage() {
  return (
    <div className="relative pb-8 pt-8">
      <div className="absolute inset-y-0 left-[30%] right-0 rounded-[28px] bg-landing-mint" aria-hidden="true" />
      <span className="absolute right-4 top-4">
        <ExampleChip label="Example case" />
      </span>
      <figure className="relative h-[400px] w-[72%] overflow-hidden rounded-[24px] shadow-[0_30px_50px_-24px_rgba(17,33,17,0.5)] sm:h-[470px]">
        <img
          src={farmerPhoneImage}
          alt="A farmer outdoors recording a message on a smartphone, with cattle grazing behind"
          className="h-full w-full object-cover object-[45%_25%]"
        />
        <figcaption className="absolute bottom-3 left-3">
          <ExampleChip label="Illustrative photo" />
        </figcaption>
      </figure>
      <div className="absolute bottom-14 right-3 w-[52%] space-y-2.5 sm:right-5 sm:w-[48%]">
        <div className="rounded-2xl rounded-tr-md bg-[#D9FDD3] p-3 text-[13px] leading-snug text-landing-ink shadow-[0_16px_40px_-18px_rgba(17,33,17,0.45)]">
          <div className="mb-1.5 flex items-center gap-1.5" aria-hidden="true">
            <Play size={11} fill="currentColor" className="text-landing-pine" />
            <span className="h-[3px] flex-1 rounded-full bg-landing-ink/25" />
            <span className="text-xs text-[#4A5F4A]">0:23</span>
          </div>
          “My cow Shumba has not eaten since yesterday.”
        </div>
        <div className="rounded-2xl rounded-tl-md bg-white p-3 shadow-[0_16px_40px_-18px_rgba(17,33,17,0.45)] ring-1 ring-black/5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" aria-hidden="true" />
            High risk
          </span>
          <p className="mt-2 text-[13px] font-medium leading-snug text-landing-ink">
            A vet should see this case today.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProblemSection() {
  return (
    <section className="overflow-hidden px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto max-w-[1100px] space-y-24 md:space-y-32">
        <div className="relative grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div
            className="pointer-events-none absolute -right-32 -top-24 h-[560px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(242,230,236,0.9),rgba(242,230,236,0))]"
            aria-hidden="true"
          />
          <div className="relative">
            {/* <p className="text-[15px] font-semibold text-landing-muted">The problem</p> */}
            <h2 className={`${sectionHeading} mt-4`} style={balance}>
              Livestock losses are costing farmers <Accent>their livelihoods.</Accent>
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-landing-muted">
              Across sub-Saharan Africa, livestock diseases and limited access to timely veterinary
              services contribute to animal deaths, reduced productivity, and lost income. For
              millions of smallholder farmers, these challenges threaten their livelihoods and food
              security.
            </p>
          </div>
          <div className="relative">
            <ProblemCollage />
          </div>
        </div>
{/* 
        <div className="relative grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div
            className="pointer-events-none absolute -left-32 -top-24 h-[560px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgba(222,237,224,0.8),rgba(222,237,224,0))]"
            aria-hidden="true"
          />
          <div className="relative md:order-last">
            <p className="text-[15px] font-semibold text-landing-pine">How V-Vet helps</p>
            <h2 className={`${sectionHeading} mt-4`} style={balance}>
              Better livestock health starts with <Accent>better access to guidance.</Accent>
            </h2>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-landing-muted">
              V-Vet helps smallholder farmers recognise potential livestock health problems, access
              AI-assisted guidance, and understand when veterinary attention is needed. Through
              WhatsApp-based support and animal health records, V-Vet aims to help farmers make more
              informed decisions about their herds.
            </p>
            <div className="mt-7 hidden md:block">
              <CheckList items={HOW_VVET_HELPS} />
            </div>
          </div>
          <div className="relative">
            <HelpCollage />
          </div>
        </div> */}
      </div>
    </section>
  );
}

function FarmersSection() {
  return (
    <section id="farmers" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-start gap-x-16 gap-y-10 md:grid-cols-[5fr_7fr]">
        <div className="md:col-start-2 md:row-start-1">
          <h2 className={sectionHeading} style={balance}>
            Farmers use V-Vet <Accent>in their own words</Accent>
          </h2>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-landing-muted">
            V-Vet works inside WhatsApp. Farmers can reach it by text, voice note or photo, in
            Shona, Ndebele or English, with no new app to learn.
          </p>
        </div>

        <div className="md:col-start-1 md:row-span-2 md:row-start-1">
          <div className="relative flex h-[372px] items-end justify-center overflow-hidden rounded-[28px] bg-landing-mint pt-10">
            <div className="w-[230px] rounded-t-[36px] bg-[#111] p-2 pb-0 shadow-[0_30px_50px_-24px_rgba(17,33,17,0.6)]">
              <img
                src={whatsappScreenshot}
                alt="The V-Vet welcome message in WhatsApp, inviting the farmer to set up their farm"
                className="h-[322px] w-full rounded-t-[28px] object-cover object-top"
              />
            </div>
          </div>
          <div className="mt-8">
            <h3 className="font-display text-xl font-semibold text-landing-ink">What a farmer can send</h3>
            <div className="mt-4">
              <CheckList items={FARMER_CAN_SEND} />
            </div>
          </div>
        </div>

        <div className="md:col-start-2 md:row-start-2">
          <h3 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-landing-ink">
            Registering an animal takes one message
          </h3>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-landing-muted">
            Interactive WhatsApp forms collect an animal's details in one step, so farmers aren't
            asked question after question. Each animal gets its own tag and record.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-[1.1fr_1fr]">
            <figure className="relative overflow-hidden rounded-[24px] bg-landing-sand">
              <img
                src={farmerImage}
                alt="Illustrative photo of a smallholder farmer with a cow"
                className="h-full min-h-[300px] w-full object-cover object-[50%_25%]"
              />
              <figcaption className="absolute bottom-3 left-3">
                {/* <ExampleChip label="Illustrative photo" /> */}
              </figcaption>
            </figure>
            <div className="relative flex flex-col justify-end rounded-[24px] bg-landing-sky p-4 pt-12">
              <span className="absolute right-3 top-3">
                <ExampleChip />
              </span>
              <RegistrationForm />
            </div>
          </div>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={`${pillPrimary} mt-7`}>
            <WhatsAppIcon size={16} />
            Start on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function TriageSection() {
  return (
    <section id="triage" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={balance}>
            Decisions, <Accent>not just records</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-[17px] leading-relaxed text-landing-muted">
            Every report goes through the same triage. V&#8209;Vet weighs how confident it is against
            what's at stake, then picks the safest next step: advice to monitor, a few more
            questions, or a vet.
          </p>
        </div>
        <div className="mt-14">
          <TriageDemo />
        </div>
      </div>
    </section>
  );
}

function VetsSection() {
  return (
    <section id="vets" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-14 md:grid-cols-[6fr_5fr] md:gap-16">
        <div>
          <h2 className={sectionHeading} style={balance}>
            Vets get every case <Accent>with its history</Accent>
          </h2>
          <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            V-Vet doesn't replace vets. It helps each vet reach more farmers, faster, and arrive
            already knowing the animal.
          </p>
          <div className="mt-8">
            <CheckList items={VET_GETS} />
          </div>
        </div>
        <div className="relative rounded-[28px] bg-landing-rose p-6 sm:p-10">
          <span className="absolute right-4 top-4">
            <ExampleChip />
          </span>
          <div className="pt-6">
            <VetQueue />
          </div>
        </div>
      </div>
    </section>
  );
}

function GroundworkSection() {
  return (
    <section className="px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] gap-4 md:grid-cols-2">
        <article className="flex flex-col overflow-hidden rounded-[24px] bg-landing-paper sm:flex-row">
          <div className="flex items-center justify-center bg-landing-mint p-6 sm:w-[42%]">
            <ul className="w-full max-w-[180px] space-y-2 text-sm">
              {["Dipping", "Deworming", "Vaccination"].map((task, index) => (
                <li
                  key={task}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-landing-ink ring-1 ring-black/5"
                >
                  {task}
                  <span className="text-xs text-landing-muted">{["Fri", "2 wks", "Mar"][index]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-6 sm:p-7">
            <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
              Prevention, <Accent>not only reaction</Accent>
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-landing-muted">
              Cattle management starts before an animal gets sick. Farmers get reminders for
              vaccination, dipping, deworming, weaning and bull soundness before they're due.
            </p>
          </div>
        </article>

        <article className="flex flex-col overflow-hidden rounded-[24px] bg-landing-paper sm:flex-row">
          <div className="flex items-center justify-center bg-landing-sand p-6 sm:w-[42%]">
            <ul className="w-full max-w-[180px] space-y-2 text-sm">
              {["Breeding", "Calving", "Herd insights"].map((topic) => (
                <li
                  key={topic}
                  className="rounded-xl bg-white px-3 py-2 text-landing-ink ring-1 ring-black/5"
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-6 sm:p-7">
            <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
              Productive herds, <Accent>informed farmers</Accent>
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-landing-muted">
              Breeding management, calving preparation and practical livestock knowledge, informed
              by each herd's own records, help farmers make decisions that boost productivity.
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}

function AwardsSection() {
  return (
    <section id="awards" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={balance}>
            Recognised by <Accent>names you know</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            V-Vet has won three competitions. The most recent is funding our first pilot with
            farmers in Zimbabwe.
          </p>
        </div>

        <div className="mt-14">
          <AwardList />
        </div>

        <div className="mt-10 text-center">
          <Link to="/journey" className={pillSecondary}>
            See our journey so far
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function StartSection() {
  return (
    <section id="start" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 rounded-[28px] bg-landing-paper p-6 sm:p-10 md:grid-cols-[7fr_5fr] md:p-14">
        <div>
          <h2 className={sectionHeading} style={balance}>
            Farmers and vets, <Accent>start here</Accent>
          </h2>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-landing-muted">
            Scan the code or tap the button to say hello on WhatsApp. Your phone number becomes your
            account. Already registered? Sign in to the web app.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={pillPrimary}>
              <WhatsAppIcon size={16} />
              Chat on WhatsApp
            </a>
            <Link to="/login" className={pillSecondary}>
              <LogIn size={16} aria-hidden="true" />
              Sign in
            </Link>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm text-landing-muted ring-1 ring-landing-line">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            V-Vet is in its pre-pilot stage
          </p>
        </div>

        <div className="flex justify-center">
          <div className="rounded-[24px] bg-landing-mint p-6 text-center">
            <div className="rounded-[18px] bg-white p-4">
              <QRCodeSVG
                value={WHATSAPP_LINK}
                size={168}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#112111"
                aria-label="QR code that opens a WhatsApp chat with V-Vet"
                role="img"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-landing-pine">Scan to chat on WhatsApp</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerSection() {
  return (
    <ClosingBand
      title={
        <>
          Help us take <span className="whitespace-nowrap">V-Vet</span>{" "}
          <span className="text-landing-leaf">to more farmers</span>
        </>
      }
      lead="Our first pilot in Zimbabwe is funded and being prepared. We'd like to hear from NGOs, programmes, vets and funders who want to help it reach further."
    >
      <a href={PARTNER_MAILTO} className={pillPrimaryOnDark}>
        <Mail size={16} aria-hidden="true" />
        Email {PARTNER_EMAIL}
      </a>
    </ClosingBand>
  );
}

export default function LandingPage() {
  return (
    <PublicPage>
      <Hero />
      <TrustMarquee />
      <ProblemSection />
      <FarmersSection />
      <TriageSection />
      <VetsSection />
      <GroundworkSection />
      <AwardsSection />
      <StartSection />
      <PartnerSection />
    </PublicPage>
  );
}
