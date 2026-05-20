// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useLanguage } from '@/contexts/LanguageContext';
// import { Phone, ArrowLeft, User } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// const ContractorLogin = () => {
//   const navigate = useNavigate();
//   const { t } = useLanguage();
//   const [step, setStep] = useState<'name' | 'phone' | 'otp'>('name');
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');

//   const handleSendOtp = () => {
//     if (phone.length === 10) setStep('otp');
//   };

//   const handleVerify = () => {
//     navigate('/contractor-dashboard');
//   };

//   const handleBack = () => {
//     if (step === 'otp') setStep('phone');
//     else if (step === 'phone') setStep('name');
//     else navigate('/user-type');
//   };

//   return (
//     <div className="flex min-h-screen flex-col bg-background p-6">
//       <button onClick={handleBack} className="mb-6 flex items-center gap-2 text-lg text-accent">
//         <ArrowLeft className="h-6 w-6" /> {t('back')}
//       </button>

//       <div className="mt-8 flex flex-col items-center">
//         <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
//           {step === 'name' ? <User className="h-10 w-10 text-accent" /> : <Phone className="h-10 w-10 text-accent" />}
//         </div>
//         <h1 className="mb-2 text-2xl font-bold text-foreground">{t('contractor')}</h1>

//         {step === 'name' ? (
//           <div className="mt-8 w-full max-w-sm">
//             <label className="mb-3 block text-lg font-medium text-foreground">{t('yourName')}</label>
//             <Input
//               type="text"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               placeholder={t('enterName')}
//               className="h-14 rounded-xl text-lg"
//             />
//             <Button onClick={() => setStep('phone')} disabled={!name.trim()} className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90" size="lg">
//               {t('next')}
//             </Button>
//           </div>
//         ) : step === 'phone' ? (
//           <div className="mt-8 w-full max-w-sm">
//             <p className="mb-4 text-center text-lg text-muted-foreground">{t('hello')}, {name} 👋</p>
//             <label className="mb-3 block text-lg font-medium text-foreground">{t('phoneNumber')}</label>
//             <div className="flex items-center gap-2">
//               <span className="rounded-xl border border-input bg-muted px-4 py-3 text-lg font-bold">+91</span>
//               <Input
//                 type="tel"
//                 maxLength={10}
//                 value={phone}
//                 onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
//                 placeholder={t('enterPhone')}
//                 className="h-14 rounded-xl text-lg"
//               />
//             </div>
//             <Button onClick={handleSendOtp} disabled={phone.length !== 10} className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90" size="lg">
//               {t('sendOtp')}
//             </Button>
//           </div>
//         ) : (
//           <div className="mt-8 flex w-full max-w-sm flex-col items-center">
//             <label className="mb-4 block text-lg font-medium text-foreground">{t('enterOtp')}</label>
//             <InputOTP maxLength={4} onComplete={handleVerify}>
//               <InputOTPGroup>
//                 <InputOTPSlot index={0} className="h-16 w-16 rounded-xl text-2xl" />
//                 <InputOTPSlot index={1} className="h-16 w-16 rounded-xl text-2xl" />
//                 <InputOTPSlot index={2} className="h-16 w-16 rounded-xl text-2xl" />
//                 <InputOTPSlot index={3} className="h-16 w-16 rounded-xl text-2xl" />
//               </InputOTPGroup>
//             </InputOTP>
//             <Button onClick={handleVerify} className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90" size="lg">
//               {t('verifyOtp')}
//             </Button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ContractorLogin;



import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, ArrowLeft, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const API = "http://localhost:5001/api";

const ContractorLogin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState<"name" | "phone" | "otp">("name");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- SEND OTP ---------------- */

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      console.log("OTP sent:", data);

      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          otp,
          role: "contractor",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      console.log("Login success:", data);

      /* store login data */

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/contractor-dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- BACK BUTTON ---------------- */

  const handleBack = () => {
    if (step === "otp") setStep("phone");
    else if (step === "phone") setStep("name");
    else navigate("/user-type");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-6">
      <button
        onClick={handleBack}
        className="mb-6 flex items-center gap-2 text-lg text-accent"
      >
        <ArrowLeft className="h-6 w-6" /> {t("back")}
      </button>

      <div className="mt-8 flex flex-col items-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          {step === "name" ? (
            <User className="h-10 w-10 text-accent" />
          ) : (
            <Phone className="h-10 w-10 text-accent" />
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">
          {t("contractor")}
        </h1>

        {/* ---------------- NAME STEP ---------------- */}

        {step === "name" && (
          <div className="mt-8 w-full max-w-sm">
            <label className="mb-3 block text-lg font-medium text-foreground">
              {t("yourName")}
            </label>

            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("enterName")}
              className="h-14 rounded-xl text-lg"
            />

            <Button
              onClick={() => setStep("phone")}
              disabled={!name.trim()}
              className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold"
            >
              {t("next")}
            </Button>
          </div>
        )}

        {/* ---------------- PHONE STEP ---------------- */}

        {step === "phone" && (
          <div className="mt-8 w-full max-w-sm">
            <p className="mb-4 text-center text-lg text-muted-foreground">
              {t("hello")}, {name} 👋
            </p>

            <label className="mb-3 block text-lg font-medium text-foreground">
              {t("phoneNumber")}
            </label>

            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-input bg-muted px-4 py-3 text-lg font-bold">
                +91
              </span>

              <Input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
                placeholder={t("enterPhone")}
                className="h-14 rounded-xl text-lg"
              />
            </div>

            <Button
              onClick={handleSendOtp}
              disabled={phone.length !== 10 || loading}
              className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold"
            >
              {loading ? "Sending..." : t("sendOtp")}
            </Button>
          </div>
        )}

        {/* ---------------- OTP STEP ---------------- */}

{step === "otp" && (
  <div className="mt-8 flex w-full max-w-sm flex-col items-center">
    <label className="mb-4 block text-lg font-medium text-foreground">
      {t("enterOtp")}
    </label>

    <InputOTP
      maxLength={6}
      value={otp}
      onChange={(value) => setOtp(value)}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} className="h-16 w-16 text-2xl" />
        <InputOTPSlot index={1} className="h-16 w-16 text-2xl" />
        <InputOTPSlot index={2} className="h-16 w-16 text-2xl" />
        <InputOTPSlot index={3} className="h-16 w-16 text-2xl" />
        <InputOTPSlot index={4} className="h-16 w-16 text-2xl" />
        <InputOTPSlot index={5} className="h-16 w-16 text-2xl" />
      </InputOTPGroup>
    </InputOTP>

    <Button
      onClick={handleVerify}
      disabled={otp.length !== 6 || loading}
      className="mt-6 h-14 w-full rounded-2xl bg-accent text-xl font-bold"
    >
      {loading ? "Verifying..." : t("verifyOtp")}
    </Button>

    {error && (
      <p className="mt-4 text-red-500 text-sm">{error}</p>
    )}
  </div>
)}
      </div>
    </div>
  );
};

export default ContractorLogin;
