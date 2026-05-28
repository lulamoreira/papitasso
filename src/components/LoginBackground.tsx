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
];

const GRID_SIZE = 48; // Total items in the grid

export function LoginBackground() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    // Initial random images
    const initialImages = Array.from({ length: GRID_SIZE }).map(
      () => SOCCER_IMAGES[Math.floor(Math.random() * SOCCER_IMAGES.length)]
    );
    setImages(initialImages);

    const interval = setInterval(() => {
      setImages((prev) => {
        const next = [...prev];
        // Change 3 random images every 2 seconds
        for (let i = 0; i < 3; i++) {
          const randomIndex = Math.floor(Math.random() * GRID_SIZE);
          const randomImage = SOCCER_IMAGES[Math.floor(Math.random() * SOCCER_IMAGES.length)];
          next[randomIndex] = randomImage;
        }
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black opacity-40">
      <div className="grid h-full w-full grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square overflow-hidden bg-muted">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={img}
                src={img}
                alt="Soccer background"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 h-full w-full object-cover grayscale-[20%]"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/40 to-background/80" />
    </div>
  );
}
