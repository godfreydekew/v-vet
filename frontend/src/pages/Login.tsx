import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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

  const demoLogin = async (role: "farmer" | "vet" | "admin") => {
    const credentials = {
      farmer: { email: "farmer@vvet.com", password: "demo1234" },
      vet: { email: "vet@vvet.com", password: "demo1234" },
      admin: { email: "admin@vvet.com", password: "demo1234" },
    }[role];

    setEmail(credentials.email);
    setPassword(credentials.password);
    setLoading(true);
    try {
      await login(credentials.email, credentials.password);
    } catch (err) {
      toast({
        title:
          err instanceof Error
            ? err.message
            : "Demo login failed. Please try again.",
        variant: "destructive",
      });
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
              onClick={() => navigate("/")}
              className="text-foreground"
            >
              Home
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
          <h1 className="text-2xl font-bold text-foreground">V-Vet</h1>
          <p className="text-sm text-muted-foreground">
            Livestock health intelligence for African farmers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-6 space-y-4 shadow-sm">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
            <Link to="/forgot-password" className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors">
              Forgot password?
            </Link>
          </div>
        </form>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Quick demo access
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => demoLogin("farmer")}
              disabled={loading}
              className="text-xs"
            >
              🐄 Farmer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => demoLogin("vet")}
              disabled={loading}
              className="text-xs"
            >
              🩺 Vet
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => demoLogin("admin")}
              disabled={loading}
              className="text-xs"
            >
              🌍 Admin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
