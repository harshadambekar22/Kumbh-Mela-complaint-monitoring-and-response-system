import { useEffect, useState } from "react";

const PHOTOS = [
  "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1524492449090-1f0f25c00b7b?auto=format&fit=crop&w=1600&q=80",
];

export default function KumbhHero({ title, subtitle }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((n) => (n + 1) % PHOTOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl">
      <img src={PHOTOS[idx]} alt="Kumbh Mela" className="h-52 w-full object-cover transition-all duration-700 pulse-soft" />
      <div className="kumbh-hero-overlay absolute inset-0" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-slate-100 max-w-2xl">{subtitle}</p>
        <div className="mt-3 flex gap-2">
          {PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-8 rounded-full ${i === idx ? "bg-orange-400" : "bg-white/50 hover:bg-white/70"}`}
              aria-label={`Hero photo ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
