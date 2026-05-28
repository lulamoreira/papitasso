import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import AI-generated football images
import ai01 from "@/assets/login-bg/ai-01.jpg";
import ai02 from "@/assets/login-bg/ai-02.jpg";
import ai03 from "@/assets/login-bg/ai-03.jpg";
import ai04 from "@/assets/login-bg/ai-04.jpg";
import ai05 from "@/assets/login-bg/ai-05.jpg";
import ai06 from "@/assets/login-bg/ai-06.jpg";
import ai07 from "@/assets/login-bg/ai-07.jpg";
import ai08 from "@/assets/login-bg/ai-08.jpg";
import ai09 from "@/assets/login-bg/ai-09.jpg";
import ai10 from "@/assets/login-bg/ai-10.jpg";
import ai11 from "@/assets/login-bg/ai-11.jpg";
import ai12 from "@/assets/login-bg/ai-12.jpg";
import ai13 from "@/assets/login-bg/ai-13.jpg";
import ai14 from "@/assets/login-bg/ai-14.jpg";
import ai15 from "@/assets/login-bg/ai-15.jpg";
import ai16 from "@/assets/login-bg/ai-16.jpg";
import ai17 from "@/assets/login-bg/ai-17.jpg";
import ai18 from "@/assets/login-bg/ai-18.jpg";
import ai19 from "@/assets/login-bg/ai-19.jpg";
import ai20 from "@/assets/login-bg/ai-20.jpg";
import ai21 from "@/assets/login-bg/ai-21.jpg";
import ai22 from "@/assets/login-bg/ai-22.jpg";
import ai23 from "@/assets/login-bg/ai-23.jpg";
import ai24 from "@/assets/login-bg/ai-24.jpg";

const ALL_IMAGES = [
  ai01, ai02, ai03, ai04, ai05, ai06, ai07, ai08, ai09, ai10,
  ai11, ai12, ai13, ai14, ai15, ai16, ai17, ai18, ai19, ai20,
  ai21, ai22, ai23, ai24
];

const GRID_SIZE = 12; // 2 lines x 6 columns
const COOLDOWN_MS = 60000; // 1 minute minimum between showing the same image

export function LoginBackground() {
  const [images, setImages] = useState<string[]>([]);
  // Use a ref to track when each image was last "entered" into the display
  const lastShownAt = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Initial random selection
    const shuffled = [...ALL_IMAGES].sort(() => Math.random() - 0.5);
    const initial = shuffled.slice(0, GRID_SIZE);
    
    setImages(initial);
    const now = Date.now();
    initial.forEach(img => lastShownAt.current.set(img, now));

    const interval = setInterval(() => {
      setImages((prev) => {
        if (prev.length === 0) return prev;
        
        const next = [...prev];
        const now = Date.now();
        
        // Pick 1 random slot to change
        const slotToChange = Math.floor(Math.random() * GRID_SIZE);
        
        // Find available images that:
        // 1. Are NOT currently displayed
        // 2. Haven't been shown in the last 60 seconds
        const available = ALL_IMAGES.filter(img => {
          const isDisplayed = next.includes(img);
          const lastTime = lastShownAt.current.get(img) || 0;
          return !isDisplayed && (now - lastTime >= COOLDOWN_MS);
        });

        if (available.length > 0) {
          // Replace slot with a fresh image
          const newImg = available[Math.floor(Math.random() * available.length)];
          next[slotToChange] = newImg;
          lastShownAt.current.set(newImg, now);
        } else {
          // Fallback: if pool is exhausted by cooldown (too many slots vs total images),
          // just swap two existing tiles to keep visual interest
          const a = Math.floor(Math.random() * next.length);
          let b = Math.floor(Math.random() * next.length);
          while (b === a) b = Math.floor(Math.random() * next.length);
          [next[a], next[b]] = [next[b], next[a]];
        }
        
        return next;
      });
    }, 2000); // Change one image every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      <div className="grid h-full w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0.5">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square overflow-hidden bg-slate-900">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={img}
                src={img}
                alt=""
                loading="lazy"
                initial={{ opacity: 0, filter: "brightness(0.4) scale(1.2)" }}
                animate={{ opacity: 0.7, filter: "brightness(0.9) scale(1)" }}
                exit={{ opacity: 0, filter: "brightness(0.4) scale(0.8)" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/40 to-black/70" />
    </div>
  );
}
