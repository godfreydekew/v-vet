import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AuthShell, {
  authHintClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authSubmitClass,
} from "@/components/landing/AuthShell";
import { ExampleChip, VetCaseCard } from "@/components/landing/CaseVisuals";

const PARTNER_EMAIL = "info@vvet.org";

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Please enter your email and password.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      toast({
        title:
          err instanceof Error
            ? err.message
            : "We couldn't sign you in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Sign in to <span className="text-landing-accent">V-Vet</span>
        </>
      }
      subtitle="For farmers, vets and admins using the web app."
      headerLink={{ label: "Create account", to: "/signup" }}
      panelTitle={
        <>
          Every case reaches a vet <span className="text-landing-leaf">with its full history.</span>
        </>
      }
      panelText="Symptoms, photos and the animal's record arrive together, sorted by urgency."
      panelVisual={
        <div className="space-y-3">
          <ExampleChip label="Example case" />
          <VetCaseCard />
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={authInputClass}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className={authLabelClass}>
              Password
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-landing-pine hover:underline hover:underline-offset-4">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-landing-muted transition-colors hover:bg-landing-paper hover:text-landing-ink"
            >
              {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <button type="submit" className={authSubmitClass} disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-8 space-y-3 border-t border-landing-line pt-6">
        <p className={authHintClass}>
          Already using V-Vet on WhatsApp?{" "}
          <Link to="/signup" className={authLinkClass}>
            Create your web account
          </Link>
        </p>
        <p className={authHintClass}>
          To join the pilot, email{" "}
          <a href={`mailto:${PARTNER_EMAIL}`} className={authLinkClass}>
            {PARTNER_EMAIL}
          </a>
        </p>
      </div>
    </AuthShell>
  );
}
