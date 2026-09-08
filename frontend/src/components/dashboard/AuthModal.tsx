import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Phone, MapPin, CheckCircle2, User, Loader2, X, AlertTriangle, ArrowRight, Radio } from "lucide-react";
import { API_BASE } from "@/config/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  initialPhone?: string;
}

export function AuthModal({ isOpen, onClose, onSuccess, initialPhone = "" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initialPhone || "");
  const [locationName, setLocationName] = useState("New Delhi, Delhi");
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 28.6139, lon: 77.2090 });
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsDetectingLocation(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`);
          const data = await res.json();
          if (data && data.address) {
            const locality = data.address.suburb || data.address.city || data.address.town || data.address.county || "Detected City";
            const state = data.address.state || "India";
            setLocationName(`${locality}, ${state}`);
          } else {
            setLocationName(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
          }
        } catch {
          setLocationName(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setErrorMsg("Unable to retrieve GPS coordinates. Using selected reference coordinates.");
      },
      { timeout: 10000 }
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phone.trim(),
          latitude: coords.lat,
          longitude: coords.lon,
          location_name: locationName,
          sms_enabled: smsEnabled
        })
      });
      const data = await res.json();
      if (data.status === "success" && data.user) {
        localStorage.setItem("agraan_user", JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem("agraan_auth_token", data.access_token);
        }
        onSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg("Connection to server failed. Ensure backend API is active.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter your registered 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone.trim() })
      });
      const data = await res.json();
      if (data.status === "success" && data.user) {
        localStorage.setItem("agraan_user", JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem("agraan_auth_token", data.access_token);
        }
        onSuccess(data.user);
        onClose();
      } else {
        setErrorMsg(data.message || "Phone number not found. Please register as new user.");
      }
    } catch {
      setErrorMsg("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestEntry = async () => {
    const guestUser = {
      id: 999,
      name: "Emergency Operations Guest",
      phone_number: "+919876543210",
      latitude: 30.28,
      longitude: 78.98,
      location_name: "Rudraprayag Command Sector",
      sms_enabled: true
    };
    try {
      const res = await fetch(`${API_BASE}/api/auth/guest-token`);
      const d = await res.json();
      if (d && d.access_token) {
        localStorage.setItem("agraan_auth_token", d.access_token);
      } else {
        localStorage.setItem("agraan_auth_token", "agraan-emergency-dev-key-2026");
      }
    } catch {
      localStorage.setItem("agraan_auth_token", "agraan-emergency-dev-key-2026");
    }
    localStorage.setItem("agraan_user", JSON.stringify(guestUser));
    onSuccess(guestUser);
    onClose();
  };

  const inputClasses = "w-full bg-secondary/40 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
        className="w-full max-w-md bg-panel border border-accent/30 rounded-[0.66rem] p-6 sm:p-8 text-ink shadow-lg relative overflow-hidden"
      >
        {/* Glow ambient highlight */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-soft/70 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Emergency Access</h2>
              <p className="text-xs text-accent font-mono">Agraan AI Alert Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center text-ink-faint hover:text-ink transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-secondary/40 rounded-lg mt-5 border border-border relative z-10">
          <button
            onClick={() => { setActiveTab("register"); setErrorMsg(""); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "register" ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink"
            }`}
          >
            Register For SMS Alerts
          </button>
          <button
            onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "login" ? "bg-accent text-white shadow-sm" : "text-ink-dim hover:text-ink"
            }`}
          >
            Registered Login
          </button>
        </div>

        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* REGISTER FORM */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="mt-5 space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-ink-dim block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                <input
                  type="text"
                  placeholder="e.g. Harshit Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink-dim block mb-1.5">Mobile Number (For Emergency SMS)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${inputClasses} font-mono`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-dim">Alert Location / Sector</label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="text-[11px] text-accent hover:text-accent/80 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {isDetectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  <span>{isDetectingLocation ? "Detecting GPS..." : "Use Current GPS"}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/40 border border-border text-xs flex items-center justify-between">
                <span className="text-ink font-medium truncate">{locationName}</span>
                <span className="text-[10px] text-ink-faint font-mono shrink-0 ml-2">
                  {coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°E
                </span>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.checked)}
                  className="mt-0.5 rounded border-border bg-secondary/40 accent-[#246b38] focus:ring-0 w-4 h-4"
                />
                <span className="text-[11.5px] text-ink-dim leading-snug">
                  I give explicit consent to receive location-aware severe weather &amp; disaster warnings via SMS when risk is detected in my area.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-lg bg-accent hover:bg-accent/90 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Subscriber...</span>
                </>
              ) : (
                <>
                  <span>REGISTER &amp; ENTER COMMAND CENTER</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {activeTab === "login" && (
          <form onSubmit={handleLogin} className="mt-5 space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-ink-dim block mb-1.5">Registered Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${inputClasses} font-mono`}
                />
              </div>
              <p className="text-[11px] text-ink-faint mt-1.5">
                Demo accounts: <span className="font-mono text-accent">+919876543210</span> (Harshit) or <span className="font-mono text-accent">+919812345678</span> (Chirag)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-lg bg-accent hover:bg-accent/90 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Subscription...</span>
                </>
              ) : (
                <>
                  <span>LOG IN &amp; OPEN DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Guest access option */}
        <div className="mt-5 pt-4 border-t border-border-soft/70 text-center relative z-10">
          <button
            type="button"
            onClick={handleGuestEntry}
            className="text-xs text-ink-faint hover:text-ink transition-colors underline cursor-pointer"
          >
            Or explore Command Center as Guest Observer ➔
          </button>
        </div>
      </motion.div>
    </div>
  );
}
