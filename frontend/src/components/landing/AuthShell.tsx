import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Shared frame for the public auth screens (sign in, sign up).
// It uses the landing page's visual world: a green brand panel beside a white form column.

export const authInputClass =
  "h-12 w-full rounded-xl bg-white px-4 text-[15px] text-landing-ink ring-1 ring-inset ring-landing-line transition-shadow placeholder:text-landing-muted hover:ring-[#D4D0C9] focus:outline-none focus:ring-2 focus:ring-landing-accent disabled:cursor-not-allowed disabled:opacity-60";

export const authLabelClass = "block text-sm font-medium text-landing-ink";

export const authHintClass = "text-sm leading-relaxed text-landing-muted";

export const authSubmitClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-landing-button px-6 text-[15px] font-semibold text-white transition-colors hover:bg-landing-pine disabled:cursor-not-allowed disabled:opacity-60";

export const authLinkClass =
  "font-medium text-landing-pine underline decoration-landing-line underline-offset-4 transition-colors hover:decoration-landing-pine";

type AuthShellProps = {
  title: React.ReactNode;
  subtitle: string;
  headerLink: { label: string; to: string };
  panelTitle: React.ReactNode;
  panelText: string;
  panelVisual: React.ReactNode;
  children: React.ReactNode;
};

export default function AuthShell({
  title,
  subtitle,
  headerLink,
  panelTitle,
  panelText,
  panelVisual,
  children,
}: AuthShellProps) {
  return (
    <div className="landing min-h-screen [color-scheme:light] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(166deg,#1B6549_0%,#112111_100%)] text-white lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 select-none overflow-hidden"
        >
          <p className="translate-y-[18%] text-center font-display text-[15vw] font-bold leading-none tracking-[-0.04em] text-white/[0.045]">
            V-VET
          </p>
        </div>

        <div className="relative flex h-[72px] items-center px-10 xl:px-16">
          <Link to="/" className="font-display text-xl font-bold tracking-tight text-white" aria-label="V-Vet home">
            V-Vet
          </Link>
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-10 pb-24 xl:px-16">
          <h2
            className="max-w-[18ch] font-display text-[2.125rem] font-semibold leading-[1.1] tracking-[-0.02em] xl:text-5xl"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {panelTitle}
          </h2>
          <p className="mt-5 max-w-[42ch] text-[17px] leading-relaxed text-white/75">{panelText}</p>
          <div className="mt-10 w-full max-w-[340px]">{panelVisual}</div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col bg-white">
        <header className="flex h-[72px] items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-tight text-landing-ink lg:hidden"
            aria-label="V-Vet home"
          >
            V-Vet
          </Link>
          <Link
            to="/"
            className="hidden items-center gap-1.5 text-[15px] font-medium text-landing-muted transition-colors hover:text-landing-ink lg:inline-flex"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back to home
          </Link>
          <Link
            to={headerLink.to}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-landing-ink ring-1 ring-inset ring-landing-line transition-colors hover:bg-landing-paper"
          >
            {headerLink.label}
          </Link>
        </header>

        <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:items-center lg:pt-0">
          <div className="w-full max-w-[420px]">
            <h1
              className="font-display text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.02em] text-landing-ink sm:text-[2.125rem]"
              style={{ textWrap: "balance" } as React.CSSProperties}
            >
              {title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-landing-muted sm:text-[17px]">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
