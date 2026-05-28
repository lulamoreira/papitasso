import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SOCCER_IMAGES = [
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1540747913346-19e3ad386698?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1510567198462-974a10128427?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1431324155629-1a6eda1eed2d?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1516515429572-12f3626a6c17?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1564633213038-f9967731997d?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1552318975-27db10d27303?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1550885882-b88a70acc34a?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1551280857-2b9bbe52cf50?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1556056504-51d1b33a714b?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1518153832749-04c94bc92437?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1536122985607-4fe00b283652?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1522778504488-051699f168f8?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1514163061630-403303a7a030?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1509048191080-d2984bad6ad5?auto=format&fit=crop&q=80&w=400&h=400",
  "https://images.unsplash.com/photo-1516244485114-046603708e1a?auto=format&fit=crop&q=80&w=400&h=400",
];

const GRID_SIZE = 24; // Lowered to ensure uniqueness with a pool of 30

export function LoginBackground() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Initial unique random images
    const shuffleAndPick = () => {
      const shuffled = [...SOCCER_IMAGES].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, GRID_SIZE);
    };

    setImages(shuffleAndPick());

    const interval = setInterval(() => {
      setImages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const currentSet = new Set(prev);
        const availablePool = SOCCER_IMAGES.filter(img => !currentSet.has(img));
        
        if (availablePool.length === 0) return prev;

        // Change up to 2 random images every 2 seconds to maintain variety
        const numToChange = Math.min(2, availablePool.length);
        const indicesToChange = Array.from({ length: GRID_SIZE }, (_, i) => i)
          .sort(() => Math.random() - 0.5)
          .slice(0, numToChange);

        indicesToChange.forEach((idx, i) => {
          if (availablePool[i]) {
            next[idx] = availablePool[i];
          }
        });

        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      <div className="grid h-full w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0.5">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square overflow-hidden bg-slate-900">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={img + idx}
                src={img}
                alt=""
                initial={{ opacity: 0, filter: "brightness(0.5) scale(1.2)" }}
                animate={{ opacity: 0.6, filter: "brightness(0.8) scale(1)" }}
                exit={{ opacity: 0, filter: "brightness(0.5) scale(0.8)" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/40" />
      <div className="absolute inset-0 backdrop-grayscale-[30%]" />
    </div>
  );
}
