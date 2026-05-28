import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import all AI-generated football images
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
import ai25 from "@/assets/login-bg/ai-25.jpg";
import ai26 from "@/assets/login-bg/ai-26.jpg";
import ai27 from "@/assets/login-bg/ai-27.jpg";
import ai28 from "@/assets/login-bg/ai-28.jpg";
import ai29 from "@/assets/login-bg/ai-29.jpg";
import ai30 from "@/assets/login-bg/ai-30.jpg";
import ai31 from "@/assets/login-bg/ai-31.jpg";
import ai32 from "@/assets/login-bg/ai-32.jpg";
import ai33 from "@/assets/login-bg/ai-33.jpg";
import ai34 from "@/assets/login-bg/ai-34.jpg";
import ai35 from "@/assets/login-bg/ai-35.jpg";
import ai36 from "@/assets/login-bg/ai-36.jpg";
import ai37 from "@/assets/login-bg/ai-37.jpg";
import ai38 from "@/assets/login-bg/ai-38.jpg";
import ai39 from "@/assets/login-bg/ai-39.jpg";
import ai40 from "@/assets/login-bg/ai-40.jpg";
import ai41 from "@/assets/login-bg/ai-41.jpg";
import ai42 from "@/assets/login-bg/ai-42.jpg";
import ai43 from "@/assets/login-bg/ai-43.jpg";
import ai44 from "@/assets/login-bg/ai-44.jpg";
import ai45 from "@/assets/login-bg/ai-45.jpg";
import ai46 from "@/assets/login-bg/ai-46.jpg";
import ai47 from "@/assets/login-bg/ai-47.jpg";
import ai48 from "@/assets/login-bg/ai-48.jpg";
import ai49 from "@/assets/login-bg/ai-49.jpg";
import ai50 from "@/assets/login-bg/ai-50.jpg";
import ai51 from "@/assets/login-bg/ai-51.jpg";
import ai52 from "@/assets/login-bg/ai-52.jpg";
import ai53 from "@/assets/login-bg/ai-53.jpg";
import ai54 from "@/assets/login-bg/ai-54.jpg";
import ai55 from "@/assets/login-bg/ai-55.jpg";
import ai56 from "@/assets/login-bg/ai-56.jpg";
import ai57 from "@/assets/login-bg/ai-57.jpg";
import ai58 from "@/assets/login-bg/ai-58.jpg";
import ai59 from "@/assets/login-bg/ai-59.jpg";
import ai60 from "@/assets/login-bg/ai-60.jpg";

const FLAMENGO_IMAGES = [ai49, ai50, ai51, ai52, ai53, ai54];
const BRAZIL_IMAGES = [ai55, ai56, ai57, ai58, ai59, ai60];
const OTHER_IMAGES = [
  ai01, ai02, ai03, ai04, ai05, ai06, ai07, ai08, ai09, ai10,
  ai11, ai12, ai13, ai14, ai15, ai16, ai17, ai18, ai19, ai20,
  ai21, ai22, ai23, ai24, ai25, ai26, ai27, ai28, ai29, ai30,
  ai31, ai32, ai33, ai34, ai35, ai36, ai37, ai38, ai39, ai40,
  ai41, ai42, ai43, ai44, ai45, ai46, ai47, ai48
];

const ALL_IMAGES = [...OTHER_IMAGES, ...FLAMENGO_IMAGES, ...BRAZIL_IMAGES];

const GRID_SIZE = 12; // 2 lines x 6 columns
const COOLDOWN_MS = 60000; // 1 minute minimum between showing the same image


export function LoginBackground() {
  const [images, setImages] = useState<string[]>([]);
  // Records the timestamp when an image was LAST removed from the grid
  const lastExitTime = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Initial selection: Ensure 1 Flamengo, 1 Brazil, and 10 random others
    const initialFlamengo = FLAMENGO_IMAGES[Math.floor(Math.random() * FLAMENGO_IMAGES.length)];
    const initialBrazil = BRAZIL_IMAGES[Math.floor(Math.random() * BRAZIL_IMAGES.length)];
    
    const others = ALL_IMAGES.filter(img => img !== initialFlamengo && img !== initialBrazil);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    const initial = [initialFlamengo, initialBrazil, ...shuffledOthers.slice(0, GRID_SIZE - 2)];
    
    // Shuffle the grid so Flamengo/Brazil aren't always in slots 0 and 1
    setImages([...initial].sort(() => Math.random() - 0.5));

    const interval = setInterval(() => {
      setImages((prev) => {
        if (prev.length === 0) return prev;
        
        const next = [...prev];
        const now = Date.now();
        
        // Pick 1 random slot to change
        const slotToChange = Math.floor(Math.random() * GRID_SIZE);
        const oldImg = next[slotToChange];
        
        // Check if removing this image would leave us with 0 Flamengo or 0 Brazil images
        const flamengoCount = next.filter(img => FLAMENGO_IMAGES.includes(img)).length;
        const brazilCount = next.filter(img => BRAZIL_IMAGES.includes(img)).length;
        
        const isOldFlamengo = FLAMENGO_IMAGES.includes(oldImg);
        const isOldBrazil = BRAZIL_IMAGES.includes(oldImg);

        // Determine which pool to pick from
        let pool = ALL_IMAGES;
        if (isOldFlamengo && flamengoCount === 1) {
          pool = FLAMENGO_IMAGES; // Must replace Flamengo with Flamengo
        } else if (isOldBrazil && brazilCount === 1) {
          pool = BRAZIL_IMAGES; // Must replace Brazil with Brazil
        }

        const available = pool.filter(img => {
          const isDisplayed = next.includes(img);
          const exitTime = lastExitTime.current.get(img) || 0;
          return !isDisplayed && (now - exitTime >= COOLDOWN_MS);
        });

        if (available.length > 0) {
          lastExitTime.current.set(oldImg, now);
          const newImg = available[Math.floor(Math.random() * available.length)];
          next[slotToChange] = newImg;
        } 
        
        return next;
      });
    }, 2000);


    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black">
      <div className="grid h-full w-full grid-cols-2 grid-rows-6 sm:grid-cols-3 sm:grid-rows-4 md:grid-cols-4 md:grid-rows-3 lg:grid-cols-6 lg:grid-rows-2 gap-0">
        {images.map((img, idx) => (
          <div key={idx} className="relative h-full w-full overflow-hidden bg-slate-900">
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
