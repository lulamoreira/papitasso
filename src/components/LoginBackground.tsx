import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import all 53 high-quality images
import img01 from "@/assets/login-bg/01.jpg";
import img02 from "@/assets/login-bg/02.jpg";
import img03 from "@/assets/login-bg/03.jpg";
import img04 from "@/assets/login-bg/04.jpg";
import img05 from "@/assets/login-bg/05.jpg";
import img06 from "@/assets/login-bg/06.jpg";
import img07 from "@/assets/login-bg/07.jpg";
import img08 from "@/assets/login-bg/08.jpg";
import img09 from "@/assets/login-bg/09.jpg";
import img10 from "@/assets/login-bg/10.jpg";
import img11 from "@/assets/login-bg/11.jpg";
import img12 from "@/assets/login-bg/12.jpg";
import img13 from "@/assets/login-bg/13.jpg";
import img14 from "@/assets/login-bg/14.jpg";
import img15 from "@/assets/login-bg/15.jpg";
import img16 from "@/assets/login-bg/16.jpg";
import img17 from "@/assets/login-bg/17.jpg";
import img18 from "@/assets/login-bg/18.jpg";
import img19 from "@/assets/login-bg/19.jpg";
import img20 from "@/assets/login-bg/20.jpg";
import img21 from "@/assets/login-bg/21.jpg";
import img22 from "@/assets/login-bg/22.jpg";
import img23 from "@/assets/login-bg/23.jpg";
import img24 from "@/assets/login-bg/24.jpg";
import img25 from "@/assets/login-bg/25.jpg";
import img26 from "@/assets/login-bg/26.jpg";
import img27 from "@/assets/login-bg/27.jpg";
import img28 from "@/assets/login-bg/28.jpg";
import img29 from "@/assets/login-bg/29.jpg";
import img30 from "@/assets/login-bg/30.jpg";
import img31 from "@/assets/login-bg/31.jpg";
import img32 from "@/assets/login-bg/32.jpg";
import img33 from "@/assets/login-bg/33.jpg";
import img34 from "@/assets/login-bg/34.jpg";
import img35 from "@/assets/login-bg/35.jpg";
import img36 from "@/assets/login-bg/36.jpg";
import img37 from "@/assets/login-bg/37.jpg";
import img38 from "@/assets/login-bg/38.jpg";
import img39 from "@/assets/login-bg/39.jpg";
import img40 from "@/assets/login-bg/40.jpg";
import img41 from "@/assets/login-bg/41.jpg";
import img42 from "@/assets/login-bg/42.jpg";
import img43 from "@/assets/login-bg/43.jpg";
import img44 from "@/assets/login-bg/44.jpg";
import img45 from "@/assets/login-bg/45.jpg";
import img46 from "@/assets/login-bg/46.jpg";
import img47 from "@/assets/login-bg/47.jpg";
import img48 from "@/assets/login-bg/48.jpg";
import img49 from "@/assets/login-bg/49.jpg";
import img50 from "@/assets/login-bg/50.jpg";
import img51 from "@/assets/login-bg/51.jpg";
import img52 from "@/assets/login-bg/52.jpg";
import img53 from "@/assets/login-bg/53.jpg";

const ALL_IMAGES = [
  img01, img02, img03, img04, img05, img06, img07, img08, img09, img10,
  img11, img12, img13, img14, img15, img16, img17, img18, img19, img20,
  img21, img22, img23, img24, img25, img26, img27, img28, img29, img30,
  img31, img32, img33, img34, img35, img36, img37, img38, img39, img40,
  img41, img42, img43, img44, img45, img46, img47, img48, img49, img50,
  img51, img52, img53,
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
    }, 3000); // Change one image every 3 seconds

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
                initial={{ opacity: 0, filter: "brightness(0.5) scale(1.15)" }}
                animate={{ opacity: 0.65, filter: "brightness(0.8) scale(1)" }}
                exit={{ opacity: 0, filter: "brightness(0.5) scale(0.9)" }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/30 to-black/60" />
    </div>
  );
}
