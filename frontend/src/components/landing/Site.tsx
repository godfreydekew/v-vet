import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, Languages, LogIn, Mail, MapPinned, Menu, Stethoscope, X } from "lucide-react";
import WhatsAppIcon from "@/components/landing/WhatsAppIcon";

// Shared chrome and styles for every public page (see frontend/DESIGN.md).

export const WHATSAPP_LINK = "https://wa.me/447519132951?text=Hello";
export const PARTNER_EMAIL = "info@vvet.org";
export const PARTNER_MAILTO = `mailto:${PARTNER_EMAIL}?subject=${encodeURIComponent("Partnering with V-Vet")}`;

const NAV_LINKS = [
  { label: "How it works", to: "/#farmers" },
  { label: "About", to: "/about" },
  { label: "Journey", to: "/journey" },
  { label: "Careers", to: "/careers" },
];

const CLOSING_POINTS = [
  { icon: Stethoscope, label: "Vets stay in the loop" },
  { icon: Languages, label: "Built for local languages" },
  { icon: WhatsAppIcon, label: "Works inside WhatsApp" },
  { icon: MapPinned, label: "Starting in Zimbabwe" },
];

export const pillPrimaryOnDark =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-landing-forest transition-colors hover:bg-landing-mint";
export const pillSecondaryOnDark =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-white ring-1 ring-inset ring-white/35 transition-colors hover:bg-white/10";
export const pillPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-landing-pine px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-landing-forest";
export const pillSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-landing-ink ring-1 ring-inset ring-landing-line transition-colors hover:bg-landing-paper";

export const sectionHeading =
  "font-display text-[2.125rem] font-semibold leading-[1.1] tracking-[-0.02em] text-landing-ink sm:text-[2.75rem] md:text-5xl";

export const balance = { textWrap: "balance" } as React.CSSProperties;

export function Accent({ children }: { children: React.ReactNode }) {
  return <span className="text-landing-pine">{children}</span>;
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-landing-ink">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-landing-mint text-landing-pine">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

// The deep green ground used by heroes and the closing band: an optional photo, faded into
// the brand gradient, with a grain over it. Children render above all three layers.
export function GreenGround({
  image,
  imagePosition = "50% 30%",
  className = "",
  children,
}: {
  image?: string;
  imagePosition?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative isolate overflow-hidden bg-landing-forest text-white ${className}`}>
      {image && (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70 mix-blend-luminosity"
          style={{ objectPosition: imagePosition }}
        />
      )}
      <div
        aria-hidden="true"
        className={
          image
            ? "absolute inset-0 -z-10 bg-[linear-gradient(166deg,rgba(27,101,73,0.70)_0%,rgba(17,33,17,0.86)_75%)]"
            : "absolute inset-0 -z-10 bg-[linear-gradient(166deg,#1B6549_0%,#112111_100%)]"
        }
      />
      <div aria-hidden="true" className="landing-grain pointer-events-none absolute inset-0 -z-10" />
      {children}
    </div>
  );
}

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the phone menu whenever the page or section changes.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname, hash]);

  // While the phone menu is open: Escape closes it and the page behind stops scrolling.
  useEffect(() => {
    if (!isMenuOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  // The header goes solid white once scrolled, or while the phone menu is open.
  const isSolid = isScrolled || isMenuOpen;

  return (
    <header
      className={
        isMenuOpen
          ? "fixed inset-x-0 top-0 z-50 border-b border-landing-line bg-white"
          : isScrolled
            ? "fixed inset-x-0 top-0 z-50 border-b border-landing-line bg-white/90 backdrop-blur-md transition-colors"
            : "fixed inset-x-0 top-0 z-50 border-b border-transparent bg-transparent transition-colors"
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center" aria-label="V-Vet home">
          <span
            className={
              isSolid
                ? "font-display text-xl font-bold tracking-tight text-landing-ink"
                : "font-display text-xl font-bold tracking-tight text-white"
            }
          >
            V-Vet
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isCurrent = link.to !== "/#farmers" && pathname.startsWith(link.to);
            const tone = isSolid
              ? isCurrent
                ? "text-landing-ink"
                : "text-landing-muted hover:text-landing-ink"
              : isCurrent
                ? "text-white"
                : "text-white/80 hover:text-white";
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={isCurrent ? "page" : undefined}
                className={`text-[15px] font-medium transition-colors ${tone}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/login"
            className={
              isSolid
                ? "hidden text-[15px] font-medium text-landing-ink md:inline"
                : "hidden text-[15px] font-medium text-white md:inline"
            }
          >
            Sign in
          </Link>
          <a
            href={PARTNER_MAILTO}
            className={
              isSolid
                ? "hidden rounded-full bg-landing-pine px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-landing-forest sm:inline-flex"
                : "hidden rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-landing-forest transition-colors hover:bg-landing-mint sm:inline-flex"
            }
          >
            Partner with us
          </a>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className={
              isSolid
                ? "-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-landing-ink hover:bg-landing-paper md:hidden"
                : "-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 md:hidden"
            }
          >
            {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-x-0 bottom-0 top-[72px] -z-10 bg-landing-forest/40 md:hidden"
        />
      )}
      {isMenuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-landing-line bg-white px-4 pb-6 pt-2 shadow-[0_24px_40px_-24px_rgba(17,33,17,0.35)] sm:px-6 md:hidden"
        >
          <ul className="divide-y divide-landing-line">
            {NAV_LINKS.map((link) => {
              const isCurrent = link.to !== "/#farmers" && pathname.startsWith(link.to);
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex items-center justify-between py-4 font-display text-xl font-semibold ${
                      isCurrent ? "text-landing-pine" : "text-landing-ink"
                    }`}
                  >
                    {link.label}
                    <ArrowRight size={18} className="text-landing-muted" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-landing-pine px-6 py-3.5 text-[15px] font-semibold text-white"
            >
              <WhatsAppIcon size={16} />
              Start on WhatsApp
            </a>
            <a
              href={PARTNER_MAILTO}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold text-landing-ink ring-1 ring-inset ring-landing-line"
            >
              Partner with us
            </a>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 py-2 text-[15px] font-medium text-landing-muted"
            >
              <LogIn size={16} aria-hidden="true" />
              Sign in
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

// The green opening of an inner public page: one headline, one lead, optional actions,
// over an optional faded photo.
export function PageHero({
  title,
  lead,
  image,
  imagePosition,
  children,
}: {
  title: React.ReactNode;
  lead: string;
  image?: string;
  imagePosition?: string;
  children?: React.ReactNode;
}) {
  return (
    <GreenGround image={image} imagePosition={imagePosition}>
      <section className="mx-auto max-w-[1160px] px-4 pb-20 pt-32 text-center sm:px-6 md:pb-28 md:pt-40">
        <h1
          className="mx-auto max-w-[22ch] font-display text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl md:text-[4.25rem]"
          style={balance}
        >
          {title}
        </h1>
        <p
          className="mx-auto mt-5 max-w-[58ch] text-[17px] leading-relaxed text-white/85 md:text-lg"
          style={{ textWrap: "pretty" } as React.CSSProperties}
        >
          {lead}
        </p>
        {children && (
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">{children}</div>
        )}
      </section>
    </GreenGround>
  );
}

// The closing gradient band with the decorative watermark.
export function ClosingBand({
  title,
  lead,
  children,
}: {
  title: React.ReactNode;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <GreenGround className="mx-auto max-w-[1100px] rounded-[32px] px-6 py-16 text-center sm:px-12 md:py-24">
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -bottom-[0.32em] select-none text-center font-display text-[22vw] font-bold leading-none tracking-[-0.04em] text-white/[0.045] md:text-[15rem]"
        >
          V-VET
        </p>
        <div className="relative">
          <h2
            className="mx-auto max-w-[18ch] font-display text-[2.125rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl md:text-[3.5rem]"
            style={balance}
          >
            {title}
          </h2>
          <p className="mx-auto mt-6 max-w-[56ch] text-[17px] leading-relaxed text-white/85">{lead}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">{children}</div>
        </div>
      </GreenGround>
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

const footerChip =
  "inline-flex items-center gap-2 rounded-full bg-landing-paper px-4 py-2.5 text-sm font-medium text-landing-ink transition-colors hover:bg-landing-mint";

function SiteFooter() {
  return (
    <footer className="px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/" className="font-display text-xl font-bold tracking-tight text-landing-ink">
              V-Vet
            </Link>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-landing-muted">
              <Link to="/about" className="hover:text-landing-ink">About</Link>
              <Link to="/journey" className="hover:text-landing-ink">Journey</Link>
              <Link to="/careers" className="hover:text-landing-ink">Careers</Link>
              <Link to="/privacy" className="hover:text-landing-ink">Privacy</Link>
            </nav>
          </div>
          <ul className="flex flex-wrap gap-2.5">
            <li>
              <a href={PARTNER_MAILTO} className={footerChip}>
                <Mail size={16} aria-hidden="true" /> {PARTNER_EMAIL}
              </a>
            </li>
            <li>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className={footerChip}>
                <WhatsAppIcon size={16} /> WhatsApp
              </a>
            </li>
            <li>
              <Link to="/login" className={footerChip}>
                <LogIn size={16} aria-hidden="true" /> Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div className="mt-10 border-t border-landing-line pt-6 text-sm text-landing-muted">
          <p>© 2026 V-Vet. Livestock health intelligence.</p>
        </div>
      </div>
    </footer>
  );
}

// Wraps a public page in the landing visual world, with the shared header and footer.
// Scrolls to the top on page changes, or to the #section in the URL when there is one.
export function PublicPage({ children }: { children: React.ReactNode }) {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return (
    <div className="landing min-h-screen overflow-x-clip [color-scheme:light]">
      <SiteHeader />
      <main>{children}</main>
      <ClosingPoints />
      <SiteFooter />
    </div>
  );
}
