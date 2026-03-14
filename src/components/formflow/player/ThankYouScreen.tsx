import { useEffect, useState } from "react";

interface ThankYouScreenProps {
  message?: string;
  redirectUrl?: string;
  primaryColor?: string;
  onReset: () => void;
}

export function ThankYouScreen({
  message,
  redirectUrl,
  primaryColor = "#4F46E5",
  onReset,
}: ThankYouScreenProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!redirectUrl) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = redirectUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [redirectUrl]);

  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 py-12">
      {/* Check animado */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${primaryColor}20` }}
      >
        <svg
          viewBox="0 0 52 52"
          className="w-12 h-12"
          style={{ "--check-color": primaryColor } as React.CSSProperties}
        >
          <circle
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
            className="animate-[dash-circle_0.6s_ease-in-out_forwards]"
            style={{
              strokeDasharray: "157",
              strokeDashoffset: "157",
              animation: "dash-circle 0.6s ease-in-out forwards",
            }}
          />
          <path
            fill="none"
            stroke={primaryColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27 l8 8 l16-16"
            style={{
              strokeDasharray: "30",
              strokeDashoffset: "30",
              animation: "dash-check 0.4s 0.5s ease-in-out forwards",
            }}
          />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold">
          {message ?? "Obrigado por responder!"}
        </h2>
        {redirectUrl && (
          <p className="text-sm opacity-50">
            Redirecionando em {countdown}s...
          </p>
        )}
      </div>

      <button
        onClick={onReset}
        className="mt-2 px-6 py-2.5 rounded-xl border-2 text-sm font-medium transition-all hover:opacity-80 active:scale-95"
        style={{ borderColor: `${primaryColor}50`, color: primaryColor }}
      >
        Enviar outra resposta
      </button>

      <style>{`
        @keyframes dash-circle {
          to { stroke-dashoffset: 0; }
        }
        @keyframes dash-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
