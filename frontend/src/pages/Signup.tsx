import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, MessageCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getApiError } from "@/lib/api";
import { formatPhoneForWhatsApp } from "@/lib/phone";
import { signupUser } from "@/lib/services/users.service";
import { COUNTRY_CODES, DEFAULT_COUNTRY_ISO } from "@/data/country-codes";
import AuthShell, {
  authHintClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authSubmitClass,
} from "@/components/landing/AuthShell";
import { ExampleChip, WhatsAppWelcome } from "@/components/landing/CaseVisuals";

export default function Signup() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [localPhone, setLocalPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  // The phone number the backend rejected because it has no V-Vet WhatsApp account.
  const [phoneWithoutWhatsApp, setPhoneWithoutWhatsApp] = useState<string | null>(null);

  const selectedCountry =
    COUNTRY_CODES.find((c) => c.iso === countryIso) ?? COUNTRY_CODES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneWithoutWhatsApp(null);

    if (!email || !password || !localPhone) {
      toast({
        title: "Please enter your email, password and WhatsApp number.",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Your password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    const phoneNumber = formatPhoneForWhatsApp(selectedCountry.dialCode, localPhone);

    setLoading(true);
    try {
      await signupUser({
        email,
        password,
        full_name: fullName || null,
        phone_number: phoneNumber,
        address: address || null,
      });
      await login(email, password);
    } catch (err) {
      // 403 = this phone number has never used V-Vet on WhatsApp.
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setPhoneWithoutWhatsApp(phoneNumber);
      } else {
        toast({ title: getApiError(err), variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Create your <span className="text-landing-accent">web account</span>
        </>
      }
      subtitle="For farmers already using V-Vet on WhatsApp."
      headerLink={{ label: "Sign in", to: "/login" }}
      panelTitle={
        <>
          Your herd on WhatsApp, <span className="text-landing-leaf">and on the web.</span>
        </>
      }
      panelText="Sign up with the WhatsApp number you already chat with V-Vet on. You can keep using WhatsApp for everything."
      panelVisual={
        <div className="space-y-3">
          <ExampleChip />
          <div className="h-[132px] overflow-hidden rounded-[18px] shadow-[0_10px_30px_-12px_rgba(17,33,17,0.6)]">
            <WhatsAppWelcome />
          </div>
        </div>
      }
    >
      {phoneWithoutWhatsApp && (
        <div role="alert" className="mb-6 flex gap-3 rounded-2xl bg-landing-sand p-4">
          <MessageCircle size={20} className="mt-0.5 shrink-0 text-landing-pine" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-landing-ink">No V-Vet WhatsApp account found</p>
            <p className="text-sm leading-relaxed text-landing-muted">
              We couldn't find a V-Vet WhatsApp account for +{phoneWithoutWhatsApp}. Please set up your
              account on V-Vet through WhatsApp first, then come back here to sign up.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="full-name" className={authLabelClass}>
            Full name
          </label>
          <input
            id="full-name"
            placeholder="Tendai Moyo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className={authInputClass}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className={authLabelClass}>
            WhatsApp number
          </label>
          <div className="flex gap-2">
            <Select value={countryIso} onValueChange={setCountryIso}>
              <SelectTrigger
                className="h-12 w-28 shrink-0 rounded-xl border-0 bg-white px-4 text-[15px] text-landing-ink ring-1 ring-inset ring-landing-line ring-offset-0 focus:ring-2 focus:ring-landing-accent focus:ring-offset-0"
                aria-label="Country code"
              >
                <SelectValue>+{selectedCountry.dialCode}</SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-landing-line bg-white font-display text-landing-ink">
                {COUNTRY_CODES.map((country) => (
                  <SelectItem
                    key={country.iso}
                    value={country.iso}
                    className="rounded-lg focus:bg-landing-mint focus:text-landing-ink"
                  >
                    {country.name} (+{country.dialCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              id="phone"
              type="tel"
              placeholder="77 123 4567"
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
              autoComplete="tel-national"
              aria-describedby="phone-hint"
              className={authInputClass}
            />
          </div>
          <p id="phone-hint" className={authHintClass}>
            Use the same number you chat with V-Vet on.
          </p>
        </div>

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
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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

        <div className="space-y-2">
          <label htmlFor="address" className={authLabelClass}>
            Address <span className="font-normal text-landing-muted">(optional)</span>
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
            className={authInputClass}
          />
        </div>

        <button type="submit" className={authSubmitClass} disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className={`mt-8 border-t border-landing-line pt-6 ${authHintClass}`}>
        Already have an account?{" "}
        <Link to="/login" className={authLinkClass}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
