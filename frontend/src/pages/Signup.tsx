import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Eye, EyeOff, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <img
              src="/logo.png"
              alt="V-Vet logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="text-lg font-bold text-foreground tracking-tight">
              V-Vet
            </span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-foreground"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-sm space-y-8 mx-auto px-4 py-10 md:py-16">
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="V-Vet logo"
            className="w-14 h-14 rounded-2xl object-cover mx-auto"
          />
          <h1 className="text-2xl font-bold text-foreground">Create your web account</h1>
          <p className="text-sm text-muted-foreground">
            For farmers already using V-Vet on WhatsApp
          </p>
        </div>

        {phoneWithoutWhatsApp && (
          <div className="rounded-xl border border-border bg-muted p-4 flex gap-3">
            <MessageCircle size={20} className="text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                No V-Vet WhatsApp account found
              </p>
              <p className="text-sm text-muted-foreground">
                We couldn't find a V-Vet WhatsApp account for +{phoneWithoutWhatsApp}.
                Please set up your account on V-Vet through WhatsApp first, then come back here to sign up.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                placeholder="Tendai Moyo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <div className="flex gap-2">
                <Select value={countryIso} onValueChange={setCountryIso}>
                  <SelectTrigger className="w-28 shrink-0" aria-label="Country code">
                    <SelectValue>+{selectedCountry.dialCode}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((country) => (
                      <SelectItem key={country.iso} value={country.iso}>
                        {country.name} (+{country.dialCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="77 123 4567"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  autoComplete="tel-national"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use the same number you chat with V-Vet on.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Sign Up"}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
