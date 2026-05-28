"use client";
import { motion } from "framer-motion";

export function StreamingMessage({ role, content, streaming }: { role: "ai" | "user"; content: string; streaming?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={role === "user" ? "flex justify-end" : "flex justify-start"}
    >
      <div
        className={
          role === "user"
            ? "max-w-[85%] rounded-2xl bg-violet-500/90 px-3.5 py-2 text-sm text-white"
            : "max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm leading-relaxed text-white/85"
        }
      >
        {content}
        {streaming && <span className="ml-0.5 inline-block animate-pulse">▍</span>}
      </div>
    </motion.div>
  );
}
