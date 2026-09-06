import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Phone, MapPin, CheckCircle2, User, Loader2, X, AlertTriangle, ArrowRight, Radio } from "lucide-react";

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
      const res = await fetch("http://localhost:8000/api/users/register", {
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
        localStorage.setItem("disasterguard_user", JSON.stringify(data.user));
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
      const res = await fetch("http://localhost:8000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone.trim() })
      });
      const data = await res.json();
      if (data.status === "success" && data.user) {
        localStorage.setItem("disasterguard_user", JSON.stringify(data.user));
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

  const handleGuestEntry = () => {
    const guestUser = {
      id: 999,
      name: "Emergency Operations Guest",
      phone_number: "+919876543210",
      latitude: 30.28,
      longitude: 78.98,
      location_name: "Rudraprayag Command Sector",
      sms_enabled: true
    };
    localStorage.setItem("disasterguard_user", JSON.stringify(guestUser));
    onSuccess(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-[#0f1420] border border-blue-500/40 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden"
      >
        {/* Glow ambient highlight */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Emergency Access</h2>
              <p className="text-xs text-blue-400 font-mono">DisasterGuard AI Alert Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl mt-5 border border-white/10 relative z-10">
          <button
            onClick={() => { setActiveTab("register"); setErrorMsg(""); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "register" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Register For SMS Alerts
          </button>
          <button
            onClick={() => { setActiveTab("login"); setErrorMsg(""); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "login" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            Registered Login
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* REGISTER FORM */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} className="mt-5 space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Harshit Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Mobile Number (For Emergency SMS)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Alert Location / Sector</label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                >
                  {isDetectingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  <span>{isDetectingLocation ? "Detecting GPS..." : "Use Current GPS"}</span>
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center justify-between">
                <span className="text-white font-medium truncate">{locationName}</span>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
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
                  className="mt-0.5 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-[11.5px] text-slate-300 leading-snug">
                  I give explicit consent to receive location-aware severe weather &amp; disaster warnings via SMS when risk is detected in my area.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
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
              <label className="text-xs font-bold text-slate-300 block mb-1.5">Registered Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Demo accounts: <span className="font-mono text-blue-400">+919876543210</span> (Harshit) or <span className="font-mono text-blue-400">+919812345678</span> (Chirag)
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
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
        <div className="mt-5 pt-4 border-t border-white/10 text-center relative z-10">
          <button
            type="button"
            onClick={handleGuestEntry}
            className="text-xs text-slate-400 hover:text-white transition-colors underline"
          >
            Or explore Command Center as Guest Observer ➔
          </button>
        </div>
      </motion.div>
    </div>
  );
}
