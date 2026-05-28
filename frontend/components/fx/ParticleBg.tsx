"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

type Density = "off" | "subtle" | "dense";

export function ParticleBg({ density = "subtle" }: { density?: Density }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo(() => {
    if (density === "off") return null;
    const number = density === "dense" ? 120 : 50;
    return {
      fullScreen: { enable: false },
      background: { color: "transparent" },
      fpsLimit: 60,
      particles: {
        number: { value: number, density: { enable: true, area: 900 } },
        color: { value: ["#a78bfa", "#67e8f9", "#f0abfc"] },
        opacity: { value: { min: 0.15, max: 0.55 } },
        size: { value: { min: 0.6, max: 2.2 } },
        move: {
          enable: true,
          speed: 0.35,
          direction: "none" as const,
          outModes: { default: "out" as const },
          random: true,
          straight: false,
        },
        links: {
          enable: true,
          distance: 130,
          color: "#a78bfa",
          opacity: 0.08,
          width: 1,
        },
      },
      detectRetina: true,
    };
  }, [density]);

  if (!ready || !options) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Particles id="tsparticles" options={options} />
    </div>
  );
}
