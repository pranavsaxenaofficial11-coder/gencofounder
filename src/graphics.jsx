// ============================================================================
// GENERATED MONOCHROME GRAPHICS + SCROLL MOTION KIT
//
// Every visual here is drawn in code — no image assets, nothing to download.
// All ink is `currentColor`, so a plate inherits the surrounding theme and
// works unchanged on paper (light), plate (dark), and inverted ink bands.
//
// Motion: GSAP + ScrollTrigger for scroll choreography (pin, scrub, seamless
// marquee), Framer Motion for component enter/exit and gestures.
//
// Reduced motion is honoured at the source: every effect either resolves to
// its finished state or never registers.
// ============================================================================

import React, { useRef, useEffect, useState, useMemo, useId } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Deterministic PRNG so a given seed always draws the same plate. Keeps
// visuals stable across re-renders instead of reshuffling on every paint.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// SpecimenPlate — the "pictures". Eight generated ink compositions.
// ---------------------------------------------------------------------------

const VARIANTS = [
  "concentric", "arcs", "halftone", "bars",
  "orbit", "warp", "wave", "hatch",
];

export function SpecimenPlate({ seed = 1, variant, className = "", strokeWidth = 1.35 }) {
  const uid = useId().replace(/:/g, "");
  const kind = variant || VARIANTS[seed % VARIANTS.length];

  const shapes = useMemo(() => {
    const rnd = mulberry32(seed * 2654435761);
    const els = [];
    const S = 200; // viewBox is 0 0 200 200

    if (kind === "concentric") {
      const cx = 60 + rnd() * 80, cy = 60 + rnd() * 80;
      const rings = 7 + Math.floor(rnd() * 7);
      for (let i = 0; i < rings; i++) {
        els.push({ t: "circle", cx, cy, r: 6 + i * (S / 2.6 / rings), fill: "none" });
      }
    } else if (kind === "arcs") {
      const n = 5 + Math.floor(rnd() * 5);
      for (let i = 0; i < n; i++) {
        const r = 20 + i * 16;
        const a0 = rnd() * Math.PI * 2;
        const a1 = a0 + 0.8 + rnd() * 2.6;
        const p = (a) => [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
        const [x0, y0] = p(a0), [x1, y1] = p(a1);
        const large = a1 - a0 > Math.PI ? 1 : 0;
        els.push({ t: "path", d: `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}` });
      }
    } else if (kind === "halftone") {
      const cols = 11, rows = 11;
      const fx = rnd(), fy = rnd();
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = 14 + i * 17, y = 14 + j * 17;
          const d = Math.hypot(i / cols - fx, j / rows - fy);
          const r = Math.max(0.4, (1 - d * 1.25) * 6.5);
          if (r > 0.5) els.push({ t: "circle", cx: x, cy: y, r: +r.toFixed(2), solid: true });
        }
      }
    } else if (kind === "bars") {
      const n = 9 + Math.floor(rnd() * 8);
      const w = S / n;
      for (let i = 0; i < n; i++) {
        const h = 24 + rnd() * 150;
        els.push({ t: "rect", x: +(i * w + w * 0.22).toFixed(1), y: +(S - h).toFixed(1), width: +(w * 0.56).toFixed(1), height: +h.toFixed(1), solid: true });
      }
    } else if (kind === "orbit") {
      els.push({ t: "circle", cx: 100, cy: 100, r: 12, solid: true });
      const n = 3 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i++) {
        const rx = 28 + i * 22, ry = (14 + i * 20) * (0.5 + rnd() * 0.8);
        els.push({ t: "ellipse", cx: 100, cy: 100, rx, ry: +ry.toFixed(1), rot: +(rnd() * 180).toFixed(1) });
        const a = rnd() * Math.PI * 2;
        els.push({ t: "circle", cx: +(100 + rx * Math.cos(a)).toFixed(1), cy: +(100 + ry * Math.sin(a)).toFixed(1), r: 3.2, solid: true });
      }
    } else if (kind === "warp") {
      const lines = 13;
      for (let i = 0; i <= lines; i++) {
        const y = (i / lines) * S;
        const amp = 16 * Math.sin((i / lines) * Math.PI);
        const ph = rnd() * 6;
        let d = `M0 ${y.toFixed(1)}`;
        for (let x = 10; x <= S; x += 10) {
          d += ` L${x} ${(y + amp * Math.sin(x / 26 + ph)).toFixed(1)}`;
        }
        els.push({ t: "path", d });
      }
    } else if (kind === "wave") {
      const n = 4 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i++) {
        const base = 40 + i * (120 / n);
        const amp = 10 + rnd() * 26;
        const freq = 18 + rnd() * 22;
        let d = `M0 ${base.toFixed(1)}`;
        for (let x = 6; x <= S; x += 6) d += ` L${x} ${(base + amp * Math.sin(x / freq + i)).toFixed(1)}`;
        els.push({ t: "path", d });
      }
    } else {
      // hatch
      const n = 16 + Math.floor(rnd() * 12);
      const dir = rnd() > 0.5 ? 1 : -1;
      for (let i = 0; i < n; i++) {
        const o = (i / n) * S * 2 - S / 2;
        els.push({ t: "path", d: dir > 0 ? `M${o.toFixed(1)} 0 L${(o + S).toFixed(1)} ${S}` : `M${o.toFixed(1)} ${S} L${(o + S).toFixed(1)} 0` });
      }
    }
    return els;
  }, [seed, kind]);

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`generated ${kind} specimen`}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <g
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="square"
      >
        {shapes.map((s, i) => {
          const solid = s.solid ? { fill: "currentColor", stroke: "none" } : {};
          if (s.t === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} {...solid} />;
          if (s.t === "rect") return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} {...solid} />;
          if (s.t === "ellipse")
            return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} transform={s.rot ? `rotate(${s.rot} 100 100)` : undefined} />;
          return <path key={i} d={s.d} {...solid} />;
        })}
      </g>
      <title>{`${kind}-${seed}`}</title>
      <desc id={uid}>Procedurally generated monochrome specimen.</desc>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// OpposingMarquee — rows of plates sliding PAST each other, opposite ways.
// GSAP drives a seamless wrap; scroll velocity adds a shear so the whole
// field reacts to how fast you scroll.
// ---------------------------------------------------------------------------

export function OpposingMarquee({ rows = 3, perRow = 8, speed = 34, className = "" }) {
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReduced()) return;

    const ctx = gsap.context(() => {
      const tracks = el.querySelectorAll("[data-track]");
      const tweens = [];

      tracks.forEach((track, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        // Each track holds the tiles twice; travelling exactly 50% wraps
        // seamlessly with no visible seam.
        gsap.set(track, { xPercent: dir < 0 ? 0 : -50 });
        tweens.push(
          gsap.to(track, {
            xPercent: dir < 0 ? -50 : 0,
            duration: speed + i * 7,
            ease: "none",
            repeat: -1,
          })
        );
      });

      // Scroll velocity -> shear + speed-up. Reads as one physical system.
      // onUpdate stops firing the moment scrolling stops, so the last non-zero
      // velocity would otherwise leave the field permanently sheared. A settle
      // timer returns it to rest.
      let settle;
      const rest = () => {
        gsap.to(el, { skewY: 0, duration: 0.7, ease: "power3.out", overwrite: true });
        tweens.forEach((t) => gsap.to(t, { timeScale: 1, duration: 0.6, overwrite: true }));
      };

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const v = gsap.utils.clamp(-28, 28, self.getVelocity() / 90);
          gsap.to(el, { skewY: v * 0.16, overwrite: true, duration: 0.5, ease: "power3.out" });
          tweens.forEach((t) => gsap.to(t, { timeScale: 1 + Math.abs(v) / 26, duration: 0.4, overwrite: true }));
          clearTimeout(settle);
          settle = setTimeout(rest, 160);
        },
      });

      return () => { clearTimeout(settle); st.kill(); };
    }, root);

    return () => ctx.revert();
  }, [rows, perRow, speed]);

  return (
    <div ref={root} className={"mo-marquee-field " + className} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="mo-mq-row">
          <div className="mo-mq-track" data-track>
            {Array.from({ length: perRow * 2 }).map((_, i) => (
              <div key={i} className="mo-mq-tile">
                <SpecimenPlate seed={r * 31 + (i % perRow) * 7 + 3} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HalftoneField — canvas dot matrix that swells toward the pointer and
// breathes on its own. Cheap: one canvas, rAF only while visible.
// ---------------------------------------------------------------------------

export function HalftoneField({ className = "", gap = 22, dotMax = 3.4 }) {
  const cvs = useRef(null);

  useEffect(() => {
    const c = cvs.current;
    if (!c) return;
    const ctx2d = c.getContext("2d");
    let raf = 0, w = 0, h = 0, t = 0, visible = true;
    const pointer = { x: -9999, y: -9999 };
    const reduced = prefersReduced();

    const ink = () =>
      getComputedStyle(c).getPropertyValue("color").trim() || "#0a0a0a";

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = c.getBoundingClientRect();
      w = r.width; h = r.height;
      c.width = Math.max(1, Math.floor(w * dpr));
      c.height = Math.max(1, Math.floor(h * dpr));
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.fillStyle = ink();
      for (let x = gap / 2; x < w; x += gap) {
        for (let y = gap / 2; y < h; y += gap) {
          const dp = Math.hypot(x - pointer.x, y - pointer.y);
          const near = Math.max(0, 1 - dp / 190);
          const breathe = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(t / 1400 + (x + y) / 190);
          const r = 0.35 + dotMax * (0.28 * breathe + 0.72 * near);
          ctx2d.globalAlpha = 0.1 + 0.5 * near + 0.1 * breathe;
          ctx2d.beginPath();
          ctx2d.arc(x, y, r, 0, Math.PI * 2);
          ctx2d.fill();
        }
      }
      ctx2d.globalAlpha = 1;
    };

    const loop = (now) => {
      t = now;
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      const r = c.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => { pointer.x = pointer.y = -9999; };

    resize();
    draw();
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(c);
    window.addEventListener("pointermove", onMove, { passive: true });
    c.addEventListener("pointerleave", onLeave);
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerleave", onLeave);
    };
  }, [gap, dotMax]);

  return <canvas ref={cvs} className={className} aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }} />;
}

// ---------------------------------------------------------------------------
// ScrubWipe — children revealed by a clip-path wiped open by scroll position.
// ---------------------------------------------------------------------------

export function ScrubWipe({ children, from = "left", className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      el.style.clipPath = "inset(0% 0% 0% 0%)";
      return;
    }
    const start = from === "left" ? "inset(0% 100% 0% 0%)"
      : from === "right" ? "inset(0% 0% 0% 100%)"
      : "inset(100% 0% 0% 0%)";
    const ctx = gsap.context(() => {
      gsap.fromTo(el,
        { clipPath: start },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: { trigger: el, start: "top 88%", end: "top 42%", scrub: 0.6 },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [from]);

  return <div ref={ref} className={className}>{children}</div>;
}

// ---------------------------------------------------------------------------
// PinnedSteps — pins a section and scrubs through its steps as you scroll.
// ---------------------------------------------------------------------------

export function PinnedSteps({ steps, renderStep, className = "", height = 300 }) {
  const root = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReduced()) return;

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: `+=${steps.length * height}`,
        pin: el.querySelector("[data-pin]"),
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
          setActive(i);
        },
      });
      return () => st.kill();
    }, root);

    return () => ctx.revert();
  }, [steps.length, height]);

  return (
    <div ref={root} className={className}>
      <div data-pin>{renderStep(active, steps)}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// useScrubCounter — a numeral tied to scroll progress rather than to time.
// ---------------------------------------------------------------------------

export function ScrubCounter({ to, prefix = "", suffix = "", decimals = 0, className = "" }) {
  const ref = useRef(null);

  const fmt = (v) =>
    prefix +
    v.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = (v) => { el.textContent = fmt(v); };
    if (prefersReduced()) { set(to); return; }
    const obj = { v: 0 };
    const ctx = gsap.context(() => {
      // Counts up ONCE on entry and stays. Not scrubbed: these are fixed facts
      // ("10 modules"), and a scrubbed tween runs backwards when you scroll up,
      // so the band sat at 0 whenever the page was near the top — which is
      // exactly where a full-page screenshot caught it.
      gsap.to(obj, {
        v: to,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => set(obj.v),
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    }, ref);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, prefix, suffix, decimals]);

  return <span ref={ref} className={className}>{fmt(0)}</span>;
}

// ---------------------------------------------------------------------------
// Refresh ScrollTrigger once fonts/layout settle, so pinned starts are right.
// ---------------------------------------------------------------------------

export function useScrollTriggerRefresh(deps = []) {
  useEffect(() => {
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export { VARIANTS };
