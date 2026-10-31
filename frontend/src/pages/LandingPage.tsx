import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, type MotionProps } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Languages,
  LogIn,
  Mail,
  MapPinned,
  MessageCircle,
  Mic,
  Smartphone,
  Stethoscope,
  History,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import farmerImage from "@/assets/landing-hero.jpg";
import whatsappScreenshot from "@/assets/whatsapp-screenshot.jpg";
import TriageDemo from "@/components/landing/TriageDemo";
import {
  ExampleChip,
  HeroCasePanel,
  RegistrationForm,
  VetQueue,
} from "@/components/landing/CaseVisuals";

const WHATSAPP_LINK = "https://wa.me/447519132951?text=Hello";
const PARTNER_EMAIL = "info@vvet.org";
const PARTNER_MAILTO = `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent("Partnering with V-Vet")}`;

const NAV_LINKS = [
  { label: "How it works", href: "#farmers" },
  { label: "Triage", href: "#triage" },
  { label: "For vets", href: "#vets" },
  { label: "Awards", href: "#awards" },
];

const TRUST_MARQUEE = [
  { icon: Languages, label: "Shona, Ndebele and English" },
  { icon: Mic, label: "Voice notes, photos or text" },
  { icon: Smartphone, label: "No app to download" },
  { icon: Stethoscope, label: "Vet-reviewed escalation" },
  { icon: History, label: "Full animal history" },
  { icon: ShieldCheck, label: "Every alert explains why" },
];

const FARMER_CAN_SEND = [
  "Voice notes, photos or text",
  "In Shona, Ndebele or English",
  "Their phone number is their login",
  "An estimated age when the birth date is unknown",
];

const VET_GETS = [
  "Cases sorted by urgency",
  "Symptoms, photos and voice notes in one place",
  "The animal's record: births, treatments and past cases",
  "A way to send the diagnosis, treatment plan and follow-up date back to the farmer",
];

type Award = {
  name: string;
  result: string;
  detail?: string;
  link?: string;
  tileClass: string;
};

const AWARDS: Award[] = [
  {
    name: "NVIDIA AI Day Competition",
    result: "Winner, awarded an NVIDIA DGX Spark AI supercomputer.",
    detail: "Sponsored by NVIDIA, Henley Business School, SCG and Softcat.",
    tileClass: "bg-landing-mint",
  },
  {
    name: "Henley Business School Student Business Idea Competition",
    result: "First place, with £2,000 for V-Vet.",
    link: "https://live.henley.ac.uk/news/13206940",
    tileClass: "bg-landing-sky",
  },
  {
    name: "Just Imagine If 2026, University of Reading",
    result: "Winner, with £5,000 to run V-Vet's first pilot programme.",
    link: "https://www.reading.ac.uk/just-imagine-if/2026-winners",
    tileClass: "bg-landing-sand",
  },
];

const CLOSING_POINTS = [
  { icon: Stethoscope, label: "Vets stay in the loop" },
  { icon: Languages, label: "Built for local languages" },
  { icon: MessageCircle, label: "Works inside WhatsApp" },
  { icon: MapPinned, label: "Starting in Zimbabwe" },
];

const pillPrimaryOnDark =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-landing-forest transition-colors hover:bg-landing-mint";
const pillSecondaryOnDark =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white ring-1 ring-inset ring-white/35 transition-colors hover:bg-white/10";
const pillPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-landing-button px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-landing-pine";
const pillSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-landing-ink ring-1 ring-inset ring-landing-line transition-colors hover:bg-landing-paper";

const sectionHeading =
  "font-display text-[2.125rem] font-semibold leading-[1.1] tracking-[-0.02em] text-landing-ink sm:text-[2.75rem] md:text-5xl";

function Accent({ children }: { children: React.ReactNode }) {
  return <span className="text-landing-accent">{children}</span>;
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-landing-ink">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-landing-button text-white">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={
        isScrolled
          ? "fixed inset-x-0 top-0 z-50 border-b border-landing-line bg-white/90 backdrop-blur-md transition-colors"
          : "fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent transition-colors"
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center" aria-label="V-Vet home">
          <span
            className={
              isScrolled
                ? "font-display text-xl font-bold tracking-tight text-landing-ink"
                : "font-display text-xl font-bold tracking-tight text-white"
            }
          >
            V-Vet
          </span>
        </a>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                isScrolled
                  ? "text-[15px] font-medium text-landing-muted transition-colors hover:text-landing-ink"
                  : "text-[15px] font-medium text-white/80 transition-colors hover:text-white"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/login"
            className={
              isScrolled
                ? "hidden text-[15px] font-medium text-landing-ink sm:inline"
                : "hidden text-[15px] font-medium text-white sm:inline"
            }
          >
            Sign in
          </Link>
          <a
            href={PARTNER_MAILTO}
            className={
              isScrolled
                ? "rounded-full bg-landing-button px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-landing-pine"
                : "rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-landing-forest transition-colors hover:bg-landing-mint"
            }
          >
            Partner with us
          </a>
        </div>
      </div>
    </header>
  );
}

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
          style={{ textWrap: "balance" } as React.CSSProperties}
        >
          Animal health, <br className="hidden sm:block" />
          <span className="text-landing-leaf">one WhatsApp message</span> away.
        </motion.h1>

        <motion.p
          {...entrance(0.08)}
          className="mx-auto mt-5 max-w-[58ch] text-[17px] leading-relaxed text-white/85 md:text-lg"
          style={{ textWrap: "pretty" } as React.CSSProperties}
        >
          V-Vet helps smallholder farmers in Zimbabwe report a sick animal by voice note, photo or
          text, get clear next steps, and reach a vet when it matters.
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

function FarmersSection() {
  return (
    <section id="farmers" className="scroll-mt-24 px-4 py-24 sm:px-6 md:py-32">
      <div className="mx-auto grid max-w-[1100px] items-start gap-14 md:grid-cols-[5fr_7fr] md:gap-16">
        <div className="md:order-last md:pt-6">
          <h2 className={sectionHeading} style={{ textWrap: "balance" } as React.CSSProperties}>
            Farmers report a sick animal <Accent>in their own words</Accent>
          </h2>
          <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-landing-muted">
            V-Vet works inside WhatsApp, so reporting a problem takes a voice note, not a form or a
            new app.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-[1.1fr_1fr]">
            <figure className="relative overflow-hidden rounded-[24px] bg-landing-sand">
              <img
                src={farmerImage}
                alt="Illustrative photo of a smallholder farmer with her cow"
                className="h-full min-h-[300px] w-full object-cover object-[50%_25%]"
              />
              <figcaption className="absolute bottom-3 left-3">
                <ExampleChip label="Illustrative photo" />
              </figcaption>
            </figure>
            <div className="relative flex flex-col justify-end rounded-[24px] bg-landing-sky p-4 pt-12">
              <span className="absolute right-3 top-3">
                <ExampleChip />
              </span>
              <RegistrationForm />
            </div>
          </div>

          <h3 className="mt-14 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.01em] text-landing-ink">
            Registering an animal takes one message
          </h3>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-landing-muted">
            Interactive WhatsApp forms collect an animal's details in one step, so farmers aren't
            asked question after question. Each animal gets a tag that links it to its district.
          </p>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={`${pillPrimary} mt-7`}>
            Start on WhatsApp
          </a>
        </div>

        <div>
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

      </div>
    </section>
  );
}

function TriageSection() {
  return (
    <section id="triage" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="mx-auto max-w-[720px] text-center">
          <h2 className={sectionHeading} style={{ textWrap: "balance" } as React.CSSProperties}>
            Decisions, <Accent>not just records</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-[17px] leading-relaxed text-landing-muted">
            Every report goes through the same triage. V-Vet weighs how confident it is against
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
          <h2 className={sectionHeading} style={{ textWrap: "balance" } as React.CSSProperties}>
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
              Reminders for vaccination, dipping, deworming, weaning and bull soundness, sent before
              they're due.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-landing-pine ring-1 ring-landing-line">
              <CalendarClock size={12} aria-hidden="true" /> Coming next
            </span>
          </div>
        </article>

        <article className="flex flex-col overflow-hidden rounded-[24px] bg-landing-paper sm:flex-row">
          <div className="flex items-center justify-center bg-landing-sand p-6 sm:w-[42%]">
            <ul className="grid w-full max-w-[180px] grid-cols-2 gap-2 text-center">
              {[
                ["BIN", "Bindura"],
                ["BIA", "Binga"],
                ["CHK", "Chikomba"],
                ["GWE", "Gweru"],
              ].map(([code, district]) => (
                <li key={code} className="rounded-xl bg-white px-2 py-2 ring-1 ring-black/5">
                  <span className="block text-sm font-bold tracking-wide text-landing-ink">{code}</span>
                  <span className="block text-[11px] text-landing-muted">{district}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 p-6 sm:p-7">
            <h3 className="font-display text-[1.375rem] font-semibold leading-snug text-landing-ink">
              Organised by <Accent>district and ward</Accent>
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-landing-muted">
              Every farm and animal is tied to its district, and field agents onboard farmers in
              person before each launch.
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
          <h2 className={sectionHeading} style={{ textWrap: "balance" } as React.CSSProperties}>
            Recognised <Accent>before the pilot</Accent>
          </h2>
          <p className="mx-auto mt-5 max-w-[56ch] text-[17px] leading-relaxed text-landing-muted">
            V-Vet has won three pitch competitions. The most recent award funds our first pilot
            with farmers.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {AWARDS.map((award) => (
            <li key={award.name} className={`flex flex-col rounded-[24px] ${award.tileClass}`}>
              <div className="flex flex-1 flex-col p-7">
                <h3 className="font-display text-xl font-semibold leading-snug text-landing-ink">{award.name}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-landing-ink">{award.result}</p>
                {award.detail && (
                  <p className="mt-1 text-sm leading-relaxed text-landing-muted">{award.detail}</p>
                )}
                <span className="flex-1" />
                {award.link && (
                  <a
                    href={award.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-landing-pine hover:text-landing-forest"
                  >
                    Read the announcement
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StartSection() {
  return (
    <section id="start" className="scroll-mt-24 px-4 pb-24 sm:px-6 md:pb-32">
      <div className="mx-auto grid max-w-[1100px] items-center gap-10 rounded-[28px] bg-landing-paper p-6 sm:p-10 md:grid-cols-[7fr_5fr] md:p-14">
        <div>
          <h2 className={sectionHeading} style={{ textWrap: "balance" } as React.CSSProperties}>
            Farmers and vets, <Accent>start here</Accent>
          </h2>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-landing-muted">
            Scan the code or tap the button to say hello on WhatsApp. Your phone number becomes your
            account. Already registered? Sign in to the web app.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={pillPrimary}>
              <MessageCircle size={16} aria-hidden="true" />
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
    <section className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-[1100px] overflow-hidden rounded-[32px] bg-[linear-gradient(166deg,#1B6549_0%,#112111_100%)] px-6 py-16 text-center text-white sm:px-12 md:py-24">
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-[0.32em] select-none text-center font-display text-[22vw] font-bold leading-none tracking-[-0.04em] text-white/[0.045] md:text-[15rem]"
        >
          V-VET
        </p>
        <div className="relative">
          <h2
            className="mx-auto max-w-[18ch] font-display text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl md:text-[3.5rem]"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Help us take <span className="whitespace-nowrap">V-Vet</span>{" "}
            <span className="text-landing-leaf">to more farmers</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[56ch] text-[17px] leading-relaxed text-white/85">
            Our first pilot in Zimbabwe is funded and being prepared. We'd like to hear from NGOs,
            programmes, vets and funders who want to help it reach further.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={PARTNER_MAILTO} className={pillPrimaryOnDark}>
              <Mail size={16} aria-hidden="true" />
              Email {PARTNER_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClosingPoints() {
  return (
    <div className="border-y border-landing-line">
      <ul className="mx-auto grid max-w-[1160px] grid-cols-2 md:grid-cols-4">
        {CLOSING_POINTS.map((point, index) => (
          <li
            key={point.label}
            className={
              index < CLOSING_POINTS.length - 1
                ? "flex items-center gap-3 border-landing-line px-4 py-6 text-sm font-semibold text-landing-ink sm:px-6 md:border-r [&:nth-child(odd)]:border-r"
                : "flex items-center gap-3 px-4 py-6 text-sm font-semibold text-landing-ink sm:px-6"
            }
          >
            <point.icon size={20} strokeWidth={1.75} aria-hidden="true" />
            {point.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-xl font-bold tracking-tight text-landing-ink">V-Vet</span>
          </div>
          <ul className="flex flex-wrap gap-2.5">
            <li>
              <a
                href={PARTNER_MAILTO}
                className="inline-flex items-center gap-2 rounded-full bg-landing-paper px-4 py-2.5 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-mint"
              >
                <Mail size={16} aria-hidden="true" /> {PARTNER_EMAIL}
              </a>
            </li>
            <li>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-landing-paper px-4 py-2.5 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-mint"
              >
                <MessageCircle size={16} aria-hidden="true" /> WhatsApp
              </a>
            </li>
            <li>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-landing-paper px-4 py-2.5 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-mint"
              >
                <LogIn size={16} aria-hidden="true" /> Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-landing-line pt-6 text-sm text-landing-muted md:flex-row md:justify-between">
          <p>© 2026 V-Vet. Livestock health intelligence.</p>
          <p>Farmer photography on this page is illustrative. Product screens show an example case.</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="landing min-h-screen overflow-x-clip">
      <SiteHeader />
      <main>
        <Hero />
        <TrustMarquee />
        <FarmersSection />
        <TriageSection />
        <VetsSection />
        <GroundworkSection />
        <AwardsSection />
        <StartSection />
        <PartnerSection />
      </main>
      <ClosingPoints />
      <SiteFooter />
    </div>
  );
}
