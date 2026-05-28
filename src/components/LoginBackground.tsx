import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

const SOCCER_IMAGES = [
  img01, img02, img03, img04, img05, img06,
  img07, img08, img09, img10, img11, img12,
];

const GRID_SIZE = 12; // 2 linhas x 6 colunas no desktop, todas únicas

export function LoginBackground() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const shuffle = () => [...SOCCER_IMAGES].sort(() => Math.random() - 0.5).slice(0, GRID_SIZE);
    setImages(shuffle());

    const interval = setInterval(() => {
      setImages((prev) => {
        if (prev.length === 0) return prev;
        // swap two random tiles entre si (mantém unicidade)
        const next = [...prev];
        const a = Math.floor(Math.random() * next.length);
        let b = Math.floor(Math.random() * next.length);
        while (b === a) b = Math.floor(Math.random() * next.length);
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      });
    }, 2500);

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
                transition={{ duration: 1.4, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/20 to-black/50" />
    </div>
  );
}
