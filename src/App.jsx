// ============================================================================
// GenCopilot — "Your AI Copilot for Startup Success"
// Single-file React app: landing page, auth (login/signup/reset, mock Google
// OAuth, role-based access), dashboard shell, and all 10 track modules with
// interactive charts (Recharts, built on D3) + a live AI assistant widget.
//
// To run outside this preview:
//   npm create vite@latest gencopilot -- --template react
//   npm i recharts lucide-react   (+ Tailwind: tailwindcss @tailwindcss/vite)
//   Drop this file in as src/App.jsx
// ============================================================================

import React, { useState, useEffect, useRef } from "react";
import {
  SpecimenPlate, OpposingMarquee, HalftoneField,
  ScrubWipe, PinnedSteps, ScrubCounter, useScrollTriggerRefresh,
  prefersReduced,
} from "./graphics.jsx";
// React Bits (reactbits.dev) building blocks, installed via the shadcn CLI.
import Aurora from "@/components/Aurora.jsx";
import ClickSpark from "@/components/ClickSpark.jsx";
import AnimatedContent from "@/components/AnimatedContent.jsx";
import SplitText from "@/components/SplitText.jsx";
import BlurText from "@/components/BlurText.jsx";
import ShinyText from "@/components/ShinyText.jsx";
import GradientText from "@/components/GradientText.jsx";
import StarBorder from "@/components/StarBorder.jsx";
import SpotlightCard from "@/components/SpotlightCard.jsx";
import CountUp from "@/components/CountUp.jsx";
import DecryptedText from "@/components/DecryptedText.jsx";
import GlareHover from "@/components/GlareHover.jsx";
import Magnet from "@/components/Magnet.jsx";
import Particles from "@/components/Particles.jsx";
import LightRays from "@/components/LightRays.jsx";
import Waves from "@/components/Waves.jsx";
import DotGrid from "@/components/DotGrid.jsx";

// ---------------------------------------------------------------------------
// reCAPTCHA v3 config
// Set your site key here (the public one — safe to commit).
// Leave empty to disable reCAPTCHA entirely.
// ---------------------------------------------------------------------------
const RECAPTCHA_SITE_KEY = "6LcH43ktAAAAANotCSYkkofLxAJQhpd_dsIis4Hr";

function loadRecaptcha() {
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve(null);
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);
  return new Promise((resolve) => {
    if (document.querySelector(`script[src*="recaptcha"]`)) {
      const check = setInterval(() => { if (window.grecaptcha) { clearInterval(check); resolve(window.grecaptcha); } }, 100);
      setTimeout(() => { clearInterval(check); resolve(null); }, 5000);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.onload = () => {
      try { window.grecaptcha.ready(() => resolve(window.grecaptcha)); } catch { resolve(null); }
    };
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

async function getRecaptchaToken(action) {
  if (!RECAPTCHA_SITE_KEY) return null;
  try {
    const grecaptcha = await loadRecaptcha();
    if (!grecaptcha) return null;
    return await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
  } catch {
    // reCAPTCHA may fail on localhost or if site key doesn't allow the domain
    return null;
  }
}

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  Brush, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Rocket, LayoutDashboard, Target, Inbox, Filter, TrendingDown, Wallet,
  Calculator, ShieldCheck, Workflow, Bot, Bell, Search, ChevronDown,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Send, Sparkles, ArrowRight,
  Check, CheckCircle2, Lock, Mail, MapPin, Phone, Linkedin, Twitter, Github,
  AlertTriangle, DollarSign, Activity, Zap, Clock, Layers, Globe, BarChart3,
  Star, Eye, EyeOff, User, Lightbulb, Loader2, TrendingUp, Users,
  MessageSquare, ListChecks, CalendarDays, Handshake, Settings, Plus,
  Trash2, Edit3, Video, Circle, PlayCircle, PauseCircle, UserCheck,
  Sun, Moon, Maximize2, Copy, Gauge, Flame, Download,
  Heart, Briefcase, MessageCircle,
  Mic, MicOff, Volume2, VolumeX, Square, PanelRightClose,
} from "lucide-react";

// ---------------------------------------------------------------- design ---
// Chart colors are CSS vars so they follow the active palette + theme.
// GREEN/AMBER/RED stay functional (positive/warn/error) across all themes.
const INK = "var(--fg)";
const BLUE = "var(--brand)";
const FUCH = "var(--brand-2)";
const GREEN = "var(--ok)";     // functional ink: growth/healthy
const AMBER = "var(--warn)";
const RED = "var(--danger)";
const SLATE = "var(--fg-muted)";
const GRID = "var(--grid)";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

/* ---------- mobile overflow guards -------------------------------------- */
html, body { max-width:100%; overflow-x:hidden; }
.lp-root { max-width:100vw; overflow-x:hidden; }
.lp-root * { min-width:0; }
@media (max-width: 640px){
  .lp-root .lp-hide-mobile { display:none !important; }
  .lp-root table { font-size:12px; }
}


/* ---------- glassmorphism utility ---------------------------------------- */
.lp-root .lp-glass{
  background:rgba(255,255,255,.8)!important;
  backdrop-filter:blur(16px) saturate(1.5);
  -webkit-backdrop-filter:blur(16px) saturate(1.5);
  border:1px solid var(--border)!important;
}
.lp-root.theme-dark .lp-glass{
  background:rgba(15,15,19,.78)!important;
  backdrop-filter:blur(20px) saturate(1.4);
  -webkit-backdrop-filter:blur(20px) saturate(1.4);
  border:1px solid rgba(255,255,255,.06)!important;
}
/* ---------- design tokens (light default + dark Jarvis override) ---------- */
.lp-root{
  font-family:'Inter',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  color:var(--fg);
  background:var(--bg);
  --bg:#fafafa; --surface:#ffffff; --surface-2:#f5f5f5; --surface-3:#eeeeee;
  --fg:#171717; --fg-2:#4d4d4d; --fg-muted:#888888; --fg-faint:#a1a1a1;
  --border:#ebebeb; --border-2:#e0e0e0;
  --grid:#eaeaea;
  --shadow-sm:0px 1px 1px rgba(0,0,0,.05), 0px 2px 2px rgba(0,0,0,.06);
  --shadow-md:0px 2px 2px rgba(0,0,0,.06), 0px 8px 8px -8px rgba(0,0,0,.06);
  --shadow-xl:0px 1px 1px rgba(0,0,0,.05), 0px 8px 16px -4px rgba(0,0,0,.06), 0px 24px 32px -8px rgba(0,0,0,.09);
  --radius:0.75rem;
  --brand:#8b5cf6; --brand-hover:#7c3aed; --brand-2:#d946ef; --brand-2-hover:#c026d3;
  --brand-soft-bg:#f3f0ff; --brand-soft-2-bg:#fdf2f8;
  --brand-fg-on:#ffffff;
}
/* flat shadow mapping for dark mode (default = dark) */
.lp-root .shadow-sm{box-shadow:var(--shadow-sm);}
.lp-root .shadow-md,.lp-root .hover\:shadow-md:hover{box-shadow:var(--shadow-md);}
.lp-root .rounded-2xl{border-radius:1rem;}
.lp-root .rounded-xl{border-radius:0.75rem;}
/* control radius for buttons/inputs/selects (6-8px) */
.lp-root .rounded-md{border-radius:0.375rem;}
.lp-root .rounded-lg{border-radius:0.5rem;}
/* pill marketing CTAs (radius 100px) */
.lp-root .rounded-full{border-radius:9999px;}

/* ---------- dark theme override (Jarvis dark) ---------------------------- */
.lp-root.theme-dark{
  color-scheme:dark;
  --bg:#09090b; --surface:#0f0f13; --surface-2:#141419; --surface-3:#1a1a22;
  --fg:#fafafa; --fg-2:#d4d4d8; --fg-muted:#71717a; --fg-faint:#52525b;
  --border:rgba(255,255,255,.06); --border-2:rgba(255,255,255,.12);
  --grid:rgba(255,255,255,.04);
  --shadow-sm:0 1px 2px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04);
  --shadow-md:0 4px 12px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04);
  --shadow-xl:0 8px 32px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.04);
  --brand:#a78bfa; --brand-hover:#8b5cf6;
  --brand-soft-bg:rgba(167,139,250,.12); --brand-soft-2-bg:rgba(217,70,239,.12);
}
.lp-root.theme-dark ::-webkit-scrollbar-thumb{ background:rgba(255,255,255,.08); }

/* ---------- brand (Jarvis violet + fuchsia) -------------------------------- */
.lp-root .brand-chip{background-color:var(--brand);}

/* ---------- buttons + inputs (dark glass, hairline) ----------------------- */
.lp-root.theme-light .bg-violet-600{
  box-shadow:none;
}
.lp-root.theme-light .bg-violet-600:hover{
  box-shadow:var(--shadow-md);
}
.lp-root.theme-light .bg-violet-600:active{
  box-shadow:none;
}
.lp-root.theme-light input:not([type=checkbox]):not([type=radio]),
.lp-root.theme-light textarea,
.lp-root.theme-light select{
  background:var(--surface)!important;
  border-color:var(--border)!important;
  box-shadow:none;
}
.lp-root.theme-light input:focus,.lp-root.theme-light textarea:focus,.lp-root.theme-light select:focus{
  box-shadow:0 0 0 2px var(--brand-soft-2-bg)!important;
  border-color:var(--brand)!important;
}
.lp-root.theme-dark input:not([type=checkbox]):not([type=radio]),
.lp-root.theme-dark textarea,
.lp-root.theme-dark select{
  box-shadow:none;
}

/* ---------- sidebar + nav (dark surface, hairline divider) ---------------- */
.lp-root.theme-light .lp-sidebar{
  background:var(--surface)!important;
  border-right-color:var(--border)!important;
  box-shadow:none;
}
/* active sidebar item = violet pill */
.lp-root.theme-light .lp-nav-active{
  box-shadow:none!important;
}

/* ---------- surface/text/border overrides (Tailwind utilities → tokens) --- */
.lp-root .bg-white{background-color:var(--surface)!important;}
.lp-root .bg-gray-100{background-color:var(--surface-2)!important;}
.lp-root .bg-gray-50{background-color:var(--surface-2)!important;}
.lp-root .hover\:bg-gray-100:hover{background-color:var(--surface-2)!important;}
.lp-root .hover\:bg-gray-50:hover{background-color:var(--surface-2)!important;}
.lp-root .border-gray-200{border-color:var(--border)!important;}

/* flat shadow mapping for dark mode */
.lp-root.theme-dark .shadow-sm{box-shadow:var(--shadow-sm)!important;}
.lp-root.theme-dark .shadow-md,.lp-root.theme-dark .hover\:shadow-md:hover{box-shadow:var(--shadow-md)!important;}
.lp-root.theme-dark .shadow,.lp-root.theme-dark .shadow-lg,.lp-root.theme-dark .shadow-xl,.lp-root.theme-dark .shadow-2xl{box-shadow:var(--shadow-xl)!important;}
.lp-root .border-gray-300{border-color:var(--border-2)!important;}
.lp-root .hover\:border-gray-300:hover{border-color:var(--border-2)!important;}
.lp-root .divide-gray-200 > * + *{border-color:var(--border)!important;}
.lp-root .divide-gray-100 > * + *{border-color:var(--border)!important;}

.lp-root .text-slate-900{color:var(--fg)!important;}
.lp-root .text-slate-800{color:var(--fg)!important;}
.lp-root .text-slate-700{color:var(--fg-2)!important;}
.lp-root .text-slate-600{color:var(--fg-muted)!important;}
.lp-root .text-slate-500{color:var(--fg-muted)!important;}
.lp-root .text-slate-400{color:var(--fg-faint)!important;}
.lp-root .text-slate-300{color:var(--fg-faint)!important;}
.lp-root .placeholder-slate-400::placeholder{color:var(--fg-faint)!important;}
/* polarity-flipped bands */
.lp-root .bg-slate-900{background-color:#171717!important;}
.lp-root .bg-slate-800{background-color:#2b2b2b!important;}
.lp-root.theme-dark .bg-slate-900{background-color:#09090b!important;}
.lp-root.theme-dark .bg-slate-800{background-color:#141419!important;}

/* dark-mode input backgrounds so form fields don't stay stark white */
.lp-root.theme-dark input,.lp-root.theme-dark textarea,.lp-root.theme-dark select{
  background-color:var(--surface-2);color:var(--fg);border-color:var(--border-2);
}
.lp-root.theme-dark input::placeholder,.lp-root.theme-dark textarea::placeholder{color:var(--fg-faint);}

/* ---------- typography system (Vercel) ------------------------------------ */
/* mono voice for micro-labels/eyebrows/technical text */
.lp-root .mono,.lp-root .tracking-widest,.lp-root .tracking-wider{
  font-family:var(--mono)!important;
  font-weight:500!important;
  letter-spacing:0.08em!important;
}
/* display weight ceiling: never above 600 */
.lp-root .font-extrabold,.lp-root .font-black{font-weight:600!important;}
.lp-root .font-bold{font-weight:600!important;}
.lp-root .font-semibold{font-weight:600!important;}
/* section eyebrows → muted slate caps */
.lp-root .text-slate-500.uppercase{color:var(--fg-muted)!important;}

/* ---------- brand-color overrides ---------------------------------------- */
.lp-root .bg-violet-600{background-color:var(--brand)!important;}
.lp-root .bg-violet-700{background-color:var(--brand-hover)!important;}
.lp-root .hover\:bg-violet-600:hover{background-color:var(--brand)!important;}
.lp-root .hover\:bg-violet-700:hover{background-color:var(--brand-hover)!important;}
.lp-root .text-violet-600{color:var(--brand)!important;}
.lp-root .text-violet-700{color:var(--brand)!important;}
.lp-root .hover\:text-violet-700:hover{color:var(--brand)!important;}
.lp-root .border-violet-100{border-color:var(--brand-soft-bg)!important;}
.lp-root .border-violet-200{border-color:var(--brand)!important;opacity:1;}
.lp-root .border-violet-300{border-color:var(--brand)!important;}
.lp-root .border-violet-400{border-color:var(--brand)!important;}
.lp-root .border-violet-500{border-color:var(--brand)!important;}
.lp-root .hover\:border-violet-200:hover{border-color:var(--brand)!important;}
.lp-root .hover\:border-violet-400:hover{border-color:var(--brand)!important;}
.lp-root .bg-violet-50{background-color:var(--brand-soft-bg)!important;}
.lp-root .bg-violet-100{background-color:var(--brand-soft-bg)!important;}
.lp-root .hover\:bg-violet-50:hover{background-color:var(--brand-soft-bg)!important;}
.lp-root .hover\:bg-violet-100:hover{background-color:var(--brand-soft-bg)!important;}
.lp-root .accent-violet-600{accent-color:var(--brand)!important;}
.lp-root .accent-blue-600{accent-color:var(--brand)!important;}
.lp-root .focus\:border-violet-500:focus{border-color:var(--brand)!important;}
.lp-root .focus\:ring-violet-100:focus{--tw-ring-color:var(--brand-soft-bg)!important;}
.lp-root .focus\:ring-violet-500:focus{--tw-ring-color:var(--brand)!important;}
.lp-root .focus-visible\:ring-violet-500:focus-visible{--tw-ring-color:var(--brand)!important;}

.lp-root .bg-fuchsia-500{background-color:var(--brand-2)!important;}
.lp-root .bg-fuchsia-600{background-color:var(--brand-2-hover)!important;}
.lp-root .text-fuchsia-400{color:var(--brand-2)!important;}
.lp-root .text-fuchsia-500{color:var(--brand-2)!important;}
.lp-root .text-fuchsia-600{color:var(--brand-2)!important;}
.lp-root .text-fuchsia-700{color:var(--brand-2)!important;}
.lp-root .bg-fuchsia-50{background-color:var(--brand-soft-2-bg)!important;}
.lp-root .bg-fuchsia-100{background-color:var(--brand-soft-2-bg)!important;}
.lp-root .bg-fuchsia-200{background-color:var(--brand-soft-2-bg)!important;}
.lp-root .bg-fuchsia-300{background-color:var(--brand-2)!important;opacity:.6;}
.lp-root .border-fuchsia-200{border-color:var(--brand-2)!important;}
.lp-root .border-l-fuchsia-400{border-left-color:var(--brand-2)!important;}

/* dark mode: brand-filled surfaces take the on-brand ink.
   These hard-coded #fafafa, which was right when .bg-violet-600 was actually
   violet. Under the monochrome layer that class fills with var(--brand) —
   #ffffff in dark theme — so near-white text landed on a white plate at
   1.04:1 (nav + hero "Sign Up Free", the CTA headline, footer "Join"). The
   selector is (0,3,0), so it outranks the (0,2,0) brand-surface rule
   regardless of source order. Point it at the token instead. */
.lp-root.theme-dark .bg-violet-600{color:var(--brand-fg-on)!important;}
.lp-root.theme-dark .bg-violet-700{color:var(--brand-fg-on)!important;}
.lp-root.theme-dark .hover\:bg-violet-700:hover{color:var(--brand-fg-on)!important;}

/* ---------- Recharts tooltip + axes (Jarvis dark) ------------------------- */
.lp-root .recharts-default-tooltip{
  background:var(--surface)!important;
  border:1px solid var(--border-2)!important;
  border-radius:12px!important;
  box-shadow:var(--shadow-md)!important;
  color:var(--fg)!important;
  padding:10px 12px!important;
}
.lp-root .recharts-tooltip-label{color:var(--fg)!important;font-weight:700;margin-bottom:4px;}
.lp-root .recharts-tooltip-item{color:var(--fg-2)!important;}
.lp-root .recharts-tooltip-item-name,.lp-root .recharts-tooltip-item-value{color:var(--fg-2)!important;}
.lp-root .recharts-cartesian-axis-tick text{fill:var(--fg-muted)!important;}
.lp-root .recharts-legend-item-text{color:var(--fg-2)!important;}

/* ---------- animations + primitives -------------------------------------- */
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes floatY2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(20px) scale(1.06)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes jarvisSpin{to{transform:rotate(360deg)}}
.anim-fadeUp{animation:fadeUp .6s ease both}
.anim-slideIn{animation:slideIn .35s cubic-bezier(.2,.7,.2,1) both}
.pulse-dot{animation:pulseDot 1.6s ease infinite}
.jarvis-spin{animation:jarvisSpin 1.6s linear infinite}
.blob{filter:blur(72px);opacity:.5;border-radius:9999px;position:absolute;pointer-events:none}
/* hero section background (no gradients) */
.hero-grad{
  background:var(--bg);
}
.lp-root.theme-dark .hero-grad{
  background:var(--bg);
}
.brand-gradient{background:var(--brand);}
.brand-gradient-br{background:var(--brand);}
.flip{perspective:1200px}
.flip-inner{position:relative;width:100%;height:100%;transition:transform .65s cubic-bezier(.2,.7,.2,1);transform-style:preserve-3d}
.flip:hover .flip-inner,.flip:focus-within .flip-inner{transform:rotateY(180deg)}
.flip-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:1rem}
.flip-back{transform:rotateY(180deg)}
.map-grid{background-image:linear-gradient(rgba(139,92,246,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,.10) 1px,transparent 1px);background-size:28px 28px}
.scroll-thin::-webkit-scrollbar{width:6px;height:6px}
.scroll-thin::-webkit-scrollbar-thumb{background:var(--border-2);border-radius:9999px}
.scroll-thin::-webkit-scrollbar-track{background:transparent}

/* click-through affordance on chart bars/points */
.recharts-bar-rectangle,.recharts-area-dot,.recharts-line-dot{cursor:pointer}

@media (prefers-reduced-motion: reduce){
  .anim-fadeUp,.anim-slideIn,.blob,.hero-grad,.pulse-dot,.jarvis-spin{animation:none !important}
  .flip-inner{transition:none}
}

/* ==========================================================================
   MONOCHROME EDITORIAL — override layer (wins by source order)
   Ink on paper. Zero radius. No shadows. No gradients. No glass.
   Playfair Display display / Source Serif 4 body / JetBrains Mono data.
   ========================================================================== */

/* ---------- tokens: light = paper, dark = plate (pure inversion) --------- */
.lp-root{
  font-family:'Source Serif 4',Georgia,'Times New Roman',serif;
  font-variant-numeric:tabular-nums;
  --display:'Playfair Display',Georgia,serif;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --bg:#ffffff; --surface:#ffffff; --surface-2:#f5f5f5; --surface-3:#ebebeb;
  --fg:#0a0a0a; --fg-2:#262626; --fg-muted:#595959; --fg-faint:#878787;
  --border:#e5e5e5; --border-2:#0a0a0a;
  --grid:#ececec;
  --shadow-sm:none; --shadow-md:none; --shadow-xl:none;
  --radius:0;
  --brand:#0a0a0a; --brand-hover:#333333; --brand-2:#595959; --brand-2-hover:#404040;
  --brand-soft-bg:#f5f5f5; --brand-soft-2-bg:#efefef;
  --brand-fg-on:#ffffff;
  --ok:#0f7a4d; --warn:#a35c0a; --danger:#b32020;
  --ok-soft:rgba(15,122,77,.09); --warn-soft:rgba(163,92,10,.10); --danger-soft:rgba(179,32,32,.09);
}
.lp-root.theme-dark{
  color-scheme:dark;
  --bg:#0a0a0a; --surface:#0a0a0a; --surface-2:#171717; --surface-3:#232323;
  --fg:#ffffff; --fg-2:#e5e5e5; --fg-muted:#a3a3a3; --fg-faint:#8a8a8a;
  --border:#262626; --border-2:#ffffff;
  --grid:#1f1f1f;
  --shadow-sm:none; --shadow-md:none; --shadow-xl:none;
  --brand:#ffffff; --brand-hover:#d4d4d4; --brand-2:#a3a3a3; --brand-2-hover:#c4c4c4;
  --brand-soft-bg:#171717; --brand-soft-2-bg:#1f1f1f;
  --brand-fg-on:#0a0a0a;
  --ok:#3ecf8e; --warn:#e8a33d; --danger:#f07575;
  --ok-soft:rgba(62,207,142,.13); --warn-soft:rgba(232,163,61,.13); --danger-soft:rgba(240,117,117,.13);
}

/* ---------- the three laws: no radius, no shadow, no glass --------------- */
.lp-root [class*="rounded"]{border-radius:0!important}
.lp-root [class*="shadow"]{box-shadow:none!important;text-shadow:none!important}
.lp-root .blob{display:none!important}
.lp-root .lp-glass,.lp-root.theme-dark .lp-glass{
  background:var(--surface)!important;
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  border:1px solid var(--border)!important;
}
.lp-root .active\\:scale-95:active,.lp-root .hover\\:scale-105:hover{transform:none!important}
.lp-root button{transition:none!important}
.lp-root .map-grid{background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px)!important}

/* paper grain */
.lp-root::after{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:2147483647;opacity:.028;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>");
}

/* ---------- typography: editorial voice ---------------------------------- */
.lp-root h1,.lp-root h2,.lp-root .font-display{
  font-family:var(--display)!important;font-weight:700!important;letter-spacing:-0.015em!important;
}
.lp-root h1 .italic,.lp-root h2 .italic,.lp-root .font-display .italic{font-family:var(--display)!important;font-style:italic}
.lp-root .font-extrabold,.lp-root .font-black{font-weight:700!important}
.lp-root .font-bold,.lp-root .font-semibold{font-weight:600!important}
.lp-root .mono,.lp-root .tracking-widest,.lp-root .tracking-wider{
  font-family:var(--mono)!important;font-weight:500!important;letter-spacing:.08em!important;
}
/* pill CTAs (Btn) become mono caps specimens */
.lp-root button.rounded-full{
  font-family:var(--mono)!important;font-size:.8125rem!important;
  letter-spacing:.04em!important;text-transform:uppercase!important;font-weight:500!important;
}
.lp-root input,.lp-root textarea,.lp-root select{
  font-family:var(--mono)!important;font-size:13px!important;letter-spacing:.01em;
}
.lp-root th{font-family:var(--mono)!important;font-weight:500!important;letter-spacing:.06em!important}
.lp-root .sect-rule{border-bottom:2px solid var(--fg);padding-bottom:1.25rem}
.lp-root :focus-visible{outline:2px solid var(--fg);outline-offset:2px}

/* ---------- text remaps (declared BEFORE surface pair-rules) -------------- */
.lp-root .text-white{color:var(--fg)!important}
.lp-root .text-white\\/90,.lp-root .text-white\\/85,.lp-root .text-white\\/80{color:var(--fg-2)!important}
.lp-root .text-white\\/75,.lp-root .text-white\\/70{color:var(--fg-muted)!important}
.lp-root .text-zinc-100,.lp-root .text-zinc-200,.lp-root .text-zinc-300{color:var(--fg-2)!important}
.lp-root .text-zinc-400,.lp-root .text-zinc-500{color:var(--fg-muted)!important}
.lp-root .text-zinc-900{color:var(--fg)!important}
.lp-root .placeholder-zinc-500::placeholder{color:var(--fg-faint)!important}
.lp-root .text-slate-900,.lp-root .text-slate-800{color:var(--fg)!important}
.lp-root .text-slate-700,.lp-root .text-slate-600{color:var(--fg-2)!important}
.lp-root .text-slate-500{color:var(--fg-muted)!important}
.lp-root .text-slate-400,.lp-root .text-slate-300{color:var(--fg-faint)!important}
.lp-root .placeholder-slate-400::placeholder{color:var(--fg-faint)!important}

/* violet/fuchsia → ink */
.lp-root .text-violet-400,.lp-root .text-violet-500,.lp-root .text-violet-600,.lp-root .text-violet-700,
.lp-root .hover\\:text-violet-400:hover,.lp-root .hover\\:text-violet-700:hover,
.lp-root .text-fuchsia-400,.lp-root .text-fuchsia-500,.lp-root .text-fuchsia-600,.lp-root .text-fuchsia-700{color:var(--brand)!important}
.lp-root .bg-violet-50,.lp-root .bg-violet-100,.lp-root .bg-violet-500\\/10,.lp-root .bg-violet-600\\/10,
.lp-root .hover\\:bg-violet-50:hover,.lp-root .hover\\:bg-violet-100:hover,.lp-root .hover\\:bg-violet-500\\/20:hover,
.lp-root .bg-fuchsia-50,.lp-root .bg-fuchsia-100,.lp-root .bg-fuchsia-200{background-color:var(--brand-soft-bg)!important}
.lp-root .border-violet-100,.lp-root .border-violet-500\\/20{border-color:var(--border)!important}
.lp-root .border-violet-200,.lp-root .border-violet-300,.lp-root .border-violet-400,.lp-root .border-violet-500,
.lp-root .hover\\:border-violet-200:hover,.lp-root .hover\\:border-violet-300:hover,.lp-root .hover\\:border-violet-400:hover,
.lp-root .border-fuchsia-200,.lp-root .border-l-fuchsia-400{border-color:var(--fg)!important}
.lp-root .accent-violet-600,.lp-root .accent-blue-600{accent-color:var(--brand)!important}
.lp-root .focus\\:border-violet-500:focus{border-color:var(--fg)!important}
.lp-root .focus\\:ring-violet-100:focus,.lp-root .focus\\:ring-violet-500:focus,
.lp-root .focus\\:ring-violet-500\\/20:focus,.lp-root .focus-visible\\:ring-violet-500:focus-visible{--tw-ring-color:var(--fg)!important}

/* functional trio — muted print inks, still semantic */
.lp-root .text-emerald-300,.lp-root .text-emerald-400,.lp-root .text-emerald-500,.lp-root .text-emerald-600,.lp-root .text-emerald-700{color:var(--ok)!important}
.lp-root .text-amber-300,.lp-root .text-amber-400,.lp-root .text-amber-500,.lp-root .text-amber-600,.lp-root .text-amber-700{color:var(--warn)!important}
.lp-root .text-red-300,.lp-root .text-red-400,.lp-root .text-red-500,.lp-root .text-red-600{color:var(--danger)!important}
.lp-root .bg-emerald-50,.lp-root .bg-emerald-50\\/60,.lp-root .bg-emerald-500\\/10,.lp-root .bg-emerald-500\\/20{background-color:var(--ok-soft)!important}
.lp-root .bg-amber-50,.lp-root .bg-amber-500\\/10,.lp-root .bg-amber-500\\/20{background-color:var(--warn-soft)!important}
.lp-root .bg-red-50,.lp-root .bg-red-500\\/10,.lp-root .bg-red-500\\/20{background-color:var(--danger-soft)!important}
.lp-root .border-emerald-100,.lp-root .border-emerald-200,.lp-root .border-emerald-500\\/20{border-color:var(--ok)!important}
.lp-root .border-amber-200,.lp-root .border-amber-500\\/20{border-color:var(--warn)!important}
.lp-root .border-red-200,.lp-root .border-red-500\\/20{border-color:var(--danger)!important}
.lp-root .bg-emerald-500,.lp-root .bg-emerald-600,.lp-root .hover\\:bg-emerald-600:hover{background-color:var(--ok)!important;color:#ffffff!important}
.lp-root .bg-amber-500{background-color:var(--warn)!important;color:#ffffff!important}
.lp-root .bg-red-500,.lp-root .bg-red-600{background-color:var(--danger)!important;color:#ffffff!important}

/* ---------- surface remaps ------------------------------------------------ */
.lp-root .bg-white{background-color:var(--surface)!important}
.lp-root .bg-gray-50,.lp-root .bg-gray-100,
.lp-root .hover\\:bg-gray-50:hover,.lp-root .hover\\:bg-gray-100:hover{background-color:var(--surface-2)!important}
.lp-root .bg-zinc-200{background-color:var(--surface-3)!important}
.lp-root .bg-white\\/5,.lp-root .bg-white\\/10,.lp-root .bg-white\\/12,
.lp-root .hover\\:bg-white\\/5:hover,.lp-root .hover\\:bg-white\\/10:hover{background-color:var(--surface-2)!important}
.lp-root .bg-white\\/15,.lp-root .bg-white\\/20,.lp-root .bg-white\\/25,
.lp-root .hover\\:bg-white\\/20:hover,.lp-root .hover\\:bg-white\\/25:hover{background-color:var(--surface-3)!important}
.lp-root .border-white\\/5,.lp-root .border-white\\/6,.lp-root .border-white\\/8,.lp-root .border-white\\/10,
.lp-root .border-white\\/15,.lp-root .border-white\\/20,
.lp-root .hover\\:border-white\\/20:hover{border-color:var(--border)!important}
.lp-root .border-white{border-color:var(--bg)!important}
.lp-root .border-gray-200,.lp-root .divide-gray-200 > * + *,.lp-root .divide-gray-100 > * + *{border-color:var(--border)!important}
.lp-root .border-gray-300,.lp-root .hover\\:border-gray-300:hover{border-color:var(--border-2)!important}
.lp-root .border-black{border-color:var(--fg)!important}
.lp-root .bg-black\\/30{background-color:rgba(0,0,0,.40)!important}
.lp-root .bg-black\\/45,.lp-root .bg-black\\/60{background-color:rgba(0,0,0,.55)!important}

/* ---------- inverted plates (stay ink-filled in light mode) --------------- */
.lp-root .bg-slate-900,.lp-root .bg-slate-800,.lp-root .bg-zinc-900,.lp-root .bg-\\[\\#060608\\],.lp-root .ink-invert{
  --bg:#0a0a0a; --surface:#0a0a0a; --surface-2:#171717; --surface-3:#232323;
  --fg:#ffffff; --fg-2:#e5e5e5; --fg-muted:#a3a3a3; --fg-faint:#787878;
  --border:#262626; --border-2:#ffffff; --grid:#1f1f1f;
  --brand-soft-bg:#171717; --brand-soft-2-bg:#1f1f1f;
  /* --fg-faint was #787878, which is 4.48:1 on this #0a0a0a plate — just under
     the 4.5 floor. .text-slate-300 maps here, so every footer link and the
     footer body copy failed together. #8a8a8a clears it at ~5.7:1. */
  --fg-faint:#8a8a8a;
  /* --brand MUST invert with the plate. Without this it stays light-theme
     ink (#0a0a0a) and every brand-coloured element — stat numerals, footer
     links, kickers — renders black on a black plate, i.e. invisible. */
  --brand:#ffffff; --brand-hover:#d4d4d4; --brand-2:#a3a3a3; --brand-2-hover:#c4c4c4;
  --brand-fg-on:#0a0a0a;
  background-color:#0a0a0a!important;color:#ffffff;
}
.lp-root.theme-dark .bg-slate-900,.lp-root.theme-dark .bg-slate-800,
.lp-root.theme-dark .bg-zinc-900,.lp-root.theme-dark .bg-\\[\\#060608\\],.lp-root.theme-dark .ink-invert{
  border:1px solid var(--border);
}

/* inverted chip idiom: selected state flips ink */
.lp-root .bg-white.text-zinc-900{background-color:var(--fg)!important;color:var(--bg)!important}

/* ---------- brand surfaces (buttons, active nav, fills) ------------------- */
.lp-root .bg-violet-500,.lp-root .bg-violet-600,.lp-root .hover\\:bg-violet-600:hover{
  background-color:var(--brand)!important;color:var(--brand-fg-on)!important;
}
.lp-root .bg-violet-700,.lp-root .hover\\:bg-violet-700:hover{
  background-color:var(--brand-hover)!important;color:var(--brand-fg-on)!important;
}
.lp-root .bg-fuchsia-500,.lp-root .bg-fuchsia-600{background-color:var(--brand-2)!important;color:var(--brand-fg-on)!important}
.lp-root .bg-zinc-800,.lp-root .hover\\:bg-zinc-700:hover{background-color:var(--brand)!important;color:var(--brand-fg-on)!important}
/* descendants of brand-filled elements read as on-brand */
.lp-root .bg-violet-600 .text-white,.lp-root .bg-violet-700 .text-white,.lp-root .bg-zinc-800 .text-white,
.lp-root .bg-violet-600 .text-white\\/80,.lp-root .bg-violet-600 .text-zinc-400{color:var(--brand-fg-on)!important}
.lp-root .bg-violet-600 .bg-white\\/10,.lp-root .bg-violet-600 .bg-white\\/15,.lp-root .bg-violet-600 .bg-white\\/20,.lp-root .bg-violet-600 .bg-white\\/25{
  background-color:transparent!important;border:1px solid var(--brand-fg-on)!important;
}
.lp-root .brand-chip,.lp-root .brand-gradient,.lp-root .brand-gradient-br{background:var(--brand)!important;color:var(--brand-fg-on)!important}

/* active sidebar item: full inversion block */
.lp-root .lp-nav-active{background:var(--fg)!important;color:var(--bg)!important;box-shadow:none!important}
.lp-root .lp-nav-active *{color:var(--bg)!important}
.lp-root .lp-sidebar{background:var(--surface)!important;border-right:1px solid var(--border)!important}

/* ---------- inputs: printed-form fields ----------------------------------- */
.lp-root input:not([type=checkbox]):not([type=radio]):not([type=range]),.lp-root textarea,.lp-root select{
  background:var(--surface)!important;border-color:var(--border-2)!important;
  color:var(--fg)!important;caret-color:var(--fg)!important;box-shadow:none!important;
}
.lp-root input:not([type=range]):focus,.lp-root textarea:focus,.lp-root select:focus{
  border-color:var(--fg)!important;box-shadow:none!important;outline:2px solid var(--fg);outline-offset:0;
}
.lp-root input::placeholder,.lp-root textarea::placeholder{color:var(--fg-faint)!important}
/* browser autofill repaints text/bg — pin it to the ink tokens */
.lp-root input:-webkit-autofill,.lp-root input:-webkit-autofill:hover,.lp-root input:-webkit-autofill:focus{
  -webkit-text-fill-color:var(--fg)!important;
  -webkit-box-shadow:0 0 0 1000px var(--surface) inset!important;
  transition:background-color 9999s ease-out;
}

/* ---------- charts: ink figures ------------------------------------------- */
.lp-root .recharts-default-tooltip{
  background:var(--surface)!important;border:1px solid var(--fg)!important;border-radius:0!important;
  box-shadow:none!important;color:var(--fg)!important;padding:10px 12px!important;
  font-family:var(--mono)!important;font-size:12px!important;
}
.lp-root .recharts-tooltip-label{color:var(--fg)!important;font-weight:600;margin-bottom:4px}
.lp-root .recharts-tooltip-item,.lp-root .recharts-tooltip-item-name,.lp-root .recharts-tooltip-item-value{color:var(--fg-2)!important}
.lp-root .recharts-cartesian-axis-tick text{fill:var(--fg-muted)!important;font-family:var(--mono)!important;font-size:10.5px!important}
.lp-root .recharts-legend-item-text{color:var(--fg-2)!important;font-family:var(--mono)!important;font-size:11px!important}

/* ---------- scrollbars ----------------------------------------------------- */
.lp-root .scroll-thin::-webkit-scrollbar-thumb{background:var(--fg-faint);border-radius:0}
.lp-root.theme-dark ::-webkit-scrollbar-thumb{background:#3a3a3a}

/* ---------- AI chat input: PERMANENT white field / black ink -------------- */
/* Hard-pinned hex (not tokens) so no theme, panel, or autofill repaints it. */
.lp-root input.chat-input,
.lp-root.theme-dark input.chat-input,
.lp-root .ink-invert input.chat-input{
  background:#ffffff!important;
  color:#0a0a0a!important;
  caret-color:#0a0a0a!important;
  -webkit-text-fill-color:#0a0a0a!important;
  border:1px solid #0a0a0a!important;
  padding:8px 12px!important;
}
.lp-root input.chat-input::placeholder{color:#8a8a8a!important;-webkit-text-fill-color:#8a8a8a!important}
.lp-root input.chat-input:focus{outline:2px solid #0a0a0a!important;outline-offset:0}

/* ---------- user chat bubble: PERMANENT dark ink on light paper ----------- */
/* Hard-pinned so the founder's own messages are readable in every chat
   surface (widget, Jarvis plate, interview) and both themes. */
.lp-root .chat-user-msg{
  background:#ffffff!important;
  color:#111827!important;
  border:1px solid #0a0a0a!important;
}

/* ==========================================================================
   MONOCHROME MOTION — motion layer (wins by source order)
   Obeys the three laws: no radius, no shadow, no glass, no colour.
   Everything here moves ink; nothing here tints it.
   ========================================================================== */

/* ---------- masked line rise (headlines, stacked lines) ------------------- */
.lp-root .mo-mask{overflow:hidden;display:block}
.lp-root .mo-rise{
  display:inline-block;
  transform:translateY(105%) rotate(1.5deg);
  opacity:0;
  animation:moRise 1s cubic-bezier(.16,1,.3,1) both;
}
@keyframes moRise{
  from{transform:translateY(105%) rotate(1.5deg);opacity:0}
  to{transform:translateY(0) rotate(0);opacity:1}
}

/* ---------- letter-by-letter mono eyebrow --------------------------------- */
.lp-root .mo-char{
  display:inline-block;
  opacity:0;
  animation:moChar .5s cubic-bezier(.16,1,.3,1) both;
}
@keyframes moChar{
  from{opacity:0;transform:translateY(-6px)}
  to{opacity:1;transform:translateY(0)}
}

/* ---------- rule that draws itself L to R -------------------------------- */
.lp-root .mo-rule{
  height:1px;background:var(--fg);transform:scaleX(0);transform-origin:left center;
  animation:moRule 1.1s cubic-bezier(.16,1,.3,1) both;
}
.lp-root .mo-rule-thick{height:2px}
@keyframes moRule{from{transform:scaleX(0)}to{transform:scaleX(1)}}

/* ---------- scanning hairline (editorial sweep, ink only) ----------------- */
.lp-root .mo-scan{position:relative;overflow:hidden}
.lp-root .mo-scan::before{
  content:"";position:absolute;left:0;top:0;width:100%;height:1px;
  background:var(--fg);opacity:.28;
  animation:moScan 7s linear infinite;
}
@keyframes moScan{
  0%{transform:translateY(0)}
  100%{transform:translateY(100vh)}
}

/* ---------- magnetic CTA: overrides the global button transition kill ----- */
.lp-root button.mo-magnet{
  transition:transform .35s cubic-bezier(.16,1,.3,1),
             background-color .35s ease,
             color .35s ease!important;
  will-change:transform;
  position:relative;overflow:hidden;
}
.lp-root button.mo-magnet::after{
  content:"";position:absolute;inset:0;background:var(--fg);
  transform:translateY(101%);transition:transform .4s cubic-bezier(.16,1,.3,1);
  z-index:0;
}
.lp-root button.mo-magnet:hover::after{transform:translateY(0)}
.lp-root button.mo-magnet > span{position:relative;z-index:1;transition:color .3s ease}
.lp-root button.mo-magnet:hover > span{color:var(--bg)}
/* inverted variant sits on ink plates and flips the other way */
.lp-root button.mo-magnet-inv::after{background:var(--bg)}
.lp-root button.mo-magnet-inv:hover > span{color:var(--fg)}

/* ---------- animated paper grain (the existing overlay, now breathing) ---- */
.lp-root::after{animation:moGrain 6s steps(6) infinite}
@keyframes moGrain{
  0%{transform:translate(0,0)}
  20%{transform:translate(-2%,1%)}
  40%{transform:translate(1%,-2%)}
  60%{transform:translate(-1%,-1%)}
  80%{transform:translate(2%,1%)}
  100%{transform:translate(0,0)}
}

/* ---------- mono marquee ticker ------------------------------------------- */
.lp-root .mo-marquee{overflow:hidden;position:relative;display:flex}
.lp-root .mo-marquee-track{
  display:flex;flex:0 0 auto;gap:2.5rem;padding-right:2.5rem;
  animation:moMarquee 32s linear infinite;
  will-change:transform;
}
.lp-root .mo-marquee:hover .mo-marquee-track{animation-play-state:paused}
@keyframes moMarquee{from{transform:translateX(0)}to{transform:translateX(-100%)}}

/* ---------- scroll reveal ------------------------------------------------- */
.lp-root .mo-reveal{opacity:0;transform:translateY(24px);
  transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)}
.lp-root .mo-reveal.mo-in{opacity:1;transform:translateY(0)}

/* ---------- hairline frame that traces its own border -------------------- */
.lp-root .mo-trace{position:relative}
.lp-root .mo-trace::before,.lp-root .mo-trace::after{
  content:"";position:absolute;background:var(--fg);opacity:.85;
}
.lp-root .mo-trace::before{
  top:0;left:0;height:1px;width:100%;transform:scaleX(0);transform-origin:left;
  animation:moRule .9s cubic-bezier(.16,1,.3,1) .15s both;
}
.lp-root .mo-trace::after{
  top:0;left:0;width:1px;height:100%;transform:scaleY(0);transform-origin:top;
  animation:moTraceY .9s cubic-bezier(.16,1,.3,1) .45s both;
}
@keyframes moTraceY{from{transform:scaleY(0)}to{transform:scaleY(1)}}

/* ---------- data tick (counters, mono numerals) -------------------------- */
.lp-root .mo-tick{font-variant-numeric:tabular-nums;font-family:var(--mono)!important}

/* ---------- parallax layer ----------------------------------------------- */
.lp-root .mo-parallax{will-change:transform}

/* ---------- caret blink for the live-typing idiom ------------------------ */
.lp-root .mo-caret::after{
  content:"";display:inline-block;width:.5em;height:1em;
  background:currentColor;margin-left:.15em;vertical-align:-.1em;
  animation:moCaret 1.1s steps(1) infinite;
}
@keyframes moCaret{0%,50%{opacity:1}50.01%,100%{opacity:0}}

/* ---------- chart stroke draw-in ---------------------------------------- */
.lp-root .mo-draw .recharts-area-curve,
.lp-root .mo-draw .recharts-line-curve{
  stroke-dasharray:2000;stroke-dashoffset:2000;
  animation:moDraw 2.4s cubic-bezier(.16,1,.3,1) .3s both;
}
@keyframes moDraw{to{stroke-dashoffset:0}}

/* ---------- tap targets --------------------------------------------------
   Footer links were 14px text with no padding, so their hit boxes came in
   under the 24x24 WCAG 2.5.8 floor. Give every footer control a 24px minimum
   without changing how it looks. */
.lp-root footer button,.lp-root footer a{
  min-height:24px;display:inline-flex;align-items:center;
}

/* ---------- brand plate polarity ----------------------------------------
   A brand-filled surface (.bg-violet-*, .bg-zinc-800) is an ink plate too:
   --brand fills it, --brand-fg-on writes on it. But it never re-pointed the
   text ramp, so a descendant .text-white/85 still resolved to --fg-2 (#262626)
   and rendered near-black on a near-black plate (~1.6:1). Same class of bug as
   the inverted-plate --brand omission. Re-point the ramp with the plate. */
.lp-root .bg-violet-500,.lp-root .bg-violet-600,.lp-root .bg-violet-700,.lp-root .bg-zinc-800{
  --fg:#ffffff; --fg-2:#e5e5e5; --fg-muted:#a3a3a3; --fg-faint:#8a8a8a;
  --border:#3a3a3a; --border-2:#ffffff;
  --bg:#0a0a0a; /* the plate's own fill, so nested controls can key off it */
}
/* In dark theme the brand plate is white, so the ramp flips back to ink. */
.lp-root.theme-dark .bg-violet-500,.lp-root.theme-dark .bg-violet-600,
.lp-root.theme-dark .bg-violet-700,.lp-root.theme-dark .bg-zinc-800{
  --fg:#0a0a0a; --fg-2:#262626; --fg-muted:#595959; --fg-faint:#878787;
  --border:#d4d4d4; --border-2:#0a0a0a;
  --bg:#ffffff;
}

/* Buttons sitting ON a brand plate.
   Btn's variants carry .bg-zinc-800 / .bg-white, both of which remap to
   var(--brand) — the very colour filling the plate — so the CTA buttons were
   #0a0a0a on a #0a0a0a plate: correct label, invisible button. Key them to the
   plate's own ramp instead: primary is a filled pill, secondary an outline. */
.lp-root [class*="bg-violet-"] button.bg-white{
  background-color:var(--fg)!important;
  color:var(--bg)!important;
  border:1px solid var(--fg)!important;
}
.lp-root [class*="bg-violet-"] button:not(.bg-white){
  background-color:transparent!important;
  color:var(--fg)!important;
  border:1px solid var(--fg)!important;
}
/* mo-magnet's ink-fill overlay must also flip to the plate's ramp */
.lp-root [class*="bg-violet-"] button.mo-magnet::after{background:var(--fg)!important}
.lp-root [class*="bg-violet-"] button.mo-magnet.bg-white::after{background:var(--bg)!important}
.lp-root [class*="bg-violet-"] button.mo-magnet:hover > span{color:var(--bg)!important}
.lp-root [class*="bg-violet-"] button.mo-magnet.bg-white:hover > span{color:var(--fg)!important}

/* ---------- generated specimen field (plates sliding past each other) ----- */
.lp-root .mo-marquee-field{
  display:flex;flex-direction:column;gap:18px;
  overflow:hidden;pointer-events:none;
  will-change:transform;
}
.lp-root .mo-mq-row{overflow:hidden;display:flex}
.lp-root .mo-mq-track{
  display:flex;flex:0 0 auto;gap:18px;align-items:center;
  will-change:transform;
}
.lp-root .mo-mq-tile{
  flex:0 0 auto;width:132px;height:132px;
  border:1px solid var(--border-2);
  padding:14px;
  color:var(--fg);
  opacity:.82;
  background:var(--surface);
  overflow:hidden; /* the hatch/warp variants draw past the viewBox on purpose */
}
.lp-root .mo-mq-row:nth-child(even) .mo-mq-tile{opacity:.55;border-color:var(--border)}
@media (max-width:640px){
  .lp-root .mo-mq-tile{width:92px;height:92px;padding:10px}
}

/* halftone canvas inherits ink so it flips with the plate */
.lp-root .mo-halftone{color:var(--fg);opacity:.55}

/* ---------- public copilot: launcher + floating panel -------------------- */
/* Obeys the three laws — square, hairline ink border, no shadow, no glass. */
.lp-root .pc-launcher{
  background:var(--bg);border:1px solid var(--fg);color:var(--fg);
}
.lp-root .pc-launcher:hover{background:var(--fg);color:var(--bg)}
/* The orb draws light dots on transparency, so its well stays ink-black in
   BOTH themes. Following --bg would erase it the moment the plate inverts. */
.lp-root .pc-launcher-orb{
  display:block;width:30px;height:30px;background:#0a0a0a;flex:none;
}
.lp-root .pc-panel{
  background:#0a0a0a;border:1px solid var(--fg);
}

/* ---------- respect the user ------------------------------------------- */
@media (prefers-reduced-motion: reduce){
  .lp-root .mo-marquee-field{transform:none!important}
  /* Inline style="animation:floatY/floatY2" survived the original guard, which
     only named classes. The audit caught the hero's floating quote card still
     looping under reduce. Kill every animation on the marketing surface and
     re-enable nothing: the named resets below restore final states. */
  .lp-root [style*="floatY"]{animation:none!important}
  .lp-root .mo-rise,.lp-root .mo-char,.lp-root .mo-rule,
  .lp-root .mo-trace::before,.lp-root .mo-trace::after,
  .lp-root .mo-marquee-track,.lp-root .mo-draw .recharts-area-curve,
  .lp-root .mo-draw .recharts-line-curve{animation:none!important}
  .lp-root .mo-scan::before,.lp-root::after{animation:none!important}
  .lp-root .mo-caret::after{animation:none!important}
  .lp-root .mo-rise{transform:none!important;opacity:1!important}
  .lp-root .mo-char{opacity:1!important;transform:none!important}
  .lp-root .mo-rule{transform:scaleX(1)!important}
  .lp-root .mo-trace::before{transform:scaleX(1)!important}
  .lp-root .mo-trace::after{transform:scaleY(1)!important}
  .lp-root .mo-reveal{opacity:1!important;transform:none!important;transition:none!important}
  .lp-root button.mo-magnet{transition:none!important}
  .lp-root .mo-draw .recharts-area-curve,
  .lp-root .mo-draw .recharts-line-curve{stroke-dashoffset:0!important}
}

/* ---------- overlay surfaces ---------------------------------------------
   The "three laws" above strip glass, radius and shadow from the whole
   marketing surface. Modals are the deliberate exception: they float ABOVE
   the page, so they need to read as a separate plane. These rules sit after
   the laws and match their specificity, so they win for opted-in elements
   only — the flat editorial treatment everywhere else is untouched. */
.lp-root .gc-overlay-scrim{
  background:rgba(9,9,12,.55)!important;
  backdrop-filter:blur(10px) saturate(1.1);
  -webkit-backdrop-filter:blur(10px) saturate(1.1);
  animation:gcScrimIn .28s ease both;
}
.lp-root .gc-overlay-panel{
  background:rgba(255,255,255,.86)!important;
  backdrop-filter:blur(24px) saturate(1.7)!important;
  -webkit-backdrop-filter:blur(24px) saturate(1.7)!important;
  border:1px solid rgba(255,255,255,.5)!important;
  border-radius:20px!important;
  box-shadow:0 24px 70px -12px rgba(0,0,0,.45)!important;
  animation:gcPanelIn .34s cubic-bezier(.16,1,.3,1) both;
}
.lp-root.theme-dark .gc-overlay-panel{
  background:rgba(20,20,26,.82)!important;
  border:1px solid rgba(255,255,255,.1)!important;
  box-shadow:0 24px 70px -12px rgba(0,0,0,.75)!important;
}
@keyframes gcScrimIn{from{opacity:0}to{opacity:1}}
@keyframes gcPanelIn{
  from{opacity:0;transform:translateY(16px) scale(.96)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
/* chat bubbles keep their pill shape inside the panel */
.lp-root .gc-bubble{border-radius:16px!important}
.lp-root .gc-bubble-me{border-bottom-right-radius:5px!important}
.lp-root .gc-bubble-them{border-bottom-left-radius:5px!important}
.lp-root .gc-msg-in{animation:gcMsgIn .3s cubic-bezier(.16,1,.3,1) both}
@keyframes gcMsgIn{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}

/* ---------- toast notifications ------------------------------------------ */
.lp-root .gc-toast{
  border-radius:14px!important;
  box-shadow:0 12px 32px -8px rgba(0,0,0,.4)!important;
  background:rgba(255,255,255,.9)!important;
  backdrop-filter:blur(18px) saturate(1.6);
  -webkit-backdrop-filter:blur(18px) saturate(1.6);
  border:1px solid var(--border)!important;
  animation:gcToastIn .42s cubic-bezier(.16,1,.3,1) both;
}
.lp-root.theme-dark .gc-toast{
  background:rgba(22,22,28,.88)!important;
  border:1px solid rgba(255,255,255,.1)!important;
}
.lp-root .gc-toast-out{animation:gcToastOut .26s cubic-bezier(.4,0,1,1) both}
@keyframes gcToastIn{
  0%{opacity:0;transform:translateX(120%) scale(.9)}
  60%{opacity:1;transform:translateX(-6px) scale(1.01)}
  100%{opacity:1;transform:translateX(0) scale(1)}
}
@keyframes gcToastOut{
  from{opacity:1;transform:translateX(0) scale(1)}
  to{opacity:0;transform:translateX(120%) scale(.92)}
}
/* the progress hairline that drains while the toast is up */
.lp-root .gc-toast-bar{animation:gcToastBar linear both}
@keyframes gcToastBar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
/* icon pops once on arrival */
.lp-root .gc-toast-icon{animation:gcToastPop .5s cubic-bezier(.16,1,.3,1) .1s both}
@keyframes gcToastPop{0%{transform:scale(0) rotate(-25deg)}60%{transform:scale(1.18) rotate(6deg)}100%{transform:scale(1) rotate(0)}}

/* ---------- signup buddy -------------------------------------------------- */
.lp-root .gc-buddy-bubble{
  border-radius:16px!important;
  border-bottom-left-radius:5px!important;
  animation:gcBuddyIn .38s cubic-bezier(.16,1,.3,1) both;
}
@keyframes gcBuddyIn{from{opacity:0;transform:translateY(10px) scale(.94)}to{opacity:1;transform:none}}
.lp-root .gc-buddy-orb{animation:gcBuddyFloat 3.6s ease-in-out infinite}
@keyframes gcBuddyFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.lp-root .gc-buddy-dot{animation:gcBuddyDot 1.3s ease-in-out infinite}
@keyframes gcBuddyDot{0%,80%,100%{opacity:.25;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}

/* ---------- work buddy (the same Pilot, inside the dashboard) ------------- */
/* The signup buddy is painted for one fixed surface — the dark auth panel —
   so its white/10 bubble is hardcoded. This one floats over a themed
   workspace, so every colour comes from a token and it follows the theme
   toggle without a second set of rules. */
.lp-root .gc-wb{
  position:fixed;z-index:45;bottom:5.25rem;left:.75rem;
  display:flex;align-items:flex-end;gap:.6rem;pointer-events:none;
}
/* Clear the 16rem sidebar on desktop, and drop back down: at this width the
   bottom-centre popper rail is nowhere near the left gutter. */
@media (min-width:1024px){.lp-root .gc-wb{left:17.25rem;bottom:1.25rem}}
.lp-root .gc-wb > *{pointer-events:auto}
.lp-root .gc-wb-orb{
  width:2.75rem;height:2.75rem;border-radius:14px;flex:0 0 auto;border:0;padding:0;
  display:flex;align-items:center;justify-content:center;
  font-size:13px;font-weight:700;letter-spacing:-.05em;color:#fff;
  background:linear-gradient(140deg,#7c3aed,#d946ef);
  box-shadow:var(--shadow-md);cursor:pointer;
  animation:gcBuddyFloat 3.6s ease-in-out infinite;
}
.lp-root .gc-wb-orb:focus-visible{outline:2px solid var(--brand);outline-offset:3px}
.lp-root .gc-wb-orb[data-muted="1"]{background:var(--surface-3);color:var(--fg-faint);animation:none}
.lp-root .gc-wb-say{
  position:relative;max-width:min(19rem,calc(100vw - 6rem));
  background:var(--surface);border:1px solid var(--border-2);
  border-radius:16px;border-bottom-left-radius:5px;
  padding:.7rem .9rem;box-shadow:var(--shadow-xl);
  animation:gcBuddyIn .38s cubic-bezier(.16,1,.3,1) both;
}
.lp-root .gc-wb-text{font-size:13px;line-height:1.5;color:var(--fg)}
.lp-root .gc-wb-foot{
  display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:.35rem;
  font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fg-muted);
}
/* Mute stays out of the way until you look for it — hover or keyboard focus.
   It is always in the DOM so it is always reachable by tab. */
.lp-root .gc-wb-mute{opacity:0;transition:opacity .18s;color:var(--fg-muted);text-transform:inherit;letter-spacing:inherit;font:inherit;background:none;border:0;cursor:pointer}
.lp-root .gc-wb-say:hover .gc-wb-mute,.lp-root .gc-wb-mute:focus-visible{opacity:1}
.lp-root .gc-wb-mute:hover{color:var(--fg)}
.lp-root .gc-wb-x{
  position:absolute;top:-7px;right:-7px;width:20px;height:20px;border-radius:9999px;
  display:flex;align-items:center;justify-content:center;padding:0;
  background:var(--surface-3);border:1px solid var(--border-2);color:var(--fg-muted);
  font-size:11px;line-height:1;cursor:pointer;
}
.lp-root .gc-wb-x:hover{color:var(--fg)}

/* ==========================================================================
   POP + CELEBRATION — interaction layer (wins by source order)
   The editorial system disarms interaction motion on purpose: it kills every
   button transition (.lp-root button{transition:none}) and flattens Tailwind's
   active:scale-95. This layer re-arms it deliberately, on named classes only,
   so anything that did not opt in still obeys the three laws.
   The one sanctioned exception to "no colour" is the party popper itself,
   whose palette lives in POPPER_COLORS in the JS below.
   ========================================================================== */

/* ---------- the pop: press it and it answers ----------------------------- */
.lp-root button.btn-pop{
  transition:transform .34s cubic-bezier(.34,1.56,.64,1),
             background-color .2s ease,
             border-color .2s ease,
             color .2s ease!important;
  will-change:transform;
}
.lp-root button.btn-pop:hover:not(:disabled){transform:translateY(-2px) scale(1.035)}
/* Two selectors, one job. The editorial layer's
   .lp-root .active\\:scale-95:active{transform:none!important} is (0,3,0) and
   already !important, so an equal-weight rule loses on source order alone.
   Repeating .btn-pop takes this to (0,3,1) and wins outright. */
.lp-root button.btn-pop.btn-pop:active:not(:disabled),
.lp-root button.btn-pop.active\\:scale-95:active:not(:disabled){
  transform:translateY(0) scale(.93)!important;
  transition-duration:.09s!important;
}
/* A disabled CTA looked identical to a live one until you clicked it. */
.lp-root button.btn-pop:disabled{opacity:.45;transform:none!important}

/* ---------- overlay: confetti, ripples, toasts ---------------------------
   Mounted on <body>, deliberately outside .lp-root — React owns that subtree,
   and appending stray nodes to a container React is reconciling is how you
   earn a removeChild crash. moOverlay() copies the tokens across instead, so
   the ripple and toast still paint in the current theme. */
.mo-overlay{
  position:fixed;inset:0;overflow:hidden;pointer-events:none;
  z-index:2147483000;
}
.mo-overlay .mo-confetti{position:absolute;inset:0}

/* press ripple: a hairline square that opens and turns */
.mo-overlay .mo-pulse{
  position:absolute;width:18px;height:18px;margin:-9px 0 0 -9px;
  border:1px solid var(--fg,#0a0a0a);
  animation:moPulse .5s cubic-bezier(.16,1,.3,1) forwards;
}
@keyframes moPulse{
  from{transform:scale(.35) rotate(0deg);opacity:.6}
  to{transform:scale(5.5) rotate(45deg);opacity:0}
}

/* logged-it toast: mono specimen on an ink plate */
.mo-overlay .mo-toast-rail{
  position:absolute;left:50%;bottom:28px;transform:translateX(-50%);
  display:flex;flex-direction:column-reverse;gap:8px;align-items:center;
  padding:0 16px;max-width:100vw;
}
.mo-overlay .mo-toast{
  font-family:var(--mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace);
  font-size:12px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;
  background:var(--fg,#0a0a0a);color:var(--bg,#ffffff);
  border:1px solid var(--fg,#0a0a0a);
  padding:10px 16px;display:inline-flex;align-items:center;gap:10px;
  max-width:calc(100vw - 32px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  animation:moToastIn .42s cubic-bezier(.16,1,.3,1) both;
}
.mo-overlay .mo-toast::before{content:"✳";opacity:.7}
.mo-overlay .mo-toast-out{animation:moToastOut .4s cubic-bezier(.7,0,.84,0) both}
@keyframes moToastIn{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
@keyframes moToastOut{from{opacity:1;transform:none}to{opacity:0;transform:translateY(10px) scale(.98)}}

/* ---------- cards lift toward the cursor, hairline goes to ink ----------- */
.lp-root .card-lift{transition:transform .4s cubic-bezier(.16,1,.3,1),border-color .3s ease}
.lp-root .card-lift:hover{transform:translateY(-2px);border-color:var(--border-2)!important}
/* Only lucide glyphs pop. A bare svg selector would catch Recharts' own
   chart surface and rescale the whole figure on card hover. */
.lp-root .stat-pop svg.lucide{transition:transform .4s cubic-bezier(.34,1.56,.64,1)}
.lp-root .card-lift:hover .stat-pop svg.lucide{transform:scale(1.14) rotate(-4deg)}

/* ---------- a module arrives, it does not just appear --------------------
   Children only. Putting the animation on .mo-page itself would give the
   container a transform, and a transform is a containing block for any
   position:fixed descendant that opens during the half-second it runs. */
.lp-root .mo-page > *{animation:moPageIn .55s cubic-bezier(.16,1,.3,1) both}
@keyframes moPageIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.lp-root .mo-page > *:nth-child(1){animation-delay:.03s}
.lp-root .mo-page > *:nth-child(2){animation-delay:.08s}
.lp-root .mo-page > *:nth-child(3){animation-delay:.13s}
.lp-root .mo-page > *:nth-child(4){animation-delay:.18s}
.lp-root .mo-page > *:nth-child(5){animation-delay:.23s}
.lp-root .mo-page > *:nth-child(6){animation-delay:.28s}
.lp-root .mo-page > *:nth-child(n+7){animation-delay:.32s}

/* ---------- badges snap in ----------------------------------------------- */
.lp-root .mo-badge{animation:moBadgeIn .4s cubic-bezier(.34,1.56,.64,1) both}
@keyframes moBadgeIn{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}

/* ---------- sidebar: rows lean in, the active rule draws itself ---------- */
.lp-root .lp-sidebar nav button{
  transition:transform .28s cubic-bezier(.16,1,.3,1),
             background-color .2s ease,color .2s ease!important;
}
.lp-root .lp-sidebar nav button:hover{transform:translateX(3px)}
.lp-root .lp-nav-active{position:relative}
.lp-root .lp-nav-active::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--fg);
  animation:moNavBar .38s cubic-bezier(.16,1,.3,1) both;
}
@keyframes moNavBar{from{transform:scaleY(0)}to{transform:scaleY(1)}}

/* ---------- respect the user (again, for everything above) --------------- */
@media (prefers-reduced-motion: reduce){
  .lp-root button.btn-pop,.lp-root .card-lift,
  .lp-root .lp-sidebar nav button{transition:none!important}
  .lp-root button.btn-pop:hover:not(:disabled),
  .lp-root button.btn-pop.btn-pop:active:not(:disabled),
  .lp-root button.btn-pop.active\\:scale-95:active:not(:disabled),
  .lp-root .card-lift:hover,
  .lp-root .lp-sidebar nav button:hover,
  .lp-root .card-lift:hover .stat-pop svg.lucide{transform:none!important}
  .mo-overlay .mo-pulse,.mo-overlay .mo-confetti{display:none!important}
  .lp-root .mo-page > *,.lp-root .mo-badge,
  .lp-root .lp-nav-active::before{animation:none!important}
  .mo-overlay .mo-toast{animation:none!important;opacity:1!important;transform:none!important}
  .lp-root .gc-overlay-scrim,.lp-root .gc-overlay-panel,.lp-root .gc-msg-in,
  .lp-root .gc-toast,.lp-root .gc-toast-out,.lp-root .gc-toast-icon,
  .lp-root .gc-toast-bar,.lp-root .gc-buddy-bubble,.lp-root .gc-buddy-orb,
  .lp-root .gc-buddy-dot,.lp-root .gc-wb-orb,.lp-root .gc-wb-say{animation:none!important}
}
`;

// ------------------------------------------------------------- mock data ---
const MONTHS = [
  { m: "Jan", revenue: 22, expenses: 78, users: 640 },
  { m: "Feb", revenue: 26, expenses: 82, users: 720 },
  { m: "Mar", revenue: 29, expenses: 84, users: 795 },
  { m: "Apr", revenue: 34, expenses: 88, users: 880 },
  { m: "May", revenue: 38, expenses: 94, users: 960 },
  { m: "Jun", revenue: 41, expenses: 96, users: 1050 },
  { m: "Jul", revenue: 45, expenses: 101, users: 1150 },
  { m: "Aug", revenue: 48, expenses: 104, users: 1240 },
];

const WAITLIST_INIT = [
  { w: "W1", signups: 120 }, { w: "W2", signups: 310 }, { w: "W3", signups: 540 },
  { w: "W4", signups: 820 }, { w: "W5", signups: 1160 }, { w: "W6", signups: 1520 },
  { w: "W7", signups: 1940 }, { w: "W8", signups: 2340 },
];

const PMF_SURVEY = [
  { label: "Very disappointed", v: 41, color: GREEN },
  { label: "Somewhat disappointed", v: 38, color: AMBER },
  { label: "Not disappointed", v: 21, color: RED },
];

const SURVEYS = [
  { name: "Sean Ellis PMF survey", responses: 412, status: "Live" },
  { name: "Onboarding friction poll", responses: 188, status: "Live" },
  { name: "Pricing sensitivity study", responses: 96, status: "Draft" },
];


const SENTIMENT_TREND = [
  { w: "W1", score: 61 }, { w: "W2", score: 64 }, { w: "W3", score: 62 },
  { w: "W4", score: 66 }, { w: "W5", score: 68 }, { w: "W6", score: 65 },
  { w: "W7", score: 70 }, { w: "W8", score: 72 },
];




const CASH = 530; // $k
const BASE_NET_BURN = 56; // $k / month

const COMPLIANCE_INIT = [
  { title: "Incorporation & governance", items: [
    { t: "Certificate of incorporation filed", done: true },
    { t: "Founder agreements + vesting schedules signed", done: true },
    { t: "Board minutes for Q2 recorded", done: true },
    { t: "ESOP pool approved by board", done: false, due: "Aug 30" },
  ]},
  { title: "Tax & statutory filings", items: [
    { t: "GST returns filed (Jul)", done: true },
    { t: "TDS deposited for contractor payouts", done: false, due: "Aug 7" },
    { t: "Advance tax installment (Q2)", done: false, due: "Sep 15" },
  ]},
  { title: "Data & privacy (DPDP / GDPR)", items: [
    { t: "Privacy policy updated for AI features", done: true },
    { t: "Data processing agreements with sub-processors", done: false, due: "Sep 1" },
    { t: "Consent + deletion request workflow live", done: true },
  ]},
  { title: "Employment & payroll", items: [
    { t: "Offer letters on standard template", done: true },
    { t: "PF/ESI registrations current", done: true },
    { t: "Contractor vs employee classification review", done: false, due: "Sep 10" },
  ]},
];

const PROCESSES = [
  { id: "p1", name: "Support ticket triage", dept: "Support", hrs: 11, potential: 85 },
  { id: "p2", name: "Invoice creation & chasing", dept: "Finance", hrs: 8, potential: 90 },
  { id: "p3", name: "Lead data entry to CRM", dept: "Sales", hrs: 7, potential: 88 },
  { id: "p4", name: "Weekly metrics reporting", dept: "Ops", hrs: 5, potential: 75 },
  { id: "p5", name: "Onboarding email sequences", dept: "Growth", hrs: 4, potential: 80 },
  { id: "p6", name: "Expense approval routing", dept: "Finance", hrs: 3, potential: 70 },
];

const COMPETITORS = [
  { name: "MetricHive", pricing: "$59/user", strength: "Deep BI + SQL layer", gap: "No AI insights; 2-week setup" },
  { name: "FounderDesk", pricing: "$149 flat", strength: "Great investor updates", gap: "No churn or lead scoring" },
  { name: "OpsPilot", pricing: "$39/user", strength: "Strong automations", gap: "Weak finance module; no PMF tools" },
  { name: "Sheets + Zapier", pricing: "~$0-80", strength: "Infinitely flexible", gap: "Breaks silently; founder becomes the glue" },
];

const TEAM = [
  { name: "Aarav Mehta", role: "Co-founder · CEO", initials: "AM", color: "bg-violet-600", tag: "Ex-fintech PM. Owns vision, fundraising, and too many spreadsheets (recovering)." },
  { name: "Sofia Marino", role: "Co-founder · CTO", initials: "SM", color: "bg-fuchsia-500", tag: "ML engineer. Built the scoring and churn models behind every module." },
  { name: "Ken Watanabe", role: "Head of Design", initials: "KW", color: "bg-slate-800", tag: "Believes dashboards should feel calm. Fights entropy one component at a time." },
  { name: "Riya Bose", role: "Founding Growth", initials: "RB", color: "bg-amber-500", tag: "Talked to 400+ founders this year. Turns their pain into the roadmap." },
];

const TIMELINE = [
  { year: "2024", title: "The spreadsheet breaks", desc: "Our founders run a 12-person startup on 9 tools and one heroic spreadsheet. It breaks the week before a board meeting." },
  { year: "Early 2025", title: "First prototype", desc: "A weekend build: one dashboard pulling revenue, burn, and churn into a single view. Ten founder friends refuse to give it back." },
  { year: "Mid 2025", title: "AI copilot ships", desc: "We wire an LLM into the data layer. Instead of reading charts, founders start asking questions and getting answers." },
  { year: "Jan 2026", title: "Ten modules, one login", desc: "PMF validation, lead scoring, churn prediction, runway, compliance, and automation advice land as first-class modules." },
  { year: "Aug 2026", title: "2,300+ startups onboard", desc: "From dorm rooms to Series B. Same platform, same login, radically fewer tabs." },
];

const CAROUSEL = [
  { icon: LayoutDashboard, title: "One unified dashboard", desc: "Revenue, burn, growth, team progress, and risk alerts in a single pane. No more tab roulette before a board call.", points: ["Live KPI cards & charts", "Kanban team tracker", "Colored risk alerts"] },
  { icon: Sparkles, title: "AI insights everywhere", desc: "Every module ships with a copilot that knows your numbers. Ask why churn moved, what to fix first, or what to tell investors.", points: ["Context-aware chat in all 10 modules", "Plain-language explanations", "Suggested next actions"] },
  { icon: Layers, title: "Scalable architecture", desc: "Modular by design: React front end, API-first back end, and role-based access so the platform grows with your team.", points: ["Founder / Team / Admin roles", "Module-level permissions", "API-first, integration-ready"] },
  { icon: Globe, title: "Built for the real world", desc: "Designed with 400+ founder interviews: compliance checklists, unit economics, and automation ROI that map to how startups actually operate.", points: ["DPDP & GDPR checklists", "CAC / LTV auto-calculated", "Automation ROI estimator"] },
];


// Firestore-backed per-user collection with graceful empty start (no demo data).
function useUserCollection(user, coll) {
  const [items, setItems] = useState(null); // null = loading, [] = empty
  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        if (user?.uid) unsub = fb.onItems(user.uid, coll, setItems);
        else setItems([]);
      } catch { setItems([]); }
    })();
    return () => unsub && unsub();
  }, [user?.uid, coll]);
  // Toasts rather than alert(): a modal alert blocks the page until dismissed.
  const { notify } = useTheme();
  const add = async (item) => {
    if (!user?.uid) return notify({ tone: "error", title: "Not signed in", body: "Log in with a cloud account to save data." });
    try {
      const fb = await import("./firebase.js");
      await fb.addItem(user.uid, coll, item);
      // Only after the write lands — a popper for a save that failed is a lie.
      celebrate(LOG_LABELS[coll] || "Logged");
    }
    catch (e) { notify({ tone: "error", title: "Save failed", body: e?.message || String(e) }); }
  };
  const update = async (id, data) => {
    try { const fb = await import("./firebase.js"); if (user?.uid) await fb.updateItem(user.uid, coll, id, data); }
    catch (e) { notify({ tone: "error", title: "Update failed", body: e?.message || String(e) }); }
  };
  const remove = async (id) => {
    try { const fb = await import("./firebase.js"); if (user?.uid) await fb.deleteItem(user.uid, coll, id); }
    catch (e) { notify({ tone: "error", title: "Delete failed", body: e?.message || String(e) }); }
  };
  return { items, add, update, remove };
}

function EmptyState({ icon: Icon = Inbox, title, body, cta, onCta }) {
  return (
    <Card className="p-10 text-center">
      <Icon size={30} className="mx-auto text-violet-400 mb-3" />
      <div className="font-extrabold text-white">{title}</div>
      <div className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">{body}</div>
      {cta && <Btn variant="primary" className="mt-4" onClick={onCta}>{cta}</Btn>}
    </Card>
  );
}

// Notifications are computed from the founder's real data — no canned demo alerts.
function buildNotifs(c) {
  const out = [];
  const runway = c.netBurn > 0 ? c.cash / c.netBurn : Infinity;
  if (!c.aiProfile) out.push({ id: "n-interview", tone: "blue", text: "Teach your AI co-founder about " + (c.name || "your company") + " — run the 5-minute AI Interview", time: "setup", to: "interview" });
  if (c.netBurn > 0 && runway < 6) out.push({ id: "n-runway", tone: "red", text: "Runway is " + runway.toFixed(1) + " months at current burn — review the plan", time: "live", to: "runway" });
  else if (c.netBurn > 0 && runway < 10) out.push({ id: "n-runway2", tone: "amber", text: "Runway under 10 months (" + runway.toFixed(1) + " mo) — consider raise timing", time: "live", to: "runway" });
  if (c.churn > 5) out.push({ id: "n-churn", tone: "red", text: "Monthly churn at " + c.churn + "% — above the 5% danger line", time: "live", to: "churn" });
  if (c.mrr > 0 && c.mrrGrowth < 0) out.push({ id: "n-growth", tone: "amber", text: "MRR shrank " + Math.abs(c.mrrGrowth) + "% MoM — worth a look", time: "live", to: "overview" });
  if (!(c.mrr > 0) && !(c.customers > 0)) out.push({ id: "n-data", tone: "blue", text: "Add your first metrics in Company Data to light up the dashboards", time: "setup", to: "company" });
  return out;
}

const ALERTS = [];


// Fallback replies if the live AI call is unavailable (offline demo mode).
const CANNED = {
  overview: "Your headline risk is runway (9.5 months) while growth is healthy at ~7-8% MoM. Priority: push net burn under $50k or accelerate ARPU — either buys you past the 12-month fundraise threshold.",
  pmf: "41% 'very disappointed' clears the classic 40% PMF bar. Next: segment that cohort — double down on the persona and channel producing them, and interview the 'somewhat' group for the one missing feature.",
  feedback: "Performance is your loudest negative theme (2 of 3 complaints). Fix the dashboard load time before pricing — speed complaints churn faster than price complaints.",
  leads: "Work top-down by score: Sana Kapoor (97) and Jorge Alvarez (91) represent $77k of pipeline. Scores weight engagement recency, firmographic fit, and deal stage.",
  churn: "Brightpath Media is your most urgent save — champion loss plus a 71% usage drop usually converts to churn within 30 days. Run the re-onboarding play this week.",
  runway: "At $56k net burn you have ~9.5 months. Rule of thumb: start raising with 12+ months left, so either trim burn ~15% or begin the round now.",
  unit: "LTV:CAC around 6.7x is strong — you're likely under-investing in acquisition. With a ~4.7-month CAC payback, you can afford to scale spend while margins hold.",
  compliance: "Your nearest deadline is TDS on Aug 7 — that one carries interest penalties, so clear it first, then the DPA renewals due Sep 1.",
  automation: "Invoice chasing (90% automatable, 8 hrs/wk) is your best ROI. A $120/mo tool pays for itself in under a week of saved time at typical rates.",
  copilot: "Happy to help you research, plan, or draft. Try: 'Draft my August investor update' or 'Compare us against MetricHive for a sales deck'.",
  tasks: "Delegate anything you're doing manually more than twice. Tasks assigned to me get done in the background and appear in your review queue with a suggested output.",
  meetings: "Next up is the Northwind Labs demo — I've prepped a brief in the notes. Keep the agenda to 3 items max; anything beyond that is a follow-up email in disguise.",
  clients: "Brightpath is your at-risk anchor client; your two happiest clients (Volta and Ridgeline) are quiet, which is a monetization opportunity, not a resting state.",
  investors: "Focus the round on the four leads at 'meeting scheduled' — 'first email sent' is noise until we have 2 term sheets. Ask me to draft next-step notes for each.",
  company: "This is where every number in the platform starts. Change a KPI here and every module — and every answer I give — updates within the same session.",
};

// ------------------------------------------------------------ primitives ---
/* ------------------------------------------------ celebration + pop kit ---
   Two ideas in one place:
     · inkPulse — every press opens a hairline square where the founder
       clicked, so a button answers physically instead of only changing colour.
     · partyPopper — the confetti burst that goes off the moment something
       real gets logged: feedback, an automation, a meeting, a touch.

   The burst is the one place on the surface that deliberately breaks the
   no-colour law: it carries a fixed festive palette rather than the theme's
   ink ramp, because a party popper that comes out grey is not a party popper.
   Everything around it — the ripple, the toast, the shockwave — still reads
   the theme tokens, so the celebration lands on an editorial surface rather
   than replacing it.

   Both effects no-op under prefers-reduced-motion; the toast still speaks,
   because the confirmation is the point and only the movement is decoration. */

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// An actual party popper, not a tasteful one.
const POPPER_COLORS = ["#ff0080", "#00dfd8", "#f9cb28", "#7928ca", "#ff4d4d"];

// Where the last press landed. A celebration fired from an async save has no
// event left to read, but it still knows which button the founder pressed.
let LAST_PRESS = null;
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => { LAST_PRESS = { x: e.clientX, y: e.clientY }; },
    { capture: true, passive: true }
  );
}

function pressPoint(src) {
  if (src && typeof src.clientX === "number" && (src.clientX || src.clientY)) {
    return { x: src.clientX, y: src.clientY };
  }
  // Keyboard activation reports 0,0 — fall back to the control's own box.
  const el = src && (src.currentTarget || (src.getBoundingClientRect ? src : null));
  if (el && el.getBoundingClientRect) {
    const r = el.getBoundingClientRect();
    if (r.width || r.height) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return LAST_PRESS || { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };
}

const MO_TOKENS = ["--fg", "--bg", "--mono"];

// One overlay for every effect, mounted on <body> so React never has to
// reconcile around it. Tokens are copied in on each use, which also keeps the
// ripple and toast correct after a light/dark switch.
function moOverlay() {
  let host = document.querySelector("body > .mo-overlay");
  if (!host) {
    host = document.createElement("div");
    host.className = "mo-overlay";
    document.body.appendChild(host);
  }
  const root = document.querySelector(".lp-root");
  if (root) {
    const cs = getComputedStyle(root);
    for (const k of MO_TOKENS) {
      const val = (cs.getPropertyValue(k) || "").trim();
      if (val) host.style.setProperty(k, val);
    }
  }
  return host;
}

function inkColor(host) {
  const v = (getComputedStyle(host).getPropertyValue("--fg") || "").trim();
  return v || "#0a0a0a";
}

let CONFETTI = null;

function sizeConfetti() {
  if (!CONFETTI || !CONFETTI.canvas.isConnected) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { canvas, ctx } = CONFETTI;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function confettiLayer(host) {
  if (CONFETTI && CONFETTI.canvas.isConnected) return CONFETTI;
  const canvas = document.createElement("canvas");
  canvas.className = "mo-confetti";
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  CONFETTI = { canvas, ctx: canvas.getContext("2d"), pieces: [], raf: 0 };
  sizeConfetti();
  window.addEventListener("resize", sizeConfetti, { passive: true });
  return CONFETTI;
}

// The loop runs only while there is something to draw, then parks itself.
function runConfetti() {
  const L = CONFETTI;
  if (!L || L.raf) return;
  const tick = () => {
    const { ctx, pieces } = L;
    const W = window.innerWidth, H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.life++;
      const t = p.life / p.ttl;
      if (p.ring) {
        // the pop itself: one hairline shockwave. This one stays ink — it is
        // the report, not the confetti, and it grounds the burst on the page.
        const r = 6 + t * 78;
        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.5;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2);
        ctx.restore();
        if (p.life >= p.ttl) pieces.splice(i, 1);
        continue;
      }
      p.vy += 0.26;   // gravity
      p.vx *= 0.985;  // air
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.flip += p.vf;
      ctx.save();
      ctx.globalAlpha = t > 0.72 ? Math.max(0, (1 - t) / 0.28) : 1;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flip)); // tumbles edge-on and back
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      if (p.life >= p.ttl || p.y > H + 48) pieces.splice(i, 1);
    }
    L.raf = pieces.length ? requestAnimationFrame(tick) : 0;
    if (!L.raf) ctx.clearRect(0, 0, W, H);
  };
  L.raf = requestAnimationFrame(tick);
}

// A popper fires up and out in a cone. An even circle reads as a generic
// success splash; the cone reads as something going off in your hand.
function partyPopper(src, opts = {}) {
  if (typeof window === "undefined" || reduceMotion()) return;
  const { x, y } = pressPoint(src);
  const host = moOverlay();
  const L = confettiLayer(host);
  const count = opts.count ?? 78;
  const spread = ((opts.spread ?? 96) * Math.PI) / 180;
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const speed = 5.5 + Math.random() * 9.5;
    const streamer = Math.random() < 0.22;
    L.pieces.push({
      x, y,
      vx: Math.cos(a) * speed + (Math.random() - 0.5) * 1.6,
      vy: Math.sin(a) * speed,
      w: streamer ? 1.5 : 3 + Math.random() * 5,
      h: streamer ? 16 + Math.random() * 14 : 6 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.34,
      flip: Math.random() * Math.PI,
      vf: 0.12 + Math.random() * 0.16,
      color: POPPER_COLORS[(Math.random() * POPPER_COLORS.length) | 0],
      life: 0,
      ttl: 90 + Math.random() * 60,
    });
  }
  L.pieces.push({ ring: true, x, y, color: inkColor(host), life: 0, ttl: 30 });
  runConfetti();
}

// The hairline square that opens under every press.
function inkPulse(src) {
  if (typeof window === "undefined" || reduceMotion()) return;
  const { x, y } = pressPoint(src);
  const dot = document.createElement("span");
  dot.className = "mo-pulse";
  dot.setAttribute("aria-hidden", "true");
  dot.style.left = x + "px";
  dot.style.top = y + "px";
  moOverlay().appendChild(dot);
  setTimeout(() => dot.remove(), 560);
}

// Mono specimen toast, announced politely so the confirmation is not
// something only a sighted user gets.
function toast(message) {
  if (!message || typeof document === "undefined") return;
  const host = moOverlay();
  let rail = host.querySelector(".mo-toast-rail");
  if (!rail) {
    rail = document.createElement("div");
    rail.className = "mo-toast-rail";
    rail.setAttribute("role", "status");
    rail.setAttribute("aria-live", "polite");
    host.appendChild(rail);
  }
  const t = document.createElement("div");
  t.className = "mo-toast";
  t.textContent = message;
  rail.appendChild(t);
  setTimeout(() => {
    t.classList.add("mo-toast-out");
    setTimeout(() => t.remove(), 420);
  }, 2600);
}

// Pilot (see WorkBuddy) needs to know when real work lands, but it lives in
// React and celebrate() is a bare function called from data-layer code. This
// is the seam between the two: a set of listeners, nothing more.
const buddyBus = {
  subs: new Set(),
  on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit(ev) {
    // A companion is decoration. It must never be the reason a save appears
    // to fail, so a throwing listener is swallowed rather than propagated.
    this.subs.forEach((fn) => { try { fn(ev); } catch { /* never break the save */ } });
  },
};

// One call for "the founder just logged something real".
function celebrate(message, src) {
  partyPopper(src);
  toast(message);
  // Deliberately here and not at the call sites: every genuine write already
  // funnels through celebrate() (see useUserCollection.add), so the companion
  // reacts to work that actually persisted — never to a click that failed.
  buddyBus.emit({ kind: "log", label: message || "" });
}

// Collection id -> what just happened, for the toast line.
const LOG_LABELS = {
  feedback: "Feedback logged",
  automations: "Automation logged",
  meetings: "Meeting logged",
  clients: "Client added",
  leads: "Lead added",
  investors: "Investor added",
  tasks: "Task added",
  founder_tasks: "Task added",
};

function Card({ children, className = "", ...p }) {
  return (
    <div className={"bg-white border border-gray-200 rounded-2xl shadow-sm card-lift " + className} {...p}>
      {children}
    </div>
  );
}

// `celebrate` is opt-in per button: pass a string and the press fires the
// party popper with that toast. Every press pops regardless — the ripple is
// the baseline answer to a click.
function Btn({ children, variant = "primary", className = "", celebrate: cheer, onClick, ...p }) {
  const styles = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white",
    green: "bg-emerald-500 hover:bg-emerald-600 text-white",
    ghost: "bg-white/5 border border-white/10 hover:border-violet-400 hover:text-violet-400 text-zinc-300",
    dark: "bg-zinc-800 hover:bg-zinc-700 text-white",
    soft: "bg-violet-500/10 hover:bg-violet-500/20 text-violet-400",
  };
  const press = (e) => {
    inkPulse(e);
    if (cheer) celebrate(typeof cheer === "string" ? cheer : "", e);
    if (onClick) onClick(e);
  };
  return (
    <button
      className={"inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 active:scale-95 btn-pop disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 " + styles[variant] + " " + className}
      onClick={press}
      {...p}
    >
      {children}
    </button>
  );
}

const TONES = {
  blue: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  slate: "bg-white/5 text-zinc-400 border-white/10",
};

function Badge({ tone = "blue", children, className = "" }) {
  return (
    <span className={"inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium mo-badge " + TONES[tone] + " " + className}>
      {children}
    </span>
  );
}

function SectionHead({ kicker, title, desc, center }) {
  return (
    <AnimatedContent distance={44} duration={0.7} ease="power3.out" threshold={0.2}>
      <div className={"max-w-2xl sect-rule " + (center ? "mx-auto text-center" : "")}>
        {kicker && <div className="mono text-xs text-zinc-500 uppercase mb-2">{kicker}</div>}
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">{title}</h2>
        {desc && <p className="mt-3 text-zinc-400 leading-relaxed">{desc}</p>}
      </div>
    </AnimatedContent>
  );
}

/* ------------------------------------------------- monochrome motion kit ---
   Ink that moves. Every primitive degrades to a static, legible state under
   prefers-reduced-motion (handled in the CSS layer). */

// One headline line, masked and rising into place.
function MoLine({ children, delay = 0, className = "" }) {
  return (
    <span className="mo-mask">
      <span className={"mo-rise " + className} style={{ animationDelay: delay + "ms" }}>
        {children}
      </span>
    </span>
  );
}

// Mono eyebrow, one glyph at a time.
function MoChars({ text, delay = 0, step = 26, className = "" }) {
  return (
    <span className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} className="mo-char" style={{ animationDelay: delay + i * step + "ms" }} aria-hidden="true">
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

// Counts up once, when it enters the viewport.
function MoTick({ to, prefix = "", suffix = "", duration = 1800, className = "" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || done.current) return;
      done.current = true;
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / duration, 1);
        setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return <span ref={ref} className={"mo-tick " + className}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

// Reveals children on scroll-in.
function MoReveal({ children, delay = 0, className = "" }) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={"mo-reveal " + (inView ? "mo-in " : "") + className}
         style={{ transitionDelay: delay + "ms" }}>
      {children}
    </div>
  );
}

// Pill CTA that leans toward the cursor and fills with ink on hover.
// The transform lives on a wrapper so Btn stays a plain (non-ref) component.
function MoBtn({ children, variant = "primary", inverted = false, className = "", ...p }) {
  const wrap = useRef(null);

  const onMove = (e) => {
    const el = wrap.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.style.transform = "translate(" + (dx * 8).toFixed(2) + "px," + (dy * 5).toFixed(2) + "px)";
  };
  const onLeave = () => { if (wrap.current) wrap.current.style.transform = "translate(0,0)"; };

  return (
    <span
      ref={wrap}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block"
      style={{ transition: "transform .35s cubic-bezier(.16,1,.3,1)", willChange: "transform" }}
    >
      <Btn
        variant={variant}
        className={"mo-magnet " + (inverted ? "mo-magnet-inv " : "") + className}
        {...p}
      >
        <span className="inline-flex items-center gap-2">{children}</span>
      </Btn>
    </span>
  );
}

// Drifts an element against the scroll.
// The mo-* entrance system already honors reduced motion in the CSS layer;
// the React Bits pieces (WebGL Aurora, GSAP SplitText) are JS-driven, so they
// gate on this hook instead and fall back to the CSS-managed variants.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = (e) => setReduced(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

function useParallax(strength = 0.12) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        el.style.transform = "translateY(" + (r.top * -strength).toFixed(2) + "px)";
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [strength]);
  return ref;
}

function Stat({ icon: Icon, label, value, delta, tone = "blue", sub }) {
  return (
    <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={"w-11 h-11 rounded-xl flex items-center justify-center shrink-0 stat-pop " + (tone === "emerald" ? "bg-emerald-500/10 text-emerald-400" : tone === "amber" ? "bg-amber-500/10 text-amber-400" : tone === "red" ? "bg-red-500/10 text-red-400" : "bg-violet-500/10 text-violet-400")}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
        <div className="text-2xl font-extrabold text-white mt-0.5">{value}</div>
        {delta && <div className={"text-xs font-semibold mt-0.5 " + (String(delta).startsWith("-") ? "text-red-400" : "text-emerald-400")}>{delta}{sub && <span className="text-zinc-500 font-medium"> · {sub}</span>}</div>}
        {!delta && sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
}

function Progress({ v, tone = "blue" }) {
  const bar = tone === "emerald" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : tone === "red" ? "bg-red-500" : "bg-violet-500";
  return (
    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
      <div className={"h-full rounded-full transition-all duration-500 " + bar} style={{ width: Math.max(0, Math.min(100, v)) + "%" }} />
    </div>
  );
}

function Field({ label, hint, ...p }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <input
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition"
        {...p}
      />
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function heatColor(risk) {
  // risk 0..1 → emerald → amber → red
  const r = Math.round(16 + (239 - 16) * risk);
  const g = Math.round(185 + (68 - 185) * risk);
  const b = Math.round(129 + (68 - 129) * risk);
  return "rgb(" + r + "," + g + "," + b + ")";
}

function scoreTone(s) {
  return s >= 85 ? "emerald" : s >= 70 ? "blue" : s >= 60 ? "amber" : "slate";
}

// --------------------------------------------------------- module registry -
const MODULES = [
  { id: "overview", name: "Founder Dashboard", track: "Founder Ops", icon: LayoutDashboard, blurb: "KPI charts, team progress, and risk alerts — your startup at a glance." },
  { id: "tasks", name: "Delegate & Tasks", track: "Founder Ops", icon: ListChecks, blurb: "Assign work to your team — or to your AI co-founder — with due dates and status." },
  { id: "meetings", name: "Meeting Command Center", track: "Founder Ops", icon: CalendarDays, blurb: "Schedule meetings, capture agendas and notes, and turn talk into action items." },
  { id: "team", name: "Team & Access", track: "Founder Ops", icon: Users, blurb: "Your roster, their emails and roles, and who's working on what. Founders and admins can change roles and assign tasks." },
  { id: "pmf", name: "Product–Market Fit Validator", track: "Product & Customers", icon: Target, blurb: "Surveys, waitlists, and co-founder insights that tell you if demand is real." },
  { id: "feedback", name: "Customer Feedback Intelligence", track: "Product & Customers", icon: Inbox, blurb: "A unified feedback inbox with sentiment analysis and themes." },
  { id: "leads", name: "AI Lead Prioritization", track: "Growth & Retention", icon: Filter, blurb: "A scored, filterable lead table so sales time goes where revenue is." },
  { id: "churn", name: "Customer Churn Prediction", track: "Growth & Retention", icon: TrendingDown, blurb: "Cohort risk heatmap plus concrete retention plays per account." },
  { id: "clients", name: "Client Success Hub", track: "Growth & Retention", icon: Users, blurb: "Every client, their MRR, health score, and next touch — one roster." },
  { id: "runway", name: "Runway & Burn Rate Intelligence", track: "Finance", icon: Wallet, blurb: "Cash flow charts, projections, and what-if scenarios.", finance: true },
  { id: "unit", name: "Unit Economics Analyzer", track: "Finance", icon: Calculator, blurb: "Auto-calculated CAC, LTV, payback, and margins from your inputs.", finance: true },
  { id: "investors", name: "Fundraising CRM", track: "Finance", icon: Handshake, blurb: "Investor pipeline, stage tracking, and next steps — with copilot-drafted updates.", finance: true },
  { id: "compliance", name: "Startup Compliance Assistant", track: "Compliance", icon: ShieldCheck, blurb: "A living checklist with deadlines and co-founder guidance on filings." },
  { id: "automation", name: "AI Workflow Automation Advisor", track: "Automation & Copilot", icon: Workflow, blurb: "Scan manual processes and estimate the ROI of automating them." },
  { id: "copilot", name: "AI Co-founder", track: "Automation & Copilot", icon: Bot, blurb: "Research, competitor analysis, planning, and drafting — on demand." },
  { id: "company", name: "Company Data", track: "Settings", icon: Settings, blurb: "The source of truth. Edit any number here and it flows into every module and every co-founder answer." },
  { id: "interview", name: "AI Interview", track: "Founder Ops", icon: Sparkles, blurb: "A short conversation that teaches your AI co-founder everything about your company — it powers every answer afterwards." },
  { id: "community", name: "Community", track: "Community", icon: Users, blurb: "Share what you're building, get feedback, and see what other founders are shipping." },
  { id: "news", name: "Industry News", track: "Community", icon: Globe, blurb: "Live headlines tailored to what you're building." },
  { id: "markets", name: "Live Markets", track: "Finance", icon: Activity, blurb: "Real-time FX, crypto, and stock quotes — the financial backdrop for your decisions.", finance: true },
  { id: "talent", name: "Talent & Hiring", track: "Community", icon: Briefcase, blurb: "Founders open to work and teams that are hiring. Message anyone directly." },
  { id: "messages", name: "Messages", track: "Community", icon: MessageCircle, blurb: "Your direct conversations with other founders." },
  { id: "profile", name: "My Profile", track: "Settings", icon: User, blurb: "Your account, hiring status, skills, and preferences." },
  { id: "feedback-form", name: "Send Feedback", track: "Settings", icon: MessageSquare, blurb: "Tell us what's working and what's not." },
  { id: "privacy", name: "Privacy Policy", track: "Settings", icon: ShieldCheck, blurb: "How GenCopilot handles your data." },
];

// ------------------------------------------------------------- AI copilot --
const SYSTEM_SELF_DESCRIPTION =
  "GenCopilot is an all-in-one operating system for early-stage startups. It replaces a stack of ~9 tools with one login and 14 modules across 7 tracks. " +
  "Track 1 Founder Ops: Founder Dashboard (live KPIs, kanban, risk alerts), Delegate & Tasks (assign work to human teammates or to the AI co-founder itself, with due dates and status), Meeting Command Center (schedule, agenda, notes, action items). " +
  "Track 2 Product & Customers: PMF Validator (Sean-Ellis survey + waitlist), Customer Feedback Intelligence (unified inbox with sentiment). " +
  "Track 3 Growth & Retention: AI Lead Prioritization (scored table), Churn Prediction (cohort heatmap + save plays), Client Success Hub (client roster, revenue, health). " +
  "Track 4 Finance: Runway & Burn (projections with what-if sliders), Unit Economics (LTV/CAC/payback), Fundraising CRM (investor pipeline). " +
  "Track 5 Compliance: interactive checklist tuned for Indian private-limited + DPDP/GDPR. " +
  "Track 6 Automation & Copilot: Workflow Automation Advisor (ROI model per process), AI Co-founder (this assistant — planning, research, drafting). " +
  "Track 7 Settings: Company Data (all KPIs, editable by founders — this is the source of truth this assistant reads from). " +
  "Team Member accounts are restricted from Track 4 finance modules via RBAC; Founders and Admins see everything.";

const COMPANY_SNAPSHOT =
  "Company: 'Acme Metrics', a B2B SaaS analytics startup using GenCopilot. Aug 2026 snapshot — MRR $48.2k (+7.4% MoM), 1,240 customers, monthly churn 3.2%, net burn $56k/mo, cash $530k (~9.5 months runway), CAC $142, ARPU $39/mo, gross margin 78%, NPS 42. PMF survey: 41% 'very disappointed'. Top negative feedback theme: dashboard performance. Highest-scoring lead: Sana Kapoor at Northwind Labs (score 97, $45k). Most at-risk account: Brightpath Media (86% churn risk). Nearest compliance deadline: TDS filing Aug 7.";

// The marketing site runs the same assistant under a different contract.
// COMPANY_SNAPSHOT must never reach it: those are one demo company's figures,
// and a visitor who has connected nothing would hear "$530k cash, 9.5 months
// runway" as a statement about themselves. Public mode therefore drops the
// company context entirely and swaps the persona from co-founder to guide.
const PUBLIC_SYSTEM_PROMPT =
  "You are the GenCopilot guide on the public marketing site. You are talking to a visitor who has NOT signed up and has connected no data. " +
  SYSTEM_SELF_DESCRIPTION +
  " Answer what GenCopilot is, which modules exist and what each does, who it suits, how getting started works, and pricing — it is free for early-stage teams during early access. " +
  "You have no access to this visitor's numbers and you never invent any, for them or for anyone else. If they ask something needing their data ('what's my runway?', 'how bad is my churn?'), say plainly that it comes alive once they connect their numbers — a couple of minutes after signup — then offer what you CAN do, like explaining how that module reasons. " +
  "Never present metrics as though they were theirs. Be warm, specific and concrete; point toward a free account when it genuinely helps rather than pitching at every turn. " +
  "Plain conversational text only — no markdown headings or bullet lists. Maximum 110 words.";

// ---------------------------------------------------------------------------
// AI provider switch — mirror of app/.env
//   VITE_AI_MODE=puter  → Puter.js client-side (free, user-pays, no key)
//   VITE_AI_MODE=nvidia → NVIDIA NIM via the /api/chat proxy
// ---------------------------------------------------------------------------
const AI_MODE = String(import.meta.env.VITE_AI_MODE || "puter").toLowerCase();
const PUTER_MODEL = import.meta.env.VITE_PUTER_MODEL || "gpt-5.4-nano";
const NVIDIA_MODEL = import.meta.env.VITE_NVIDIA_MODEL || "z-ai/glm-5.2";

// ---------------------------------------------------------------------------
// Dev-only auth bypass — `npm run dev` drops straight into the dashboard with a
// demo founder instead of the Firebase login/signup gate. import.meta.env.DEV is
// false in every production build, so this can never ship live. Set
// VITE_DEV_AUTOLOGIN=0 to get the real login screen back while developing.
// ---------------------------------------------------------------------------
// Opt-in only (VITE_DEV_AUTOLOGIN=1): the mock dev user has no cloud uid, so
// saves fail with it. Default localhost behavior now matches production —
// instant dashboard with a real background guest session, saving works.
const DEV_AUTOLOGIN =
  Boolean(import.meta.env.DEV) &&
  String(import.meta.env.VITE_DEV_AUTOLOGIN ?? "0") === "1";

const DEV_USER = {
  name: "Dev Founder",
  email: "dev@localhost",
  role: "Founder",
};

function loadPuter() {
  return new Promise((resolve, reject) => {
    if (window.puter) return resolve(window.puter);
    if (document.querySelector('script[src*="js.puter.com"]')) {
      const check = setInterval(() => {
        if (window.puter) { clearInterval(check); resolve(window.puter); }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.puter.com/v2/";
    s.async = true;
    s.onload = () => resolve(window.puter);
    s.onerror = () => reject(new Error("Failed to load Puter.js"));
    document.head.appendChild(s);
  });
}

async function askClaude(moduleName, historyText, text, companyLine, opts = {}) {
  const systemPrompt = opts.publicMode
    ? PUBLIC_SYSTEM_PROMPT
    : "You are the founder's AI Co-founder inside GenCopilot. Speak in first person as a co-founder — 'we', 'our', 'let's'. You have full context on the platform and on this company. " +
      SYSTEM_SELF_DESCRIPTION +
      " " +
      (companyLine || COMPANY_SNAPSHOT) +
      " The user is currently in the '" +
      moduleName +
      "' module. Be a sharp, warm co-founder: reference the live numbers, be opinionated, suggest next actions. If asked to do work (draft, plan, research, schedule), do it directly in the response. Plain conversational text only — no markdown headings or bullet lists. Maximum 130 words.";

  const conversationMessages = [];
  // Parse history into proper message format
  const historyLines = historyText.split("\n").filter((l) => l.trim());
  for (const line of historyLines) {
    if (line.startsWith("Founder: ")) {
      conversationMessages.push({ role: "user", content: line.slice(9) });
    } else if (line.startsWith("Co-founder: ")) {
      conversationMessages.push({ role: "assistant", content: line.slice(12) });
    }
  }
  conversationMessages.push({ role: "user", content: text });

  // ---- Mode 1: Puter.js (client-side, free user-pays; no API key) ----
  if (AI_MODE === "puter") {
    const puter = await loadPuter();
    const result = await puter.ai.chat(
      [{ role: "system", content: systemPrompt }, ...conversationMessages],
      false,
      { model: PUTER_MODEL, max_tokens: 1024 }
    );
    let out = typeof result === "string" ? result : (result?.message?.content ?? result?.text ?? "");
    if (Array.isArray(out)) out = out.map((b) => (typeof b === "string" ? b : b?.text || "")).join("\n");
    out = String(out).trim();
    if (!out) throw new Error("empty response");
    return out;
  }

  // ---- Mode 2: NVIDIA NIM via the /api/chat proxy ----
  const recaptchaToken = await getRecaptchaToken("chat");
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(recaptchaToken ? { "x-recaptcha-token": recaptchaToken } : {}),
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages,
    }),
  });
  if (!res.ok) {
    let detail = "";
    try { const err = await res.json(); detail = err.error || err.detail || ""; } catch {}
    throw new Error("HTTP " + res.status + (detail ? ": " + detail : ""));
  }
  const data = await res.json();
  const out = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  if (!out) throw new Error("empty response");
  return out;
}

function ChatWidget({ module, embedded = false, quickPrompts = [], companyLine, initialPrompt }) {
  const [open, setOpen] = useState(embedded);
  const [msgs, setMsgs] = useState([
    { role: "assistant", text: "Hey — I'm your AI co-founder. I have our live numbers open in front of me and I know how every module here fits together. What are we working on in " + module.name + "?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, busy, open]);

  // Command-palette seeding: open the chat and auto-send the seeded prompt
  useEffect(() => {
    if (initialPrompt) {
      setOpen(true);
      // small delay so the panel animates in first
      const t = setTimeout(() => { send(initialPrompt); }, 200);
      return () => clearTimeout(t);
    }
    // if no prompt but effect fired (e.g. openChat() with no arg), just open
    if (initialPrompt === null) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  async function send(forced) {
    const text = (forced != null ? forced : input).trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    const historyText = msgs.slice(-6).map((m) => (m.role === "user" ? "Founder: " : "Co-founder: ") + m.text).join("\n");
    try {
      const reply = await askClaude(module.name, historyText, text, companyLine);
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
    } catch (e) {
      const detail = e?.message ? " (" + e.message + ")" : "";
      setMsgs((m) => [...m, { role: "assistant", text: "I couldn't reach the live AI just now" + detail + ". Your data is safe - try again in a moment. In puter mode, sign in when the Puter window opens. In nvidia mode, check that NVIDIA_API_KEY is set in your Worker's Settings, Variables and redeploy." }]);
    }
    setBusy(false);
  }

  const panel = (
    <Card className={"flex flex-col overflow-hidden " + (embedded ? "w-full" : "shadow-2xl lp-glass")} style={embedded ? { height: 440 } : { width: "min(376px, calc(100vw - 2rem))", height: 480 }}>
      <div className="flex items-center gap-2.5 px-4 py-3 bg-violet-600 text-white shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><Bot size={17} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold leading-tight truncate">{embedded ? "AI Co-founder" : module.name}</div>
          <div className="text-xs text-white/80 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-200 pulse-dot" /> Co-founder · live</div>
        </div>
        {!embedded && (
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition" aria-label="Close chat"><X size={16} /></button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-3.5 space-y-3 bg-gray-50">
        {msgs.map((m, i) => (
          <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap " + (m.role === "user" ? "chat-user-msg rounded-br-md" : "bg-white border border-gray-200 text-slate-700 rounded-bl-md")}>
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <Loader2 size={16} className="animate-spin text-violet-400" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {quickPrompts.length > 0 && (
        <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 bg-white border-t border-gray-200">
          {quickPrompts.map((q) => (
            <button key={q} onClick={() => send(q)} className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition">{q}</button>
          ))}
        </div>
      )}
      <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={"Ask your co-founder about " + module.name.toLowerCase() + "…"}
          className="chat-input flex-1 rounded-xl text-sm focus:outline-none"
        />
        <button onClick={() => send()} disabled={busy} className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white flex items-center justify-center transition" aria-label="Send">
          <Send size={16} />
        </button>
      </div>
    </Card>
  );

  if (embedded) return panel;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 max-w-[calc(100vw-2rem)]">
      {open && <div className="anim-fadeUp">{panel}</div>}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2 rounded-full bg-violet-600 text-white pl-4 pr-5 py-3.5 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
        >
          <span className="relative flex">
            <Sparkles size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 pulse-dot" />
          </span>
          <span className="text-sm font-bold">Ask co-founder</span>
        </button>
      )}
    </div>
  );
}

// ------------------------------------------------------ Jarvis voice AI ----
// The docked half of the split screen. Chat reuses askClaude() so Jarvis has
// exactly the same company context as the co-founder widget. Speech-to-text is
// the browser's Web Speech API; text-to-speech goes through Puter.js
// (puter.ai.txt2speech) with a speechSynthesis fallback, so "talking to Jarvis"
// keeps working even when AI_MODE is nvidia.

function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function useSpeechRecognition(onFinal) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef(null);
  // Held in a ref so re-renders never tear down a live recognition session.
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    setSupported(true);

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let finalText = "";
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0] ? r[0].transcript : "";
        if (r.isFinal) finalText += t;
        else pending += t;
      }
      setInterim(pending);
      const done = finalText.trim();
      if (done) { setInterim(""); onFinalRef.current(done); }
    };
    rec.onerror = () => { setListening(false); setInterim(""); };
    rec.onend = () => { setListening(false); setInterim(""); };

    recRef.current = rec;
    return () => {
      rec.onresult = null; rec.onerror = null; rec.onend = null;
      try { rec.abort(); } catch { /* already stopped */ }
      recRef.current = null;
    };
  }, []);

  const start = () => {
    if (!recRef.current) return;
    // start() throws if a session is already running — harmless.
    try { recRef.current.start(); setListening(true); } catch { /* noop */ }
  };
  const stop = () => {
    try { recRef.current && recRef.current.stop(); } catch { /* noop */ }
    setListening(false);
  };

  return { supported, listening, interim, start, stop, toggle: () => (listening ? stop() : start()) };
}

async function speakAloud(text, onHandle) {
  const clean = String(text || "").replace(/[*_`#]/g, "").trim();
  if (!clean) return;

  // Puter's neural voice first — this is the "talking" half.
  try {
    const puter = await loadPuter();
    if (puter && puter.ai && puter.ai.txt2speech) {
      const audio = await puter.ai.txt2speech(clean, { engine: "neural", language: "en-US" });
      onHandle({ stop: () => { try { audio.pause(); audio.currentTime = 0; } catch { /* noop */ } } });
      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
        Promise.resolve(audio.play()).catch(resolve);
      });
      return;
    }
  } catch { /* Puter unavailable or dismissed — use the built-in voice */ }

  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "en-US";
  u.rate = 1.02;
  onHandle({ stop: () => window.speechSynthesis.cancel() });
  await new Promise((resolve) => {
    u.onend = resolve;
    u.onerror = resolve;
    window.speechSynthesis.speak(u);
  });
}

// ---- ThinkingOrb: canvas-based 3D particle orb (ported from orbs.jakubantalik.com) ----
function _orbNoise(e, t) {
  const n = Math.floor(e), r = Math.floor(t);
  let l = e - n, o = t - r;
  l = l * l * (3 - 2 * l);
  o = o * o * (3 - 2 * o);
  const u = Math.sin(n * 12.9898 + r * 78.233) * 43758.5453;
  const i = Math.sin((n + 1) * 12.9898 + r * 78.233) * 43758.5453;
  const s = Math.sin(n * 12.9898 + (r + 1) * 78.233) * 43758.5453;
  const c = Math.sin((n + 1) * 12.9898 + (r + 1) * 78.233) * 43758.5453;
  const h = (u - Math.floor(u)) + ((i - Math.floor(i)) - (u - Math.floor(u))) * l;
  const p = (s - Math.floor(s)) + ((c - Math.floor(c)) - (s - Math.floor(s))) * l;
  return h + (p - h) * o;
}

function _orbFibSphere(i, total) {
  const g = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - 2 * (i + 0.5) / total;
  const r = Math.sqrt(1 - y * y);
  const a = i * g;
  return [r * Math.cos(a), y, r * Math.sin(a)];
}

function _orbRotator(tiltY, rotX, cx, cy, scale) {
  const sY = Math.sin(tiltY), cY = Math.cos(tiltY);
  const sX = Math.sin(rotX), cX = Math.cos(rotX);
  return (x, y, z) => {
    const p = x * sX + z * cX;
    const g = -x * cX + z * sX;
    const outY = y * cY - g * sY;
    const k = y * sY + g * cY;
    return [cx + p * scale, cy - outY * scale, k];
  };
}

function _orbDrawDots(ctx, dots, sz, isDark) {
  dots.sort((a, b) => a.z - b.z);
  for (const d of dots) {
    const alpha = d.a ?? 1;
    if (alpha < 0.02) continue;
    const w = Math.min(1, Math.max(0, d.white));
    const v = Math.round((isDark ? w : 1 - w) * 255);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, Math.max(0.5, d.r), 0, Math.PI * 2);
    ctx.fill();
  }
}

// Mode: breathing (idle) — ring of dots with gentle wobble
function _orbBreathing(ctx, sz, t, isDark) {
  const cx = sz / 2, cy = sz / 2;
  const rot = _orbRotator(0.3, t * 0.15, cx, cy, sz * 0.32);
  const dots = [];
  const N = 64;
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    const wobble = Math.sin(t * 0.8 + i * 0.3) * 0.04;
    const x = Math.cos(angle) * (0.9 + wobble);
    const z = Math.sin(angle) * (0.9 + wobble);
    const y = Math.sin(t * 0.5 + i * 0.2) * 0.15;
    const [sx, sy, depth] = rot(x, y, z);
    const sizeFactor = (sz / 300) ** 1.3;
    dots.push({ x: sx, y: sy, z: depth, r: (1.2 + depth * 0.4) * sizeFactor, a: 0.3 + depth * 0.2, white: 0.55 + depth * 0.2 });
  }
  dots.push({ x: cx, y: cy, z: 1, r: sz * 0.06, a: 0.12, white: 0.7 });
  _orbDrawDots(ctx, dots, sz, isDark);
}

// Mode: wave (listening) — spherical wave ripples
function _orbWave(ctx, sz, t, isDark) {
  const cx = sz / 2, cy = sz / 2;
  const rot = _orbRotator(0.4, t * 0.2, cx, cy, sz * 0.33);
  const dots = [];
  const rings = 6;
  for (let ring = 0; ring < rings; ring++) {
    const lat = ((ring + 1) / (rings + 1)) * Math.PI - Math.PI / 2;
    const ringR = Math.cos(lat);
    const ringY = Math.sin(lat);
    const n = 10 + ring * 4;
    const wave = Math.sin(t * 2.5 + ring * 1.2) * 0.12;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + t * 0.3;
      const x = Math.cos(angle) * ringR * (1 + wave);
      const z = Math.sin(angle) * ringR * (1 + wave);
      const y = ringY + Math.sin(t * 1.8 + angle) * 0.05;
      const [sx, sy, depth] = rot(x, y, z);
      const sizeFactor = (sz / 300) ** 1.3;
      dots.push({ x: sx, y: sy, z: depth, r: (1.0 + depth * 0.3) * sizeFactor, a: 0.25 + depth * 0.15, white: 0.5 + depth * 0.25 });
    }
  }
  _orbDrawDots(ctx, dots, sz, isDark);
}

// Mode: orbits (thinking/working) — orbital particle system
function _orbOrbits(ctx, sz, t, isDark) {
  const cx = sz / 2, cy = sz / 2;
  const dots = [];
  const orbits = 5;
  for (let o = 0; o < orbits; o++) {
    const tilt = _orbNoise(o * 7.3, 0) * Math.PI;
    const phase = _orbNoise(o * 3.1, 5) * Math.PI * 2;
    const speed = 0.5 + _orbNoise(o * 1.7, 9) * 0.8;
    const rot = _orbRotator(tilt, t * speed * 0.15, cx, cy, sz * 0.3);
    const n = 12 + o * 3;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + t * speed + phase;
      const x = Math.cos(angle);
      const z = Math.sin(angle);
      const y = Math.sin(t * 0.3 + o) * 0.1;
      const [sx, sy, depth] = rot(x, y, z);
      const sizeFactor = (sz / 300) ** 1.3;
      const trail = Math.sin((i / n) * Math.PI) * 0.5 + 0.5;
      dots.push({ x: sx, y: sy, z: depth, r: (0.8 + depth * 0.3) * sizeFactor, a: (0.15 + depth * 0.15) * trail, white: 0.45 + depth * 0.3 });
    }
  }
  _orbDrawDots(ctx, dots, sz, isDark);
}

// Mode: ribbon (speaking/composing) — flowing band around sphere
function _orbRibbon(ctx, sz, t, isDark) {
  const cx = sz / 2, cy = sz / 2;
  const rot = _orbRotator(0.5, t * 0.18, cx, cy, sz * 0.32);
  const dots = [];
  const lanes = 3;
  const segs = 40;
  for (let lane = 0; lane < lanes; lane++) {
    const laneOffset = (lane - 1) * 0.08;
    for (let i = 0; i < segs; i++) {
      const frac = i / segs;
      const angle = frac * Math.PI * 2 + t * 0.6 + lane * 0.4;
      const wobble = Math.sin(t * 1.2 + frac * 8) * 0.06;
      const x = Math.cos(angle) * (0.85 + wobble);
      const z = Math.sin(angle) * (0.85 + wobble);
      const y = laneOffset + Math.sin(t * 0.7 + frac * 6) * 0.1;
      const [sx, sy, depth] = rot(x, y, z);
      const sizeFactor = (sz / 300) ** 1.3;
      const fade = Math.sin(frac * Math.PI);
      dots.push({ x: sx, y: sy, z: depth, r: (1.1 + depth * 0.35) * sizeFactor, a: (0.2 + depth * 0.18) * fade, white: 0.5 + depth * 0.25 });
    }
  }
  _orbDrawDots(ctx, dots, sz, isDark);
}

const ORB_MODES = { idle: _orbBreathing, listening: _orbWave, thinking: _orbOrbits, speaking: _orbRibbon };

function ThinkingOrb({ state = "idle", size = 140 }) {
  const canvasRef = useRef(null);
  const isDark = true;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderFn = ORB_MODES[state] || ORB_MODES.idle;
    let raf = 0;
    let running = false;

    const draw = (now) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      renderFn(ctx, size, now / 1000, isDark);
    };

    const loop = () => {
      draw(performance.now());
      if (running) raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    draw(performance.now());
    start();

    const visHandler = () => { document.visibilityState === "hidden" ? stop() : start(); };
    document.addEventListener("visibilitychange", visHandler);
    return () => { stop(); document.removeEventListener("visibilitychange", visHandler); };
  }, [state, size]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={state === "listening" ? "Listening" : state === "thinking" ? "Thinking" : state === "speaking" ? "Speaking" : "Co-founder orb"}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}

function JarvisOrb({ state }) {
  return <ThinkingOrb state={state} size={180} />;
}

const JARVIS_PROMPTS = [
  "Where do we stand today?",
  "Biggest risk right now",
  "What should I do this week?",
];

function JarvisPanel({ module, companyLine, seed, onClose, company, variant = "app", onCta }) {
  // "public" is the marketing-site posture: no company context, guide persona,
  // and a signup CTA where the app build shows a wordmark. `module` is absent
  // out there, so every read of it has to tolerate undefined.
  const isPublic = variant === "public";
  const moduleName = (module && module.name) || "the GenCopilot marketing site";
  const peer = isPublic ? "GenCopilot" : "co-founder";
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState("idle"); // idle | listening | thinking | speaking
  const [voiceOut, setVoiceOut] = useState(true);
  const endRef = useRef(null);
  const speechRef = useRef(null);
  const busyRef = useRef(false);
  const loopRef = useRef(false);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;
  const voiceOutRef = useRef(voiceOut);
  voiceOutRef.current = voiceOut;
  const stateRef = useRef(state);
  stateRef.current = state;

  function stopSpeaking() {
    if (speechRef.current) { speechRef.current.stop(); speechRef.current = null; }
  }

  async function send(forced, autoListen) {
    const text = String(forced != null ? forced : input).trim();
    if (!text || busyRef.current) return;
    busyRef.current = true;
    setInput("");
    stopSpeaking();
    setMsgs((m) => [...m, { role: "user", text }]);
    setState("thinking");

    const historyText = msgsRef.current
      .slice(-6)
      .map((m) => (m.role === "user" ? "Founder: " : "Co-founder: ") + m.text)
      .join("\n");

    try {
      const reply = await askClaude(moduleName, historyText, text, companyLine, { publicMode: isPublic });
      setMsgs((m) => [...m, { role: "assistant", text: reply }]);
      if (voiceOutRef.current) {
        setState("speaking");
        await speakAloud(reply, (h) => { speechRef.current = h; });
        speechRef.current = null;
        setState("idle");
      } else {
        setState("idle");
      }
    } catch (e) {
      const detail = e && e.message ? " (" + e.message + ")" : "";
      setMsgs((m) => [...m, { role: "assistant", text: "I couldn't reach the AI right now" + detail + ". Try again in a moment." }]);
      setState("idle");
    }
    busyRef.current = false;
  }

  const speech = useSpeechRecognition((t) => { send(t); });

  useEffect(() => {
    if (speech.listening) setState("listening");
    else if (stateRef.current === "listening") setState("idle");
  }, [speech.listening]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, state, speech.interim]);

  useEffect(() => {
    if (seed && seed.prompt) send(seed.prompt);
  }, [seed ? seed.at : 0]);

  useEffect(() => () => { stopSpeaking(); loopRef.current = false; }, []);

  const statusLine =
    state === "listening" ? "Listening…" :
    state === "thinking" ? "Thinking…" :
    state === "speaking" ? "Speaking…" : "Ready to listen";

  // The app's quick actions all assume live numbers to reason over. On the
  // marketing site there are none, so the public set asks the questions a
  // visitor actually arrives with instead.
  const QUICK_ACTIONS = isPublic
    ? [
        { label: "What is it", prompt: "What is GenCopilot, and what does it actually replace for a founder?" },
        { label: "Modules", prompt: "Walk me through the modules — what does each one actually do?" },
        { label: "Pricing", prompt: "What does GenCopilot cost, and what do I get for free?" },
        { label: "Fit for us", prompt: "We're a pre-seed team of four. Honestly, is GenCopilot a fit for us right now?" },
      ]
    : [
        { label: "Research", prompt: "Research the latest market trends for our space and give me a quick briefing." },
        { label: "Brainstorm", prompt: "Brainstorm 3 product ideas we could ship this quarter with our current runway." },
        { label: "Write", prompt: "Draft a short investor update covering MRR, churn, and next quarter priorities." },
        { label: "Execute", prompt: "What are the top 3 actions I should take today based on our current metrics?" },
      ];

  return (
    <div className="flex flex-col h-full min-h-0 ink-invert" style={{ background: "#0a0a0a", color: "#ffffff" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">{isPublic ? "Ask GenCopilot" : "Co-founder"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setVoiceOut((v) => !v); stopSpeaking(); }}
            aria-pressed={voiceOut}
            title={voiceOut ? "Mute spoken replies" : "Speak replies aloud"}
            aria-label={voiceOut ? "Mute spoken replies" : "Speak replies aloud"}
            className={"p-2 rounded-lg transition-colors " + (voiceOut ? "text-zinc-300 hover:text-white hover:bg-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5")}
          >
            {voiceOut ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors" aria-label="Close">
              <PanelRightClose size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main content — centered orb + status */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-0 px-6">
        {/* Orb container with subtle glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: "rgba(255,255,255,0.10)" }} />
          <JarvisOrb state={state} />
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-zinc-200">
            {statusLine}
          </p>
          <p className="text-sm text-zinc-400 max-w-[240px] leading-relaxed">
            {msgs.length === 0
              ? (isPublic ? "Ask me anything about GenCopilot." : "Speak freely, I'm here to help.")
              : state === "idle"
                ? "Tap the mic or type a message."
                : state === "listening"
                  ? "I'm listening…"
                  : state === "thinking"
                    ? "Processing your question…"
                    : state === "speaking"
                      ? "Delivering my response…"
                      : ""}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-6 pb-3 flex justify-center gap-2 shrink-0">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => send(a.prompt)}
            disabled={busyRef.current}
            className="text-xs font-medium px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Footer. On the marketing site the wordmark is redundant — the visitor
          is already on it — so the space carries the conversion instead. */}
      <div className="px-6 pb-4 pt-1 text-center shrink-0">
        {isPublic && onCta ? (
          <button
            onClick={() => onCta("signup")}
            className="mono text-[11px] uppercase tracking-wide text-zinc-400 hover:text-white border-b border-zinc-600 hover:border-white pb-0.5"
          >
            Create a free account
          </button>
        ) : (
          <span className="text-[11px] text-zinc-500 tracking-wide">Powered by GenCopilot</span>
        )}
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4 shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={isPublic ? "Ask about GenCopilot…" : "Type a message…"}
            aria-label={isPublic ? "Ask GenCopilot" : "Message Co-founder"}
            className="chat-input flex-1 min-w-0 text-sm focus:outline-none"
          />
          <button
            onClick={speech.toggle}
            disabled={!speech.supported}
            aria-pressed={speech.listening}
            title={speech.supported ? (speech.listening ? "Stop listening" : "Talk to " + peer) : "Voice input needs Chrome, Edge or Safari"}
            aria-label={speech.supported ? (speech.listening ? "Stop listening" : "Talk to " + peer) : "Voice not supported"}
            className={
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-30 " +
              (speech.listening ? "bg-white text-zinc-900 pulse-dot" : "text-zinc-400 hover:text-white hover:bg-white/10")
            }
          >
            {speech.supported ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button
            onClick={() => { if (state === "speaking") { stopSpeaking(); setState("idle"); } else { send(); } }}
            disabled={state === "thinking"}
            aria-label={state === "speaking" ? "Stop speaking" : "Send"}
            className="w-9 h-9 rounded-xl bg-white text-zinc-900 disabled:opacity-30 flex items-center justify-center transition-all shrink-0 font-medium hover:bg-zinc-200"
          >
            {state === "speaking" ? <Square size={14} /> : <Send size={15} />}
          </button>
        </div>
      </div>

      {/* Chat history (scrollable, below the fold) */}
      {msgs.length > 0 && (
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-5 pb-5 space-y-3 border-t border-white/5">
          <div className="pt-4" />
          {msgs.map((m, i) => (
            <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={"max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap " + (m.role === "user" ? "chat-user-msg rounded-br-md" : "bg-white/5 text-zinc-200 border border-white/8 rounded-bl-md")}>
                {m.text}
              </div>
            </div>
          ))}
          {state === "thinking" && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 size={16} className="animate-spin text-zinc-400" />
              </div>
            </div>
          )}
          {speech.interim && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 text-sm italic text-zinc-500 border border-dashed border-white/10">
                {speech.interim}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}

// Docked right pane on desktop (drag the divider to resize) and a full-screen
// sheet on mobile, where a side-by-side split has nowhere to go.
function JarvisDock({ open, mobileOpen, onClose, onCloseMobile, module, companyLine, seed, company }) {
  const [w, setW] = useState(() => {
    const saved = Number(window.localStorage.getItem("gc.jarvisWidth"));
    return saved >= 320 && saved <= 720 ? saved : 400;
  });
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    try { window.localStorage.setItem("gc.jarvisWidth", String(w)); } catch { /* private mode */ }
  }, [w]);

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      e.preventDefault();
      setW(Math.min(720, Math.max(320, window.innerWidth - e.clientX)));
    };
    const up = () => setDrag(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [drag]);

  const panel = (
    <JarvisPanel module={module} companyLine={companyLine} seed={seed} company={company} onClose={onClose} />
  );

  return (
    <>
      {open && (
        <div className="hidden lg:block shrink-0" style={{ width: w }}>
          <div className="sticky top-0 h-screen flex">
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize Jarvis panel"
              tabIndex={0}
              onPointerDown={(e) => { e.preventDefault(); setDrag(true); }}
              onDoubleClick={() => setW(400)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") { e.preventDefault(); setW((v) => Math.min(720, v + 24)); }
                else if (e.key === "ArrowRight") { e.preventDefault(); setW((v) => Math.max(320, v - 24)); }
              }}
              className={"w-1.5 shrink-0 cursor-col-resize border-l border-white/8 transition-colors " + (drag ? "bg-violet-500" : "bg-transparent hover:bg-violet-500/30")}
            />
            <div className="flex-1 min-w-0 border-l border-white/8">{panel}</div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <div className="relative mt-auto h-[85vh] rounded-t-2xl overflow-hidden shadow-2xl">
            <JarvisPanel module={module} companyLine={companyLine} seed={seed} company={company} onClose={onCloseMobile} />
          </div>
        </div>
      )}
    </>
  );
}

// ----------------------------------------------- public: marketing copilot --
// The dashboard's assistant, brought out onto the marketing site so a visitor
// can interrogate the product before signing up.
//
// It floats rather than splitting the screen the way JarvisDock does: the
// public pages are a single scroll column whose sections are composed against
// the full viewport width, and carving 400px out of them would wreck every one
// of those compositions. Public mode (see PUBLIC_SYSTEM_PROMPT) also strips the
// company context, so this panel never speaks about numbers the visitor has
// not given it.
function PublicCopilot({ open, seed, onOpen, onClose, onAuth }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // The mobile sheet covers the page; without this the marketing page keeps
  // scrolling under it whenever a touch lands outside the message list.
  useEffect(() => {
    if (!open) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const panel = <JarvisPanel variant="public" seed={seed} onClose={onClose} onCta={onAuth} />;

  return (
    <>
      {!open && (
        <button
          onClick={() => onOpen()}
          className="pc-launcher fixed bottom-4 right-4 z-[55] flex items-center gap-2.5 pl-2 pr-4 py-2"
          aria-label="Ask the GenCopilot AI"
        >
          <span className="pc-launcher-orb" aria-hidden="true">
            <ThinkingOrb state="idle" size={30} />
          </span>
          <span className="mono text-[11px] uppercase tracking-wide">Ask the AI</span>
        </button>
      )}

      {open && (
        <div
          className="pc-panel hidden md:flex fixed bottom-4 right-4 z-[60] flex-col overflow-hidden"
          role="dialog"
          aria-label="Ask GenCopilot"
          style={{ width: 400, height: "min(640px, calc(100vh - 2rem))" }}
        >
          {panel}
        </div>
      )}

      {open && (
        <div className="md:hidden fixed inset-0 z-[60] flex flex-col" role="dialog" aria-label="Ask GenCopilot">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="pc-panel relative mt-auto h-[88vh] overflow-hidden">{panel}</div>
        </div>
      )}
    </>
  );
}

// The hero's own way in. It deliberately does not answer inline: a second
// transcript on the page would fork the conversation, so this seeds the
// floating panel and everything continues in one place.
function HeroAsk({ onAsk }) {
  const [q, setQ] = useState("");
  const CHIPS = ["What is GenCopilot?", "Which modules do I get?", "Is it free?"];

  const fire = (text) => {
    const t = String(text || "").trim();
    if (!t) return;
    setQ("");
    onAsk(t);
  };

  return (
    <div>
      <div className="flex items-center gap-2 border border-white/15 px-3 py-2">
        <Sparkles size={15} className="shrink-0 text-zinc-400" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") fire(q); }}
          placeholder="Ask the AI co-founder anything…"
          aria-label="Ask the AI co-founder anything"
          className="chat-input flex-1 min-w-0 text-sm focus:outline-none"
        />
        <button
          onClick={() => fire(q)}
          className="w-9 h-9 flex items-center justify-center shrink-0"
          style={{ background: "var(--fg)", color: "var(--bg)" }}
          aria-label="Ask"
        >
          <Send size={15} />
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => fire(c)}
            className="mono text-[10px] uppercase tracking-wide px-2.5 py-1 border border-white/15 text-zinc-400 hover:text-white hover:border-white/40"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ public: nav --
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 35.2 44 30 44 24c0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
        <Rocket size={18} className="text-white" />
      </span>
      <span className={"font-display text-xl tracking-tight " + (light ? "text-white" : "text-slate-900")}>
        Gen<span className="italic">Copilot</span>
      </span>
    </span>
  );
}

function scrollToId(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 80);
}

function PublicNav({ route, go, onAuth, onAskAI }) {
  const [open, setOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const link = "text-sm font-semibold text-slate-600 hover:text-violet-700 transition px-1 py-2";
  const items = (
    <>
      <button className={link} onClick={() => { setOpen(false); go("landing"); scrollToId("features"); }}>Features</button>
      <button className={link} onClick={() => { setOpen(false); go("about"); }}>About</button>
      <button className={link} onClick={() => { setOpen(false); go("contact"); }}>Contact</button>
    </>
  );
  return (
    <header className="sticky top-0 z-40 lp-glass border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <button onClick={() => go("landing")} aria-label="GenCopilot home"><Logo /></button>
        <nav className="hidden md:flex items-center gap-6">{items}</nav>
        <div className="hidden md:flex items-center gap-2.5">
          <Btn variant="ghost" onClick={() => onAskAI()}><Sparkles size={14} /> Ask AI</Btn>
          <Btn variant="ghost" onClick={() => onAuth("login")}>Log in</Btn>
          <Magnet padding={40} magnetStrength={4} disabled={reducedMotion}>
            <Btn onClick={() => onAuth("signup")}>Sign Up Free <ArrowRight size={15} /></Btn>
          </Magnet>
        </div>
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 flex flex-col gap-1 anim-fadeUp">
          {items}
          <Btn variant="ghost" className="mt-1" onClick={() => { setOpen(false); onAskAI(); }}><Sparkles size={14} /> Ask AI</Btn>
          <div className="flex gap-2 pt-2">
            <Btn variant="ghost" className="flex-1" onClick={() => { setOpen(false); onAuth("login"); }}>Log in</Btn>
            <Btn className="flex-1" onClick={() => { setOpen(false); onAuth("signup"); }}>Sign Up Free</Btn>
          </div>
        </div>
      )}
    </header>
  );
}

// Social handles are not hard-coded on purpose: inventing URLs for a real
// company is worse than showing nothing. Fill these in and the row appears;
// leave one empty and that icon is omitted rather than rendered dead.
const SOCIAL_LINKS = [
  { Icon: Twitter, label: "GenCopilot on X", url: "" },
  { Icon: Linkedin, label: "GenCopilot on LinkedIn", url: "" },
  { Icon: Github, label: "GenCopilot on GitHub", url: "" },
];

// Plain-language summary of what the app actually does with data, derived from
// the code (anonymous Firebase auth, per-uid Firestore documents).
// DRAFT: have counsel review and replace before launch.
const LEGAL = {
  Privacy: {
    title: "Privacy",
    body: [
      "DRAFT — this summary describes how the product currently behaves. Have counsel review it before launch.",
      "Your workspace is stored in Firestore under a document keyed to your own account id. Security rules restrict read and write access to that id, so no other signed-in user can reach your company data.",
      "Signing in anonymously creates an account id with no email attached. If you never enter an email address, we hold no contact details for you.",
      "Contact-form submissions are write-only from the browser: the client can create a message but cannot read any back.",
      "We do not sell personal data, and there is no advertising or third-party analytics SDK in the client.",
    ],
  },
  Terms: {
    title: "Terms",
    body: [
      "DRAFT — this summary describes how the product currently behaves. Have counsel review it before launch.",
      "GenCopilot is provided as-is while in early access, with no uptime guarantee. Do not rely on it as the sole record of anything you cannot afford to lose.",
      "You keep ownership of everything you enter. You grant us only the access needed to store it and show it back to you.",
      "Figures the copilot produces — runway, burn, churn, valuation — are estimates generated from the numbers you supply. They are not financial, legal, or tax advice.",
      "Do not use the service unlawfully or attempt to reach another workspace's data.",
    ],
  },
  Security: {
    title: "Security",
    body: [
      "DRAFT — this summary describes how the product currently behaves. Have counsel review it before launch.",
      "Authentication and storage are handled by Firebase. Traffic runs over TLS and credentials are never stored in this application's own code.",
      "Firestore security rules are deny-by-default: a document is reachable only when the requesting account id owns it. Company data lives under companies/{uid} and is owner-only.",
      "The client holds no service-account keys or admin credentials. Only public Firebase config, which is designed to be shipped to browsers, is present.",
      "Found a vulnerability? Use the contact form and we will respond before disclosure.",
    ],
  },
};

// Shared popup for the LEGAL texts (Privacy / Terms / Security) — used by the
// footer links and by the auth form's agreement line.
function LegalModal({ k, onClose, onContact }) {
  if (!k) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.6)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={LEGAL[k].title}
    >
      <div
        className="bg-white max-w-2xl w-full max-h-[80vh] overflow-auto p-8 scroll-thin mo-trace"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-2xl font-extrabold text-slate-900">{LEGAL[k].title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-slate-500 hover:text-slate-900 transition shrink-0">
            <X size={20} />
          </button>
        </div>
        <div className="mo-rule mt-4 mb-5" />
        {LEGAL[k].body.map((para, i) => (
          <p key={i} className={"text-sm leading-relaxed mb-3 " + (i === 0 ? "mono text-slate-500 uppercase text-[11px]" : "text-slate-700")}>
            {para}
          </p>
        ))}
        <div className="mt-6 flex gap-3">
          {onContact && <Btn onClick={onContact}>Contact us</Btn>}
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

function FooterBig({ go, onAuth }) {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [legal, setLegal] = useState(null);
  const socials = SOCIAL_LINKS.filter((s) => s.url);
  return (
    <footer className="bg-slate-900 text-slate-300 mt-0">
      <AnimatedContent distance={40} duration={0.7} ease="power3.out" threshold={0.08}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">Your AI copilot for startup success — ten modules, one login, zero heroic spreadsheets.</p>
          {socials.length > 0 && (
            <div className="flex gap-2.5 mt-5">
              {socials.map(({ Icon, label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  title={label}
                  className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-violet-600 hover:-translate-y-1 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-bold text-white mb-4">Product</div>
          <ul className="space-y-2.5 text-sm">
            {["Founder Dashboard", "PMF Validator", "Lead Prioritization", "Churn Prediction", "Runway Intelligence"].map((l) => (
              <li key={l}><button onClick={() => onAuth("signup")} className="hover:text-white transition">{l}</button></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-bold text-white mb-4">Company</div>
          <ul className="space-y-2.5 text-sm">
            <li><button onClick={() => go("about")} className="hover:text-white transition">About us</button></li>
            <li><button onClick={() => go("contact")} className="hover:text-white transition">Contact</button></li>
            <li><button onClick={() => go("about")} className="hover:text-white transition">Careers</button></li>
            <li><button onClick={() => { go("landing"); setTimeout(() => scrollToId("pricing"), 60); }} className="hover:text-white transition">Pricing</button></li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-bold text-white mb-4">Founder notes, monthly</div>
          <p className="text-sm text-slate-400 mb-3">One email a month on metrics, fundraising, and not burning out.</p>
          {ok ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold"><CheckCircle2 size={16} /> You're on the list.</div>
          ) : (
            <div className="flex gap-2">
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.nextElementSibling?.click(); }}
                aria-label="Email address"
                aria-invalid={!!emailErr}
                placeholder="you@startup.com"
                className="flex-1 min-w-0 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none"
              />
              <Btn
                onClick={() => {
                  // Was silently inert on invalid input — now it says why.
                  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
                  if (!valid) { setEmailErr(email.trim() ? "That email doesn't look right." : "Enter your email first."); return; }
                  setOk(true); setEmail(""); setEmailErr("");
                }}
              >
                Join
              </Btn>
            </div>
          )}
          {emailErr && <div className="text-xs mt-2 font-semibold" style={{ color: "var(--danger)" }} role="alert">{emailErr}</div>}
        </div>
      </div>
      </AnimatedContent>
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>© 2026 GenCopilot, Inc. All rights reserved.</span>
          <span className="flex gap-4">
            {["Privacy", "Terms", "Security"].map((k) => (
              <button key={k} onClick={() => setLegal(k)} className="hover:text-white transition">{k}</button>
            ))}
          </span>
        </div>
      </div>

      <LegalModal k={legal} onClose={() => setLegal(null)} onContact={() => { setLegal(null); go("contact"); }} />
    </footer>
  );
}

// --------------------------------------------------------- public: landing -
// The pinned walkthrough's four stages. Each carries its own generated plate,
// so the artwork turns over as the copy does — no image assets involved.
const LANDING_STEPS = [
  {
    label: "Connect your numbers",
    title: "Start with what you already have.",
    body: "MRR, cash, burn, customers, churn. Enter them once in Company Data — that becomes the single source of truth every other module reads from.",
    variant: "bars",
    seed: 7,
  },
  {
    label: "Ten modules light up",
    title: "One entry, ten live workspaces.",
    body: "Runway projects itself. Unit economics resolve. Churn cohorts assemble. Nothing gets re-entered, because nothing is a separate tool.",
    variant: "orbit",
    seed: 13,
  },
  {
    label: "The copilot starts advising",
    title: "An AI co-founder that reads your data.",
    body: "It has your live numbers open in front of it and knows how every module connects. Ask where you stand and it answers from your figures, not from a template.",
    variant: "concentric",
    seed: 21,
  },
  {
    label: "Ship the week's decisions",
    title: "Leave with the three things that matter.",
    body: "Risk alerts, prioritised leads, save plays, filing deadlines. The cockpit tells you what moved and what needs you — before the Monday meeting, not during it.",
    variant: "wave",
    seed: 29,
  },
];

// Pinned walkthrough. The section holds still while the four stages advance,
// so the sequence is read at scroll speed instead of skimmed past.
//
// Under prefers-reduced-motion PinnedSteps never registers its trigger and
// would sit on stage one forever, silently dropping three quarters of the
// copy. That case gets a plain stacked rendering instead.
function HowItWorks() {
  const reduced = prefersReduced();

  const plate = (step) => (
    <div className="aspect-square w-full max-w-md mx-auto border border-white/15 p-8 text-white">
      <SpecimenPlate seed={step.seed} variant={step.variant} />
    </div>
  );

  if (reduced) {
    return (
      <section className="border-t border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHead kicker="How it works" title="From your numbers to your next three decisions" />
          <div className="mt-14 space-y-16">
            {LANDING_STEPS.map((s, i) => (
              <div key={s.label} className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="mono text-[11px] uppercase text-zinc-500 mb-4">
                    {String(i + 1).padStart(2, "0")} · {s.label}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">{s.title}</h3>
                  <p className="mt-4 text-zinc-400 leading-relaxed max-w-md">{s.body}</p>
                </div>
                <div className="hidden lg:block">{plate(s)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-gray-200">
      <PinnedSteps
        steps={LANDING_STEPS}
        height={320}
        renderStep={(active, steps) => (
          <div className="min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full grid lg:grid-cols-2 gap-14 items-center">
              <div>
                <div className="mono text-[11px] uppercase text-zinc-500 mb-5">
                  How it works · {String(active + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {steps[active].title}
                </h2>
                <div className="mo-rule mo-rule-thick mt-6 max-w-md" />
                <p className="mt-5 text-lg text-zinc-400 leading-relaxed max-w-md">{steps[active].body}</p>
                <ol className="mt-8 space-y-2.5">
                  {steps.map((s, i) => (
                    <li key={s.label} className="flex items-center gap-3">
                      <span
                        className="mono text-[10px] w-6 h-6 flex items-center justify-center shrink-0"
                        style={{
                          border: "1px solid var(--fg)",
                          background: i === active ? "var(--fg)" : "transparent",
                          color: i === active ? "var(--bg)" : "var(--fg-muted)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span className={"text-sm " + (i === active ? "text-white font-semibold" : "text-zinc-500")}>
                        {s.label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="relative hidden lg:block">{plate(steps[active])}</div>
            </div>
          </div>
        )}
      />
    </section>
  );
}

function Landing({ go, onAuth, onAsk }) {
  const previewRef = useParallax(0.05);
  const reducedMotion = usePrefersReducedMotion();
  // Pinned sections measure their start on mount, before the display face has
  // loaded. Refreshing once fonts settle stops the pin from firing early.
  useScrollTriggerRefresh([]);
  return (
    <div>
      {/* Hero */}
      <section className="relative hero-grad overflow-hidden mo-scan">
        {/* generated dot field: swells toward the cursor, breathes on its own */}
        <div className="absolute inset-0 mo-halftone pointer-events-none" aria-hidden="true">
          <HalftoneField />
        </div>
        {/* WebGL aurora in brand violet/fuchsia — plain alpha compositing so it
            reads on the light editorial ground as well as the dark theme */}
        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none opacity-60" aria-hidden="true">
            <Aurora colorStops={["#7c3aed", "#d946ef", "#4f46e5"]} amplitude={1.0} blend={0.55} speed={0.7} />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-2 gap-14 items-center relative">
          <div>
            <div className="mono text-[11px] uppercase text-zinc-500 mb-5 flex items-center gap-2">
              <Sparkles size={12} className="mo-char" style={{ animationDelay: "0ms" }} />
              {reducedMotion ? (
                <MoChars text="New · AI-native startup operating system" delay={120} step={18} />
              ) : (
                <DecryptedText
                  text="New · AI-native startup operating system"
                  animateOn="view"
                  sequential
                  speed={22}
                  encryptedClassName="opacity-50"
                />
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {reducedMotion ? (
                <MoLine delay={260}>Your AI Copilot for</MoLine>
              ) : (
                <SplitText
                  tag="span"
                  className="block"
                  text="Your AI Copilot for"
                  splitType="chars"
                  delay={28}
                  duration={0.9}
                  from={{ opacity: 0, y: 46 }}
                  to={{ opacity: 1, y: 0 }}
                  textAlign="left"
                />
              )}
              <MoLine delay={480} className="italic">
                <ShinyText
                  text="Startup Success"
                  disabled={reducedMotion}
                  speed={3.2}
                  delay={1}
                  color="#7c3aed"
                  shineColor="#d946ef"
                  spread={110}
                />
              </MoLine>
            </h1>
            <div className="mo-rule mo-rule-thick mt-6 max-w-xl" style={{ animationDelay: "620ms" }} />
            <p className="mt-5 text-lg text-zinc-400 leading-relaxed max-w-xl">
              <MoLine delay={720}>Productivity, product–market fit, leads, churn, runway,</MoLine>
              <MoLine delay={790}>compliance, and automation — ten intelligent modules that</MoLine>
              <MoLine delay={860}>replace the tab chaos with one clear cockpit.</MoLine>
            </p>
            <div className="mt-8 flex flex-wrap gap-3" style={{ animation: "fadeUp .8s cubic-bezier(.16,1,.3,1) 950ms both" }}>
              <Magnet padding={60} magnetStrength={3} disabled={reducedMotion}>
                <MoBtn inverted className="px-6 py-3 text-base" onClick={() => onAuth("signup")}>
                  Sign Up Free <ArrowRight size={17} />
                </MoBtn>
              </Magnet>
              <Magnet padding={60} magnetStrength={3} disabled={reducedMotion}>
                <MoBtn variant="ghost" className="px-6 py-3 text-base" onClick={() => scrollToId("features")}>
                  Explore Features
                </MoBtn>
              </Magnet>
            </div>
            {/* The copilot, surfaced on the marketing page itself: ask it
                before signing up rather than after. */}
            <div className="mt-7 max-w-xl" style={{ animation: "fadeUp .8s cubic-bezier(.16,1,.3,1) 1010ms both" }}>
              <HeroAsk onAsk={onAsk} />
            </div>
            <div className="mt-8 flex items-center gap-3" style={{ animation: "fadeUp .8s cubic-bezier(.16,1,.3,1) 1080ms both" }}>
              {/* The overlap idiom relied on rounded-full + a white ring to
                  separate the discs. The monochrome layer strips radius, so the
                  stack collapsed into one muddy block with the first initials
                  clipped. Squared plates in a row read correctly instead. */}
              <div className="flex gap-1" aria-hidden="true">
                {["AM", "SK", "RB", "JT"].map((initials, i) => (
                  <span
                    key={initials}
                    className="w-8 h-8 flex items-center justify-center text-[10px] font-bold mono"
                    style={{
                      border: "1px solid var(--fg)",
                      background: i % 2 === 0 ? "var(--fg)" : "var(--bg)",
                      color: i % 2 === 0 ? "var(--bg)" : "var(--fg)",
                    }}
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <span className="text-sm text-zinc-400">
                <span className="font-bold text-zinc-200"><CountUp to={2300} duration={2.2} separator="," />+ founders</span> run their startup here
              </span>
            </div>
          </div>

          {/* Floating product preview */}
          <div className="relative" ref={previewRef}>
            <Card className="p-5 md:rotate-1 shadow-xl mo-trace mo-draw" style={{ animation: "fadeUp 1s cubic-bezier(.16,1,.3,1) 320ms both" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <Badge tone="blue"><Activity size={11} /> Live dashboard</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                <div className="rounded-xl bg-violet-500/10 p-3">
                  <div className="text-[11px] font-bold text-violet-400 uppercase tracking-wide mono">MRR</div>
                  <div className="text-lg font-extrabold text-white">$48.2k</div>
                  <div className="text-[11px] font-semibold text-emerald-400">+7.4%</div>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide mono">Runway</div>
                  <div className="text-lg font-extrabold text-white">9.5 mo</div>
                  <div className="text-[11px] font-semibold text-zinc-400">$530k cash</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mono">NPS</div>
                  <div className="text-lg font-extrabold text-white">42</div>
                  <div className="text-[11px] font-semibold text-emerald-400">+3 pts</div>
                </div>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MONTHS} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                    <Area type="monotone" dataKey="users" stroke={BLUE} strokeWidth={2.5} fill="url(#heroFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
                <AlertTriangle size={14} className="text-red-400 shrink-0" />
                <span className="text-xs font-semibold text-red-400">Risk alert: runway under 10 months — copilot has 3 suggestions</span>
              </div>
            </Card>
            <div className="absolute -bottom-5 -left-4 hidden sm:block" style={{ animation: "floatY2 10s ease-in-out infinite" }}>
              <Card className="px-4 py-3 flex items-center gap-2.5 shadow-lg">
                <span className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center"><Sparkles size={15} className="text-white" /></span>
                <span className="text-xs font-semibold text-zinc-300">"Cut burn 12% by pausing 2 unused tools" <span className="text-zinc-500">— AI copilot</span></span>              </Card>
            </div>
          </div>
        </div>
        {/* mono ticker: the cockpit's vital signs, always moving */}
        <div className="border-t border-gray-200 py-3 mo-marquee" style={{ animation: "fadeUp .8s cubic-bezier(.16,1,.3,1) 1200ms both" }}>
          {[0, 1].map((dup) => (
            <div key={dup} className="mo-marquee-track" aria-hidden={dup === 1}>
              {[
                "MRR $48.2K +7.4%", "RUNWAY 9.5 MO", "NPS 42 +3", "CHURN 2.1% −0.4",
                "LEADS 318 THIS WEEK", "BURN $56K/MO", "PMF SCORE 61", "COMPLIANCE 8/9 CLEAR",
              ].map((t, i) => (
                <span key={i} className="mono text-[11px] uppercase text-zinc-500 whitespace-nowrap flex items-center gap-2.5">
                  <span className="w-1 h-1 bg-current inline-block" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Specimen field: generated plates sliding past each other, opposite
          directions, sheared by scroll velocity. */}
      <section className="relative py-14 border-b border-gray-200 overflow-hidden">
        <OpposingMarquee rows={3} perRow={9} speed={38} />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10"
             style={{ background: "linear-gradient(90deg, var(--bg), transparent)" }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10"
             style={{ background: "linear-gradient(270deg, var(--bg), transparent)" }} />
      </section>

      {/* Flip-card feature grid: the 10 tracks */}
      <section id="features" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        <SectionHead
          center
          kicker="Six tracks · ten modules"
          title="Everything a founder juggles, in one place"
          desc="Hover any card to flip it. Every module is a full interactive workspace inside the dashboard — charts, actions, and its own AI assistant."
        />
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {MODULES.map((m, i) => (
            <AnimatedContent key={m.id} distance={44} duration={0.55} ease="power3.out" threshold={0.12} delay={(i % 5) * 0.07}>
            <div className="flip h-44">
              <div className="flip-inner">
                <div className="flip-face bg-white/5 border border-white/6 backdrop-blur-sm p-4 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center"><m.icon size={19} /></div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-fuchsia-400">{m.track}</div>
                    <div className="text-sm font-extrabold text-white leading-snug mt-1">{m.name}</div>
                  </div>
                </div>
                <button onClick={() => onAuth("signup")} className="flip-face flip-back bg-zinc-900 text-left p-4 flex flex-col justify-between cursor-pointer w-full">
                  <p className="text-xs text-zinc-300 leading-relaxed">{m.blurb}</p>
                  <span className="text-xs font-bold text-fuchsia-400 inline-flex items-center gap-1">Explore <ArrowRight size={12} /></span>
                </button>
              </div>
            </div>
            </AnimatedContent>
          ))}
        </div>
      </section>

      <HowItWorks />

      {/* Carousel */}
      <section className="bg-white/[.03] py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHead center kicker="Why GenCopilot" title="Built to end fragmented startup chaos" />
          <Carousel />
        </div>
      </section>

      {/* Stats band — numerals scrubbed by scroll position, halftone behind */}
      <section className="bg-[#060608] py-20 relative overflow-hidden">
        <div className="absolute inset-0 mo-halftone pointer-events-none" aria-hidden="true">
          <HalftoneField gap={26} />
        </div>
        {/* drifting particle field in brand tones behind the numerals */}
        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <Particles
              className="w-full h-full"
              particleCount={160}
              particleSpread={12}
              speed={0.08}
              particleColors={["#a78bfa", "#e879f9", "#f5f3ff"]}
              particleBaseSize={60}
              sizeRandomness={1}
              alphaParticles
            />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center relative">
          {[
            [10, "", 0, "modules, one login"],
            [9, " tools", 0, "replaced on average"],
            [3.4, "×", 1, "faster weekly reporting"],
            [24, "/7", 0, "AI copilot on your data"],
          ].map(([n, suffix, decimals, l], i) => (
            <AnimatedContent key={l} distance={36} duration={0.6} ease="power3.out" threshold={0.2} delay={i * 0.09}>
            <div>
              <div className="text-4xl font-extrabold text-violet-400 mo-tick">
                <ScrubCounter to={n} suffix={suffix} decimals={decimals} />
              </div>
              <div className="mo-rule mx-auto mt-3 mb-2" style={{ width: 34, animationDelay: i * 90 + "ms" }} />
              <div className="text-sm text-zinc-500 font-medium">{l}</div>
            </div>
            </AnimatedContent>
          ))}
        </div>
      </section>

      {/* CTA band — also the target the footer's Pricing link scrolls to,
          since early access is free and this band is the pricing statement. */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 md:px-6 py-20">
        {/* The closing plate wipes open as it enters — clip-path scrubbed by
            scroll position, so it tracks the reader rather than a timer. */}
        <ScrubWipe from="left">
          <div className="rounded-3xl bg-violet-600 p-10 md:p-14 text-center text-white relative overflow-hidden">
            {/* generated dot field on the plate, inherits the inverted ink ramp */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ color: "var(--fg)", opacity: 0.4 }}>
              <HalftoneField gap={20} dotMax={2.8} />
            </div>
            <div className="relative">
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {reducedMotion ? (
                  <MoLine delay={0}>Stop guessing. Start piloting.</MoLine>
                ) : (
                  <GradientText colors={["#ffffff", "#f5d0fe", "#ffffff"]} animationSpeed={7}>
                    Stop guessing. Start piloting.
                  </GradientText>
                )}
              </h3>
              <div className="mo-rule mx-auto mt-5" style={{ width: 120, background: "var(--fg)" }} />
              <p className="mt-5 text-white/85 max-w-xl mx-auto">
                Free for early-stage teams. Set up in minutes — your dashboard is one signup away.
              </p>
              <div className="mt-7 flex justify-center gap-3 flex-wrap">
                <Magnet padding={60} magnetStrength={3} disabled={reducedMotion}>
                  <MoBtn variant="dark" inverted className="bg-white text-violet-700 hover:bg-violet-50 px-6 py-3 text-base" onClick={() => onAuth("signup")}>Create free account</MoBtn>
                </Magnet>
                <Magnet padding={60} magnetStrength={3} disabled={reducedMotion}>
                  <MoBtn variant="dark" className="bg-black/30 hover:bg-black/45 px-6 py-3 text-base" onClick={() => go("contact")}>Talk to us</MoBtn>
                </Magnet>
              </div>
            </div>
          </div>
        </ScrubWipe>
      </section>
    </div>
  );
}

function Carousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  // `i` is in the deps on purpose: picking a slide restarts the countdown, so
  // an explicit choice always gets a full interval to be read. Without it the
  // pending tick could fire immediately after a click and yank the slide away.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % CAROUSEL.length), 4800);
    return () => clearInterval(t);
  }, [paused, i]);
  return (
    <div className="mt-10 relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden rounded-3xl">
        <div className="flex transition-transform duration-700 ease-out" style={{ transform: "translateX(-" + i * 100 + "%)" }}>
          {CAROUSEL.map((s) => (
            <div key={s.title} className="w-full shrink-0">
              <Card className="rounded-3xl p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md mb-5">
                    <s.icon size={26} />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900">{s.title}</h3>
                  <p className="mt-3 text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
                <ul className="space-y-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3.5">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={13} /></span>
                      <span className="text-sm font-semibold text-slate-700">{p}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={() => setI((i - 1 + CAROUSEL.length) % CAROUSEL.length)} className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-violet-400 hover:text-violet-600 transition" aria-label="Previous"><ChevronLeft size={17} /></button>
        <div className="flex gap-2">
          {CAROUSEL.map((_, d) => (
            // The visible pill stays 8px, but the hit area is padded out to the
            // 24px WCAG 2.5.8 floor via a transparent box around it.
            <button
              key={d}
              onClick={() => setI(d)}
              aria-label={"Slide " + (d + 1)}
              aria-current={d === i ? "true" : undefined}
              className="grid place-items-center bg-transparent"
              style={{ minWidth: 24, minHeight: 24, padding: 0 }}
            >
              <span
                aria-hidden="true"
                className={"block h-2 rounded-full transition-all duration-300 " + (d === i ? "w-7 bg-violet-600" : "w-2 bg-gray-300 hover:bg-gray-400")}
              />
            </button>
          ))}
        </div>
        <button onClick={() => setI((i + 1) % CAROUSEL.length)} className="w-9 h-9 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:border-violet-400 hover:text-violet-600 transition" aria-label="Next"><ChevronRight size={17} /></button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------- public: about -
function About({ onAuth }) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16">
      {/* cursor-reactive wave field behind the header, fading downward */}
      {!reducedMotion && (
        <div
          className="absolute inset-x-0 top-0 h-80 z-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
          style={{
            maskImage: "linear-gradient(to bottom, black 35%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 35%, transparent)",
          }}
        >
          <Waves lineColor="rgba(124, 58, 237, 0.16)" xGap={14} yGap={36} waveAmpX={26} waveAmpY={13} className="w-full h-full" />
        </div>
      )}
      <div className="relative z-10">
      <SectionHead center kicker="About us" title="We build calm for chaotic companies" desc="GenCopilot exists because early-stage teams deserve enterprise-grade clarity without an enterprise-grade ops team." />

      <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <AnimatedContent distance={44} duration={0.65} ease="power3.out" threshold={0.15}>
        <Card className="p-7 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4"><Target size={20} /></div>
          <h3 className="text-lg font-extrabold text-slate-900">Our mission</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">Give every founder a real-time, intelligent picture of their startup — demand, customers, cash, and obligations — so decisions are made on evidence, not vibes.</p>
        </Card>
        </AnimatedContent>
        <AnimatedContent distance={44} duration={0.65} ease="power3.out" threshold={0.15} delay={0.1}>
        <Card className="p-7 hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center mb-4"><Eye size={20} /></div>
          <h3 className="text-lg font-extrabold text-slate-900">Our vision</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">A world where no startup dies of preventable causes: unseen churn, silent burn, missed filings, or effort spent on the wrong leads.</p>
        </Card>
        </AnimatedContent>
      </div>

      {/* Animated timeline */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-10">How we got here</h3>
        <div className="relative border-l-2 border-violet-100 ml-3">
          {TIMELINE.map((t, i) => (
            <AnimatedContent key={t.year} direction="horizontal" reverse distance={48} duration={0.6} ease="power3.out" threshold={0.15} delay={i * 0.08}>
            <div className="relative pl-8 pb-10">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-violet-600" />
              <div className="text-xs font-bold uppercase tracking-widest text-fuchsia-600">{t.year}</div>
              <div className="text-base font-extrabold text-slate-900 mt-1">{t.title}</div>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{t.desc}</p>
            </div>
            </AnimatedContent>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mt-16">
        <h3 className="text-2xl font-extrabold text-slate-900 text-center mb-10">The crew</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TEAM.map((p, i) => (
            <AnimatedContent key={p.name} distance={40} duration={0.55} ease="power3.out" threshold={0.15} delay={i * 0.08}>
            <Card className="text-center hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 overflow-hidden">
              <GlareHover width="100%" height="auto" background="transparent" borderRadius="1rem" borderColor="transparent" glareOpacity={0.28} glareAngle={-35} glareSize={220} transitionDuration={750} className="p-6">
                <div className={"w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white text-lg font-extrabold shadow-md " + p.color}>{p.initials}</div>
                <div className="mt-4 font-extrabold text-slate-900">{p.name}</div>
                <div className="text-xs font-bold text-violet-600 uppercase tracking-wide mt-0.5">{p.role}</div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{p.tag}</p>
              </GlareHover>
            </Card>
            </AnimatedContent>
          ))}
        </div>
      </div>

      <div className="mt-16 text-center">
        <Magnet padding={60} magnetStrength={3} disabled={reducedMotion}>
          <Btn className="px-6 py-3 text-base" onClick={() => onAuth("signup")}>Join 2,300+ founders <ArrowRight size={16} /></Btn>
        </Magnet>
      </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------- public: contact -
function Contact() {
  const reducedMotion = usePrefersReducedMotion();
  const [f, setF] = useState({ name: "", email: "", msg: "" });
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const socials = [Twitter, Linkedin, Github, Globe];

  // Submissions go two ways on purpose:
  //   1. Firestore `contacts` — the durable record. Needs no configuration
  //      (the security rules already allow create-only from the client), so a
  //      message is never lost even if mail delivery isn't set up yet.
  //   2. POST /api/contact — verifies reCAPTCHA and sends the email.
  // Firestore is awaited first; the email is best-effort on top of it. Only a
  // total failure of BOTH is reported as an error to the sender.
  async function submit() {
    if (!f.name.trim() || !f.msg.trim()) return setErr("Please add your name and a short message.");
    if (!EMAIL_RE.test(f.email.trim())) return setErr("That email doesn't look right — mind checking it?");
    setErr("");
    setBusy(true);

    const payload = { name: f.name.trim(), email: f.email.trim(), message: f.msg.trim() };
    let stored = false;
    let mailed = false;

    try {
      const fb = await import("./firebase.js");
      await fb.saveContactSubmission(payload);
      stored = true;
    } catch (e) {
      console.warn("[contact] Firestore write failed:", e?.message || e);
    }

    try {
      const recaptchaToken = await getRecaptchaToken("contact");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, recaptchaToken }),
      });
      if (res.ok) mailed = true;
      else console.warn("[contact] /api/contact responded", res.status);
    } catch (e) {
      console.warn("[contact] /api/contact unreachable:", e?.message || e);
    }

    setBusy(false);
    if (stored || mailed) setSent(true);
    else setErr("We couldn't send that — please email gencopilotfounder@gmail.com directly.");
  }

  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16">
      {/* interactive dot field — dots scatter away from fast cursor moves */}
      {!reducedMotion && (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <DotGrid dotSize={5} gap={26} baseColor="#ede9fe" activeColor="#8b5cf6" proximity={130} shockRadius={220} shockStrength={4} className="w-full h-full" />
        </div>
      )}
      <div className="relative z-10">
      <SectionHead center kicker="Contact" title="Talk to a human (we have several)" desc="Questions, partnerships, or a demo for your team — we reply within one business day." />
      <div className="mt-12 grid lg:grid-cols-2 gap-6 items-start">
        <AnimatedContent distance={48} duration={0.7} ease="power3.out" threshold={0.15}>
        <Card className="p-7">
          {sent ? (
            <div className="text-center py-10 anim-fadeUp">
              <span className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 size={30} /></span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-5">Message sent</h3>
              <p className="text-sm text-slate-500 mt-2">Thanks, {f.name.split(" ")[0]} — we'll get back to {f.email} shortly.</p>
              <Btn variant="ghost" className="mt-6" onClick={() => { setSent(false); setF({ name: "", email: "", msg: "" }); }}>Send another</Btn>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Name" placeholder="Ada Lovelace" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <Field label="Email" placeholder="ada@analytical.engine" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Message</span>
                <textarea
                  rows={5}
                  placeholder="Tell us what you're building…"
                  value={f.msg}
                  onChange={(e) => setF({ ...f, msg: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition resize-none"
                />
              </label>
              {err && <div className="text-sm font-semibold text-red-600 flex items-center gap-1.5"><AlertTriangle size={14} /> {err}</div>}
              <StarBorder
                as="button"
                className="w-full disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                color="#c4b5fd"
                speed="5s"
                innerClassName="bg-gradient-to-b from-violet-600 to-violet-800 border border-violet-500/40 text-white text-sm font-bold py-3 px-6"
                onClick={submit}
                disabled={busy}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {busy ? "Sending…" : <>Send message <Send size={15} /></>}
                </span>
              </StarBorder>
            </div>
          )}
        </Card>
        </AnimatedContent>

        <AnimatedContent distance={48} duration={0.7} ease="power3.out" threshold={0.15} delay={0.12}>
        <div className="space-y-5">
          <Card className="h-72 relative overflow-hidden map-grid bg-violet-50">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <MapPin size={38} className="text-violet-600 drop-shadow-lg animate-bounce" />
                <span className="absolute left-1/2 -translate-x-1/2 top-9 w-8 h-2 rounded-full bg-violet-600/20" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto">
              <Card className="px-4 py-3 shadow-lg">
                <div className="text-sm font-extrabold text-slate-900">GenCopilot HQ</div>
                <div className="text-xs text-slate-500 mt-0.5">4th Floor, Innov8 Connaught Place, New Delhi 110001</div>
              </Card>
            </div>
            <Badge tone="blue" className="absolute top-4 right-4 bg-white">Interactive map</Badge>
          </Card>
          <Card className="p-6 space-y-4">
            <a href="mailto:gencopilotfounder@gmail.com" className="flex items-center gap-3 text-sm group">
              <span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><Mail size={16} /></span>
              <span className="font-semibold text-slate-700 group-hover:text-violet-700 transition break-all">gencopilotfounder@gmail.com</span>
            </a>
            <a href="tel:+918383049373" className="flex items-center gap-3 text-sm group">
              <span className="w-9 h-9 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0"><Phone size={16} /></span>
              <span className="font-semibold text-slate-700 group-hover:text-fuchsia-700 transition">+91 83830 49373 · Mon–Fri, 10:00–18:00 IST</span>
            </a>
            <div className="pt-2 border-t border-gray-100 flex gap-2.5">
              {socials.map((Icon, i) => (
                <Magnet key={i} padding={28} magnetStrength={4} disabled={reducedMotion}>
                  <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-slate-500 hover:bg-violet-600 hover:text-white hover:border-violet-600 hover:-translate-y-1 transition-all duration-200" aria-label="Social">
                    <Icon size={17} />
                  </button>
                </Magnet>
              ))}
            </div>
          </Card>
        </div>
        </AnimatedContent>
      </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ public: auth -
// Shape check only. Whether the address actually EXISTS is proven by the
// verification link, not by this pattern.
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

// ---- signup buddy ---------------------------------------------------------
// A small guide beside the signup form that reacts to what's being typed.
// Everything is derived locally from the field values — no network call, so it
// responds instantly and works offline.

// Deterministic pick so a given name always gets the same compliment (it would
// feel broken if the line reshuffled on every keystroke).
function hashPick(seed, arr) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

const NAME_COMPLIMENTS = [
  (n) => `${n} — that's a great name.`,
  (n) => `Nice to meet you, ${n}.`,
  (n) => `${n}. Strong founder energy already.`,
  (n) => `Love it, ${n}. Suits a builder.`,
  (n) => `${n} — that one's got a ring to it.`,
];

const ROLE_LINES = {
  Founder: "A founder. That's the hardest job on the org chart — let's make it lighter.",
  "Team Member": "Team member — the people who actually ship. Welcome aboard.",
  Admin: "Admin access it is. You'll be the one keeping everyone honest.",
};

function buddyScript({ mode, name, email, pw, role, err, busy, verifySent }) {
  if (verifySent) return { text: "Check your inbox and click the link — I'll be right here when you're back.", tone: "cheer" };
  if (err) return { text: "Hmm, that didn't go through. Have a look at the note above and try again.", tone: "worry" };
  if (busy) return { text: "Setting things up for you…", tone: "think" };
  if (mode === "reset") return { text: "Happens to everyone. Pop your email in and I'll send a reset link.", tone: "calm" };
  if (mode === "login") return { text: "Welcome back. Let's get you into the cockpit.", tone: "calm" };

  const first = name.trim().split(/\s+/)[0];
  if (!first) return { text: "Hey! I'm Pilot. What should I call you?", tone: "wave" };

  const pretty = first.charAt(0).toUpperCase() + first.slice(1);
  if (!email.trim()) return { text: hashPick(pretty.toLowerCase(), NAME_COMPLIMENTS)(pretty), tone: "cheer" };
  if (!EMAIL_RE.test(email.trim())) return { text: `Almost, ${pretty} — that address is missing something.`, tone: "worry" };
  if (pw.length === 0) return { text: "Email looks good. Now pick a password — six characters minimum.", tone: "calm" };
  if (pw.length < 6) return { text: `${6 - pw.length} more character${6 - pw.length === 1 ? "" : "s"} and you're there.`, tone: "think" };
  if (pw.length >= 12) return { text: "That's a seriously solid password. I approve.", tone: "cheer" };
  if (role) return { text: ROLE_LINES[role] || "Ready when you are.", tone: "calm" };
  return { text: "All set — hit the button and let's go.", tone: "cheer" };
}

const BUDDY_FACES = { wave: "◕‿◕", cheer: "◕ᴗ◕", calm: "◕‿◕", think: "◕_◕", worry: "◕︵◕" };

function SignupBuddy({ state }) {
  const line = buddyScript(state);
  const reduced = usePrefersReducedMotion();
  return (
    <div className="flex items-start gap-3 max-w-sm" aria-live="polite">
      <span
        className={"gc-buddy-orb w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-[13px] font-bold text-white select-none " + (reduced ? "" : "")}
        style={{ background: "linear-gradient(140deg,#7c3aed,#d946ef)", letterSpacing: "-.05em" }}
        aria-hidden="true"
      >
        {BUDDY_FACES[line.tone] || BUDDY_FACES.calm}
      </span>
      <div key={line.text} className="gc-buddy-bubble bg-white/10 border border-white/15 px-4 py-3">
        <div className="text-[13px] leading-relaxed text-slate-100">{line.text}</div>
        <div className="flex gap-1 mt-1.5" aria-hidden="true">
          {[0, 1, 2].map((d) => (
            <span key={d} className="gc-buddy-dot w-1 h-1 rounded-full bg-white/50" style={{ animationDelay: d * 0.16 + "s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- work buddy -----------------------------------------------------------
// Pilot again, on the far side of the login form.
//
// The signup buddy reacts to a form being filled in. This one reacts to work
// being done: every write that actually reached Firestore (through the
// buddyBus seam in celebrate), every module you move into, and the rhythm of
// the two together. Same rules as its sibling — every line is derived locally
// from something that already happened, so it answers instantly, costs nothing
// per line, and is still there when the network isn't.
//
// Restraint matters more here than on the auth page. A companion that talks
// during a form you leave in thirty seconds is charming; the same companion
// beside a working day is a colleague who won't shut up. So it speaks only for
// things that were earned, holds a quiet window between ambient lines,
// retires each line on its own, and can be muted for good in one click.
const WB_QUIET_MS = 25000;     // minimum gap between ambient (module) lines
const WB_HOLD_MS = 6500;       // how long a line stays up before retiring itself
const WB_AWAY_MS = 5 * 60000;  // away longer than this and coming back is worth a word

// What each kind of save is actually worth. Keyed by the LOG_LABELS string
// celebrate() already broadcasts, so the praise names the thing that landed
// instead of saying "nice job" at everything identically.
const WB_PRAISE = {
  "Client added": "A client on the books. That's the number that argues back.",
  "Lead added": "Another one in the pipe. Pipeline is a habit, not a lucky month.",
  "Investor added": "Logged before you need them — that's how a warm intro stays warm.",
  "Task added": "Out of your head and onto the board. Good instinct.",
  "Meeting logged": "Written up while it's still fresh. That's the bit everyone skips.",
  "Feedback logged": "Straight from a customer. Highest-quality data you own.",
  "Automation logged": "An hour bought back, permanently. That compounds.",
};

// Said on the way into a module: part orientation, part credit for opening the
// thing most people avoid.
const WB_MODULE = {
  overview: "The whole picture. Good place to think from.",
  tasks: "Delegation is a founder skill, not an admin chore.",
  meetings: "Agendas beat vibes. This is you buying back everyone's afternoon.",
  team: "Your people. The org chart is a product too.",
  pmf: "Back on product–market fit. The ones who win are the ones who keep asking.",
  feedback: "Reading what customers actually said — braver than reading a dashboard.",
  leads: "Pipeline work. This is what pays for everything else.",
  churn: "Opening the churn number takes a bit of nerve. Respect.",
  clients: "The people who already said yes. Worth the attention.",
  runway: "Checking runway on purpose rather than in a panic. Right way round.",
  unit: "Unit economics. Unglamorous, and the thing that decides it.",
  investors: "Warm list beats cold deck, every single time.",
  compliance: "Boring right up until it isn't. Good on you for staying ahead of it.",
  automation: "Every hour you automate here, you get back forever.",
  company: "Keeping the numbers current — everything downstream leans on this.",
  interview: "Teaching me about the company. Every answer I give gets sharper for it.",
  news: "Reading the market. Cheapest edge there is.",
  markets: "Knowing the landscape before the board asks about it.",
  talent: "Hiring is the highest-leverage thing on your desk today.",
  community: "Showing up for the people around the product.",
};

// Fallbacks for a save with no specific line (Btn's own celebrate strings land
// here). Picked by hash, not at random, so the same event keeps the same words.
const WB_GENERIC = [
  "Logged. Small, but they all count.",
  "That's on the record now. Good.",
  "Noted — your future self just got an easier week.",
  "Done properly. I like that.",
];

// Milestones interrupt the per-item praise: the tenth save of a session is
// about the session, not about the tenth item.
function wbWorkLine(label, n) {
  if (n > 0 && n % 10 === 0) return `That's ${n} logged in one sitting. This is what a well-run company looks like from the inside.`;
  if (n === 5) return "Five in one go. Most founders never keep score this honestly.";
  if (n === 3) return "Three in a row — there's a rhythm here. I'd stay in it.";
  if (n === 1) return WB_PRAISE[label] || "First one on the board. Starting is the expensive part.";
  return WB_PRAISE[label] || hashPick(label + n, WB_GENERIC);
}

function wbGreeting(name) {
  const h = new Date().getHours();
  const part = h < 5 || h >= 22 ? "Late one" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `${name ? `${part}, ${name}.` : `${part}.`} I'll be down here keeping score while you work.`;
}

function wbOnDemand(n) {
  if (n === 0) return "Nothing logged yet. Pick the smallest thing on your list and put it on the board — that's the whole trick.";
  if (n < 3) return `${n} logged so far. That's a start, and the start is the expensive part.`;
  if (n < 6) return `${n} logged today. You're already past where most days end.`;
  return `${n} logged. Genuinely — that is a good day's work.`;
}

function WorkBuddy({ module, user }) {
  const [line, setLine] = useState(null);
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem("gc.pilotMuted") === "1"; } catch { return false; }
  });

  const streak = useRef(0);      // real saves this session — the thing being praised
  const lastAt = useRef(0);      // when Pilot last spoke, for the quiet window
  const modRef = useRef(module?.id);
  // say() is stable across renders (the bus subscription depends on it), so
  // mute is mirrored into a ref rather than read from the captured state.
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // The single door every line goes through, so mute, the quiet window and the
  // retire timer can't be forgotten at one call site. `force` is for things the
  // founder earned — a save is always worth a word, a module switch isn't.
  const say = React.useCallback((text, { force = false, tone = "cheer" } = {}) => {
    if (!text || mutedRef.current) return;
    const now = Date.now();
    if (!force && now - lastAt.current < WB_QUIET_MS) return;
    lastAt.current = now;
    setLine({ text, tone, at: now, n: streak.current });
  }, []);

  // Each line retires itself. Keyed on `at` so a new line restarts the clock
  // instead of inheriting the previous one's remaining time.
  useEffect(() => {
    if (!line) return;
    const t = setTimeout(() => setLine((cur) => (cur && cur.at === line.at ? null : cur)), WB_HOLD_MS);
    return () => clearTimeout(t);
  }, [line]);

  // Real work landing. buddyBus.on returns its own unsubscribe.
  useEffect(() => buddyBus.on((ev) => {
    if (ev.kind !== "log") return;
    streak.current += 1;
    say(wbWorkLine(ev.label, streak.current), { force: true });
  }), [say]);

  // Moving between modules. Ambient, so it obeys the quiet window; the initial
  // module is seeded into modRef above so arriving doesn't count as a switch.
  useEffect(() => {
    const id = module?.id;
    if (!id || id === modRef.current) return;
    modRef.current = id;
    say(WB_MODULE[id], { tone: "calm" });
  }, [module?.id, say]);

  // Opening hello, once, after the dashboard has settled.
  //
  // The name is deliberately a dependency: `user` boots as the placeholder
  // "Founder" and is replaced when the Firestore profile resolves, so the
  // pending timer is restarted to greet with the real name. The ref is what
  // keeps that from becoming two hellos — once it has actually been said, a
  // later-arriving name doesn't re-open the conversation.
  const greeted = useRef(false);
  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "";
  useEffect(() => {
    if (greeted.current) return;
    const t = setTimeout(() => {
      greeted.current = true;
      say(wbGreeting(firstName), { force: true, tone: "wave" });
    }, 2200);
    return () => clearTimeout(t);
  }, [firstName, say]);

  // Back after a break. Only counts as a return if the tab was genuinely away.
  useEffect(() => {
    let leftAt = 0;
    const onVis = () => {
      if (document.hidden) { leftAt = Date.now(); return; }
      if (!leftAt || Date.now() - leftAt < WB_AWAY_MS) return;
      leftAt = 0;
      say(
        streak.current
          ? `Welcome back. ${streak.current} logged before you stepped away — pick it straight up.`
          : "Welcome back. Nothing's moved without you.",
        { force: true, tone: "wave" },
      );
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [say]);

  const setMute = (v) => {
    setMuted(v);
    mutedRef.current = v;
    try { localStorage.setItem("gc.pilotMuted", v ? "1" : "0"); } catch { /* private mode */ }
    if (v) setLine(null);
  };

  const onOrb = () => {
    // setMute writes mutedRef synchronously, so the line below clears the gate
    // it just opened and the unmute has something to show for itself.
    if (muted) { setMute(false); say("Back. I'll keep it to the things you've earned.", { force: true, tone: "wave" }); return; }
    if (line) { setLine(null); return; }
    say(wbOnDemand(streak.current), { force: true });
  };

  return (
    <div className="gc-wb" role="status" aria-live="polite">
      <button
        type="button"
        className="gc-wb-orb"
        data-muted={muted ? "1" : "0"}
        onClick={onOrb}
        aria-label={muted ? "Unmute Pilot" : line ? "Dismiss Pilot" : "Ask Pilot how the day is going"}
      >
        <span aria-hidden="true">{muted ? BUDDY_FACES.think : BUDDY_FACES[line?.tone] || BUDDY_FACES.calm}</span>
      </button>

      {!muted && line && (
        <div className="gc-wb-say" key={line.at}>
          <button type="button" className="gc-wb-x" onClick={() => setLine(null)} aria-label="Dismiss message">✕</button>
          <div className="gc-wb-text">{line.text}</div>
          <div className="gc-wb-foot">
            <span>{line.n > 0 ? `${line.n} logged` : "Pilot"}</span>
            <button type="button" className="gc-wb-mute" onClick={() => setMute(true)}>Mute</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuthPage({ mode, setMode, onLogin, onGuest, goHome }) {
  const reducedMotion = usePrefersReducedMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState("Founder");
  const [err, setErr] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [verifySent, setVerifySent] = useState(false);
  const [legal, setLegal] = useState(null);
  const [busy, setBusy] = useState(false);

  async function doLogin() {
    if (!EMAIL_RE.test(email.trim())) return setErr("Enter a valid email to continue.");
    if (pw.length < 6) return setErr("Password needs at least 6 characters.");
    setErr("");
    setBusy(true);
    try {
      const fb = await import("./firebase.js");
      const u = mode === "signup"
        ? await fb.signupWithEmail(email.trim(), pw, name || email.split("@")[0], role)
        : await fb.loginWithEmail(email.trim(), pw);
      // Signup no longer signs in: it sends a verification link and returns a
      // marker, and the account only works after the link is clicked.
      if (u && u.verificationSent) {
        setVerifySent(true);
        setBusy(false);
        return;
      }
      // App's onAuthChange fills in the profile but deliberately never routes
      // (a returning session shouldn't yank a visitor off the marketing site),
      // so entering the dashboard has to be driven from here. Stay `busy` on
      // the way out: this unmounts, and it blocks a double submit until then.
      onLogin(u);
      return;
    } catch (e) {
      const msg = e?.code === "auth/user-not-found" ? "No account with that email. Sign up instead?"
        : e?.code === "auth/wrong-password" ? "Wrong password. Try again or reset it."
        : e?.code === "auth/invalid-credential" ? "Email or password is incorrect. If you signed up with Google, use “Continue with Google” below — that account has no password."
        : e?.code === "auth/email-not-verified" ? "That email isn't verified yet. We've just sent you a fresh verification link — click it, then log in."
        : e?.code === "auth/too-many-requests" ? "Too many attempts. Wait a minute, then try again — or reset your password."
        : e?.code === "auth/operation-not-allowed" ? "Email/password sign-in isn't enabled. In the Firebase console turn on Authentication → Sign-in method → Email/Password."
        : e?.code === "auth/email-already-in-use" ? "Email already registered. Log in instead?"
        : e?.code === "auth/weak-password" ? "Password too weak — use at least 6 characters."
        : e?.message || "Something went wrong. Try again.";
      setErr(msg);
    }
    setBusy(false);
  }
  async function google() {
    setBusy(true);
    setErr("");
    try {
      const fb = await import("./firebase.js");
      const u = await fb.loginWithGoogle();
      onLogin(u); // see doLogin: routing is this page's job, not onAuthChange's
      return;
    } catch (e) {
      const msg = e?.code === "auth/unauthorized-domain"
        ? "This domain isn't authorized in Firebase. Add it under Authentication → Settings → Authorized domains."
        : e?.code === "auth/popup-blocked"
        ? "Popup was blocked. Allow popups for this site and try again."
        : e?.code === "auth/popup-closed-by-user"
        ? "Sign-in was cancelled."
        : e?.code === "auth/operation-not-allowed"
        ? "Google sign-in isn't enabled. Turn it on in Firebase → Authentication → Sign-in method."
        : e?.message || "Google sign-in failed.";
      setErr(msg);
    }
    setBusy(false);
  }
  async function doReset() {
    if (!email.trim()) return setErr("Enter your email first.");
    if (!EMAIL_RE.test(email.trim())) return setErr("That email doesn't look right — check it and try again.");
    setErr("");
    setBusy(true);
    try {
      const fb = await import("./firebase.js");
      await fb.resetPassword(email.trim());
    } catch (e) {
      // "No such user" is swallowed on purpose: confirming which addresses are
      // registered would leak the user list. Real faults (provider disabled,
      // rate limit, network) must NOT be swallowed — the old code reported
      // "check your inbox" even when nothing had been sent.
      const benign = e?.code === "auth/user-not-found" || e?.code === "auth/invalid-email";
      if (!benign) {
        setErr(
          e?.code === "auth/too-many-requests" ? "Too many attempts. Wait a minute and try again."
          : e?.code === "auth/operation-not-allowed" ? "Password reset isn't enabled for this project. Turn on Authentication → Sign-in method → Email/Password in the Firebase console."
          : e?.code === "auth/network-request-failed" ? "Network error — check your connection and try again."
          : e?.message || "Couldn't send the reset link. Try again."
        );
        setBusy(false);
        return;
      }
    }
    setResetSent(true);
    setBusy(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-100">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-slate-900 text-white flex-col justify-between p-12">
        {/* volumetric light rays pouring from the top in brand violet */}
        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none opacity-90" aria-hidden="true">
            <LightRays raysOrigin="top-center" raysColor="#a78bfa" raysSpeed={1.2} lightSpread={1.3} rayLength={2.4} saturation={1.2} followMouse mouseInfluence={0.08} className="w-full h-full" />
          </div>
        )}
        <div className="blob bg-[#007cf0] w-96 h-96 -top-20 -left-20" style={{ animation: "floatY 10s ease-in-out infinite" }} />
        <div className="blob bg-[#ff0080] w-72 h-72 bottom-10 right-0" style={{ animation: "floatY2 12s ease-in-out infinite" }} />
        <div className="blob bg-[#50e3c2] w-64 h-64 top-1/3 right-1/4" style={{ animation: "floatY 14s ease-in-out infinite" }} />
        <button onClick={goHome} className="relative w-fit"><Logo light /></button>
        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-snug max-w-md">One login. Ten modules. Zero heroic spreadsheets.</h2>
          <ul className="mt-6 space-y-3">
            {["Live KPI, churn & runway intelligence", "AI copilot in every module", "Role-based access for your whole team"].map((t) => (
              <li key={t} className="flex items-center gap-3 text-sm text-slate-300"><span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Check size={13} /></span>{t}</li>
            ))}
          </ul>
          {/* Pilot reacts to whatever is being typed on the right */}
          <div className="mt-9">
            <SignupBuddy state={{ mode, name, email, pw, role, err, busy, verifySent }} />
          </div>
        </div>
        <Card className="relative bg-white/10 border-white/15 backdrop-blur p-5 max-w-sm" style={{ animation: "floatY 9s ease-in-out infinite" }}>
          <p className="text-sm text-slate-200 leading-relaxed">“We killed nine tools the week we onboarded. Our Monday metrics meeting went from 90 minutes to 15.”</p>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center text-xs font-bold">SK</span>
            <div><div className="text-xs font-bold">Sana Kapoor</div><div className="text-[11px] text-slate-400">CEO, Northwind Labs</div></div>
          </div>
        </Card>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-md p-8 anim-fadeUp">
          <button onClick={goHome} className="lg:hidden mb-6"><Logo /></button>

          {mode !== "reset" && (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 mb-7">
              {["login", "signup"].map((m) => (
                <button key={m} onClick={() => { setMode(m); setErr(""); }} className={"py-2 rounded-lg text-sm font-bold transition " + (mode === m ? "bg-white shadow text-violet-700" : "text-slate-500 hover:text-slate-800")}>
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>
          )}

          {verifySent ? (
            <div className="text-center py-6">
              <span className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto"><Mail size={24} /></span>
              <h3 className="text-xl font-extrabold mt-4 text-slate-900">Verify your email</h3>
              <p className="text-sm text-slate-500 mt-2">
                We sent a verification link to <span className="font-bold text-slate-700">{email}</span>.
                Click it, then log in. No email? Check spam — or the address may not exist.
              </p>
              <Btn className="mt-6" onClick={() => { setVerifySent(false); setMode("login"); setErr(""); }}>Go to log in <ArrowRight size={15} /></Btn>
            </div>
          ) : mode === "reset" ? (
            resetSent ? (
              <div className="text-center py-6">
                <span className="w-14 h-14 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto"><Mail size={24} /></span>
                <h3 className="text-xl font-extrabold mt-4 text-slate-900">Check your inbox</h3>
                <p className="text-sm text-slate-500 mt-2">If an account exists for {email || "that address"}, a reset link is on its way.</p>
                <Btn variant="ghost" className="mt-6" onClick={() => { setMode("login"); setResetSent(false); }}>Back to log in</Btn>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-extrabold text-slate-900">Reset your password</h3>
                <p className="text-sm text-slate-500">Enter the email you signed up with and we'll send a reset link.</p>
                <Field label="Email" placeholder="you@startup.com" value={email} onChange={(e) => { setEmail(e.target.value); if (err) setErr(""); }} onKeyDown={(e) => e.key === "Enter" && doReset()} />
                {err && <div className="text-sm font-semibold text-red-600 flex items-start gap-1.5" role="alert"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> {err}</div>}
                <Btn className="w-full py-3" onClick={doReset} disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Btn>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Signed up with Google? You don't have a password — use “Continue with Google” on the log-in screen.
                </p>
                <button onClick={() => { setMode("login"); setErr(""); }} className="w-full text-sm font-semibold text-slate-500 hover:text-violet-700 transition">← Back to log in</button>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <h3 className="text-2xl font-extrabold text-slate-900">
                <BlurText key={mode} text={mode === "login" ? "Welcome back" : "Create your free account"} animateBy="words" delay={90} stepDuration={0.28} />
              </h3>
              {mode === "signup" && <Field label="Full name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />}
              <Field label="Email" placeholder="you@startup.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doLogin()} />
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <div className="relative mt-1.5">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doLogin()}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-11 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
                  />
                  <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Toggle password visibility">
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              {mode === "signup" && (
                <div>
                  <span className="text-sm font-semibold text-slate-700">Your role</span>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {["Founder", "Team Member", "Admin"].map((r) => (
                      <button key={r} onClick={() => setRole(r)} className={"rounded-xl border px-2 py-2.5 text-xs font-bold transition " + (role === r ? "border-violet-600 bg-violet-50 text-violet-700" : "border-gray-300 text-slate-500 hover:border-violet-300")}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex justify-end -mt-1">
                  <button onClick={() => { setMode("reset"); setErr(""); setResetSent(false); }} className="text-xs font-bold text-violet-600 hover:text-violet-800 transition">Forgot password?</button>
                </div>
              )}

              {err && <div className="text-sm font-semibold text-red-600 flex items-center gap-1.5"><AlertTriangle size={14} /> {err}</div>}

              <StarBorder
                as="button"
                className="w-full disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                color="#c4b5fd"
                speed="5s"
                innerClassName="bg-gradient-to-b from-violet-600 to-violet-800 border border-violet-500/40 text-white text-sm font-bold py-3 px-6"
                onClick={doLogin}
                disabled={busy}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {busy ? "Just a moment…" : (mode === "login" ? "Log in" : "Create free account")}
                  {!busy && <ArrowRight size={15} />}
                </span>
              </StarBorder>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                By continuing you agree to our{" "}
                <button onClick={() => setLegal("Terms")} className="font-bold text-violet-600 hover:text-violet-800 underline underline-offset-2">Terms</button>
                {" "}and{" "}
                <button onClick={() => setLegal("Privacy")} className="font-bold text-violet-600 hover:text-violet-800 underline underline-offset-2">Privacy Policy</button>.
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold"><span className="h-px bg-gray-200 flex-1" />or<span className="h-px bg-gray-200 flex-1" /></div>

              <Btn variant="ghost" className="w-full py-3" onClick={google} disabled={busy}><GoogleG /> Continue with Google</Btn>

              {onGuest && (
                <button onClick={onGuest} className="w-full text-center text-xs font-bold text-slate-400 hover:text-violet-700 transition pt-1">
                  Continue as guest instead →
                </button>
              )}
            </div>
          )}
        </Card>
      </div>
      <LegalModal k={legal} onClose={() => setLegal(null)} />
    </div>
  );
}

// --------------------------------------------------------------- app shell -
function SidebarNav({ active, setActive, user, onLogout, onNavigate }) {
  let lastTrack = "";
  return (
    <nav className="flex flex-col h-full">
      <div className="px-5 h-16 flex items-center border-b border-gray-200 shrink-0"><Logo /></div>
      <div className="flex-1 overflow-y-auto scroll-thin px-3 py-4">
        {MODULES.map((m) => {
          const showTrack = m.track !== lastTrack;
          lastTrack = m.track;
          const locked = m.finance && user.role === "Team Member";
          const isActive = active === m.id;
          return (
            <React.Fragment key={m.id}>
              {showTrack && <div className="px-3 pt-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{m.track}</div>}
              <button
                onClick={() => { setActive(m.id); if (onNavigate) onNavigate(); }}
                className={"w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition mb-0.5 text-left " + (isActive ? "bg-violet-50 text-violet-700 border border-violet-100 lp-nav-active" : "text-slate-600 hover:bg-gray-100 border border-transparent")}
              >
                <m.icon size={17} className={isActive ? "text-violet-600" : "text-slate-400"} />
                <span className="flex-1 truncate">{m.name}</span>
                {locked && <Lock size={13} className="text-slate-300" />}
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div className="p-3 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xs font-extrabold">
            {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-slate-800 truncate">{user.name}</div>
            <div className="text-[11px] font-semibold text-slate-400">{user.role}</div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition" aria-label="Sign out"><LogOut size={16} /></button>
        </div>
      </div>
    </nav>
  );
}

function Topbar({ user, setUser, setActive, onLogout, openMobileNav, company }) {
  const [q, setQ] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [read, setRead] = useState(false);
  const [dismissed, setDismissed] = useState([]);
  const [fsNotifs, setFsNotifs] = useState([]);
  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        const uid = fb.auth?.currentUser?.uid;
        if (uid) unsub = fb.onUserNotifications(uid, setFsNotifs, 15);
      } catch {}
    })();
    return () => unsub && unsub();
  }, []);
  const notifs = React.useMemo(() => {
    const live = fsNotifs.filter((n) => !n.read && !dismissed.includes(n.id)).map((n) => ({ id: n.id, tone: n.type === "dm" ? "blue" : "emerald", text: n.text, time: "new", to: n.to, fs: true }));
    const derived = buildNotifs(company || {}).filter((n) => !dismissed.includes(n.id));
    return [...live, ...derived];
  }, [company, dismissed, fsNotifs]);
  const setNotifs = (fn) => {
    const next = typeof fn === "function" ? fn(notifs) : fn;
    const gone = notifs.filter((n) => !next.find((x) => x.id === n.id));
    if (gone.length) {
      setDismissed((d) => [...d, ...gone.map((n) => n.id)]);
      const fsIds = gone.filter((n) => n.fs).map((n) => n.id);
      if (fsIds.length) (async () => { try { const fb = await import("./firebase.js"); const uid = fb.auth?.currentUser?.uid; if (uid) fb.markNotifsRead(uid, fsIds); } catch {} })();
    }
  };
  const [syncedAt, setSyncedAt] = useState(0); // seconds since last sync
  const { theme, setTheme, openCmd } = useTheme();
  const results = q.trim() ? MODULES.filter((m) => (m.name + " " + m.blurb).toLowerCase().includes(q.toLowerCase())) : [];
  const anyOpen = notifOpen || profOpen || themeOpen;
  const toneDot = { red: "bg-red-500", amber: "bg-amber-500", emerald: "bg-emerald-500", blue: "bg-violet-500" };

  // Data-freshness ticker — simulates a periodic auto-sync cycle
  useEffect(() => {
    const t = setInterval(() => setSyncedAt((s) => (s >= 90 ? 0 : s + 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const syncLabel = syncedAt < 3 ? "Just now" : syncedAt + "s ago";

  return (
    <div className="sticky top-0 z-30 lp-glass border-b border-gray-200">
      {anyOpen && <div className="fixed inset-0 z-30" onClick={() => { setNotifOpen(false); setProfOpen(false); setThemeOpen(false); }} />}
      <div className="h-16 px-4 md:px-6 flex items-center gap-3 relative z-40">
        <button className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100" onClick={openMobileNav} aria-label="Open navigation"><Menu size={20} /></button>

        {/* Search — clicking opens Cmd+K palette */}
        <button
          onClick={() => openCmd && openCmd()}
          className="flex-1 max-w-md flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-100 pl-3.5 pr-2 py-2 text-sm text-slate-500 hover:bg-white hover:border-violet-300 transition text-left"
        >
          <Search size={16} className="text-slate-400 shrink-0" />
          <span className="flex-1 truncate">Search or run a command…</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-white border border-gray-200 rounded px-1.5 py-0.5">⌘K</kbd>
        </button>

        <div className="flex-1" />

        {/* Data freshness pill */}
        <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-xl bg-gray-100 border border-gray-200" title="Data auto-syncs from your connected sources">
          <span className="relative flex w-2 h-2">
            <span className={"absolute inset-0 rounded-full " + (syncedAt < 3 ? "bg-emerald-500 pulse-dot" : "bg-emerald-500")} />
          </span>
          <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Synced <span className="text-slate-800">{syncLabel}</span></span>
        </div>

        {/* Theme */}
        <div className="relative">
          <button
            onClick={() => { setThemeOpen(!themeOpen); setNotifOpen(false); setProfOpen(false); }}
            className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-100 transition"
            aria-label="Theme"
          >
            {theme === "dark" ? <Sun size={18} className="text-slate-600" /> : <Moon size={18} className="text-slate-600" />}
          </button>
          {themeOpen && (
            <Card className="absolute right-0 top-12 w-56 shadow-xl overflow-hidden anim-fadeUp z-40 lp-glass">
              <div className="px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-extrabold text-slate-900">Appearance</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Light or dark</p>
              </div>
              <div className="px-4 py-3">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">Theme</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme("light")}
                    className={"flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition " + (theme === "light" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-slate-600 hover:border-violet-300")}
                  >
                    <Sun size={14} /> Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={"flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition " + (theme === "dark" ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-slate-600 hover:border-violet-300")}
                  >
                    <Moon size={14} /> Dark
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setProfOpen(false); setThemeOpen(false); }} className="relative p-2.5 rounded-xl hover:bg-gray-100 transition" aria-label="Notifications">
            <Bell size={19} className="text-slate-600" />
            {notifs.length > 0 && !read && <span className="absolute top-2 right-2 min-w-[16px] h-[16px] rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center px-1">{notifs.length}</span>}
          </button>
          {notifOpen && (
            <Card className="absolute right-0 top-12 w-80 shadow-xl overflow-hidden anim-fadeUp lp-glass">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-extrabold text-slate-900">Notifications {notifs.length > 0 && <span className="text-slate-400 font-bold">· {notifs.length}</span>}</span>
                {notifs.length > 0 && <button onClick={() => { setRead(true); setNotifs([]); }} className="text-xs font-bold text-violet-600 hover:text-violet-800">Clear all</button>}
              </div>
              <div className="max-h-96 overflow-y-auto scroll-thin">
                {notifs.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <CheckCircle2 size={28} className="text-emerald-500 mx-auto mb-2" />
                    <div className="text-sm font-bold text-slate-700">You're all caught up</div>
                    <div className="text-xs text-slate-400 mt-1">New alerts, feedback, and deals will appear here.</div>
                  </div>
                ) : notifs.map((n) => (
                  <div key={n.id} className="group flex items-start gap-2.5 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                    <span className={"mt-1.5 w-2 h-2 rounded-full shrink-0 " + toneDot[n.tone]} />
                    <button
                      onClick={() => { if (n.to) { setActive(n.to); setNotifOpen(false); } }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-sm text-slate-700 leading-snug group-hover:text-slate-900 transition">{n.text}</p>
                      <span className="text-[11px] font-semibold text-slate-400">{n.time}</span>
                    </button>
                    <button
                      onClick={() => setNotifs((ns) => ns.filter((x) => x.id !== n.id))}
                      className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 text-slate-400 transition"
                      aria-label="Dismiss"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          {/* Avatar opens My Profile; the chevron stays a separate target for the account menu. */}
          <div className="flex items-center rounded-xl hover:bg-gray-100 transition">
            <button
              onClick={() => { setActive("profile"); setProfOpen(false); setNotifOpen(false); setThemeOpen(false); }}
              className="flex items-center gap-2.5 pl-1.5 pr-1.5 py-1.5 rounded-l-xl"
              aria-label="Open my profile"
              title="Open my profile"
            >
              <span className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-extrabold">
                {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="hidden sm:block text-left">
                <span className="block text-sm font-bold text-slate-800 leading-tight">{user.name}</span>
                <span className="block text-[11px] font-semibold text-slate-400 leading-tight">{user.role}</span>
              </span>
            </button>
            <button
              onClick={() => { setProfOpen(!profOpen); setNotifOpen(false); setThemeOpen(false); }}
              className="pl-0.5 pr-2 py-2.5 rounded-r-xl"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={profOpen}
            >
              <ChevronDown size={15} className="text-slate-400" />
            </button>
          </div>
          {profOpen && (
            <Card className="absolute right-0 top-12 w-72 shadow-xl overflow-hidden anim-fadeUp lp-glass">
              <div className="px-4 py-3.5 border-b border-gray-100">
                <div className="text-sm font-extrabold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
              <button
                onClick={() => { setActive("profile"); setProfOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition border-b border-gray-100"
              >
                <User size={16} className="text-violet-600" /> My Profile
              </button>
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 mb-2">View as (role-based access demo)</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Founder", "Team Member", "Admin"].map((r) => (
                    <button key={r} onClick={() => setUser({ ...user, role: r })} className={"rounded-lg border px-1 py-1.5 text-[11px] font-bold transition " + (user.role === r ? "border-violet-600 bg-violet-50 text-violet-700" : "border-gray-200 text-slate-500 hover:border-violet-300")}>
                      {r === "Team Member" ? "Team" : r}
                    </button>
                  ))}
                </div>
              </div>
              {user.role === "Admin" && (
                <button className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition border-b border-gray-100">
                  <ShieldCheck size={16} className="text-emerald-600" /> Admin console <Badge tone="emerald" className="ml-auto">Admin</Badge>
                </button>
              )}
              <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition">
                <LogOut size={16} /> Sign out
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleShell({ module, children, noChat = false, companyLine }) {
  return (
    <div className="anim-fadeUp mo-page">
      <div className="mb-6">
        <Badge tone="emerald" className="mb-2">{module.track}</Badge>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
          <BlurText key={module.id} text={module.name} animateBy="words" delay={70} stepDuration={0.25} />
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl">{module.blurb}</p>
        {/* rule draws itself under the title on every module change */}
        <div key={module.id + "-rule"} className="mo-rule mo-rule-thick mt-4 max-w-xs" />
      </div>
      <AnimatedContent distance={26} duration={0.5} ease="power3.out" threshold={0.02}>
        {children}
      </AnimatedContent>
    </div>
  );
}

function companyLineFrom(c) {
  const runway = c.netBurn > 0 ? (c.cash / c.netBurn).toFixed(1) : "∞";
  const ltv = c.churn > 0 ? Math.round((c.arpu * (c.gm / 100)) / (c.churn / 100)) : 0;
  const hasNumbers = c.mrr > 0 || c.customers > 0 || c.cash > 0;
  let line = "Company: '" + (c.name || "Unnamed startup") + "'.";
  if (c.building) line += " What it does: " + c.building + ".";
  if (c.stage) line += " Stage: " + c.stage + ".";
  if (hasNumbers) {
    line += " Live snapshot — MRR $" + c.mrr.toFixed(1) + "k (+" + c.mrrGrowth +
      "% MoM), " + c.customers.toLocaleString() + " customers (+" + c.customerAdds + " this month), monthly churn " +
      c.churn + "%, net burn $" + c.netBurn + "k/mo, cash $" + c.cash + "k (~" + runway + " months runway), CAC $" +
      c.cac + ", ARPU $" + c.arpu + ", gross margin " + c.gm + "%, NPS " + c.nps + ", implied LTV $" + ltv + ".";
  } else {
    line += " The founder hasn't entered financial metrics yet — encourage them to fill Company Data or run the AI Interview, and never invent numbers for them.";
  }
  if (c.aiProfile) {
    line += " Deep company profile (from the founder's AI interview): " + c.aiProfile;
  }
  line += " These facts are the founder's own — treat them as ground truth and cite them when giving advice.";
  return line;
}

function LockedPanel({ module }) {
  return (
    <ModuleShell module={module} noChat>
      <Card className="max-w-lg mx-auto mt-10 p-10 text-center">
        <span className="w-16 h-16 rounded-2xl bg-white/5 text-zinc-400 flex items-center justify-center mx-auto"><Lock size={28} /></span>
        <h3 className="text-xl font-extrabold text-white mt-5">Founders &amp; Admins only</h3>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">Financial modules are restricted for Team Member accounts. Ask a Founder or Admin to grant access — or switch roles from the profile menu to preview this in the demo.</p>
        <Badge tone="slate" className="mt-5">Role-based access control</Badge>
      </Card>
    </ModuleShell>
  );
}

// -------------------------------------------------- module 1: overview -----
function ChartCard({ title, sub, children, right }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-white">{title}</h3>
          {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
        </div>
        {right}
      </div>
      {children}
    </Card>
  );
}

// ============================================================================
// Overview module — expanded dashboard
// Composed of: greeting bar, copilot insight strip, clickable KPI strip,
// growth engine (with expand-to-modal, prior-year, target line, brush),
// runway simulator (signature panel), cohort retention heatmap, PMF radar,
// channel acquisition with CAC ceiling, unit economics dual-axis, alert
// feed, top-accounts table, and the original kanban.
// ============================================================================

const OVERVIEW_TEAM = ["Pushkar", "Pranav", "Chaitanya", "Atharv"];
const OVERVIEW_GREET = OVERVIEW_TEAM[Math.floor(Math.random() * OVERVIEW_TEAM.length)];

function greetingFor(user) {
  const h = new Date().getHours();
  const salutation = h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 22 ? "Good evening" : "Late night";
  const first = (user && user.name ? user.name : OVERVIEW_GREET).split(" ")[0];
  return salutation + ", " + first;
}

// Extended 18-month series so the growth chart's brush + prior-year overlay
// have something meaningful to work with (MONTHS-the-global is only 8 months
// and other modules depend on that shape, so we build a local one here).
// Trailing 19-month series derived from the founder's REAL numbers.
// We back-compute history from current MRR + growth rate — every point is a
// mathematical function of the user's own inputs, not canned demo data.
function ovMonthsFrom(c) {
  if (!c || !(c.mrr > 0)) return [];
  const labels = ["Feb 25","Mar 25","Apr 25","May 25","Jun 25","Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25","Jan 26","Feb 26","Mar 26","Apr 26","May 26","Jun 26","Jul 26","Aug 26"];
  const n = labels.length;
  const g = 1 + Math.max(-0.5, Math.min(0.5, (c.mrrGrowth || 0) / 100));
  const churnRate = Math.max(0, (c.churn || 0) / 100);
  const usersNow = c.customers > 0 ? c.customers : Math.max(1, Math.round((c.mrr * 1000) / Math.max(c.arpu || 39, 1)));
  const userG = c.customerAdds > 0 && c.customers > 0 ? 1 + c.customerAdds / Math.max(c.customers - c.customerAdds, 1) : g;
  return labels.map((m, i) => {
    const back = n - 1 - i;
    const mrr = Math.max(0.1, c.mrr / Math.pow(g, back));
    const churned = Math.max(0, mrr * churnRate);
    const expansion = mrr * 0.05;
    const neu = Math.max(0, mrr * (g - 1) + churned - expansion);
    return {
      m,
      mrr: Math.round(mrr * 10) / 10,
      neu: Math.round(neu * 10) / 10,
      expansion: Math.round(expansion * 10) / 10,
      churned: Math.round(churned * 10) / 10,
      prior: Math.round((mrr / Math.pow(g, 12)) * 10) / 10,
      users: Math.max(1, Math.round(usersNow / Math.pow(userG, back))),
      cac: Math.max(1, Math.round(c.cac || 0)),
      ltv: c.churn > 0 ? Math.round(((c.arpu || 0) * ((c.gm || 70) / 100)) / (c.churn / 100)) : 0,
    };
  });
}

const OV_CHANNELS = [
  { name: "Content",    spend: 12,  leads: 88, won: 14, cac: 86 },
  { name: "Referral",   spend: 4,   leads: 26, won: 9,  cac: 44 },
  { name: "Partner",    spend: 9,   leads: 21, won: 6,  cac: 150 },
  { name: "Outbound",   spend: 22,  leads: 41, won: 7,  cac: 314 },
  { name: "Paid search",spend: 18,  leads: 62, won: 5,  cac: 360 },
];

const OV_COHORTS = ["Nov 25","Dec 25","Jan 26","Feb 26","Mar 26","Apr 26","May 26","Jun 26"].map((c, i) => ({
  cohort: c,
  size: 60 + i * 9,
  cells: Array.from({ length: 8 - i }, (_, k) => Math.round(100 * Math.pow(0.93 + i * 0.006, k) - (k ? 3 : 0))),
}));

const OV_PMF = [
  { axis: "Retention",      score: 78, bench: 65 },
  { axis: "Activation",     score: 64, bench: 60 },
  { axis: "Referral",       score: 52, bench: 45 },
  { axis: "Willingness",    score: 81, bench: 62 },
  { axis: "Usage depth",    score: 69, bench: 58 },
  { axis: "Support load",   score: 44, bench: 55 },
];

const OV_ACCOUNTS = [
  { name: "Northwind Retail", arr: 42_000, health: 22, trend: -41, stage: "At risk",   seats: 180 },
  { name: "Corvus Logistics", arr: 36_500, health: 88, trend: 12,  stage: "Expanding", seats: 240 },
  { name: "Halcyon Health",   arr: 29_800, health: 71, trend: 4,   stage: "Stable",    seats: 96  },
  { name: "Ferrous Works",    arr: 24_100, health: 45, trend: -12, stage: "Watch",     seats: 128 },
  { name: "Meridian Bank",    arr: 21_500, health: 93, trend: 22,  stage: "Expanding", seats: 310 },
  { name: "Alder & Co",       arr: 17_200, health: 66, trend: -3,  stage: "Stable",    seats: 74  },
];

// Formatting helpers scoped to overview
const ovK = (n) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}k` : `$${n}`;

// ─── Sub-component: KPI card (clickable) ──────────────────────────────────
function OvKpi({ icon: Icon, label, value, delta, goal, goalLabel, spark, on, onClick, invert }) {
  const good = invert ? delta < 0 : delta > 0;
  const flat = Math.abs(delta) < 0.05;
  const deltaColor = flat ? "text-slate-500" : good ? "text-emerald-600" : "text-red-600";
  const deltaBg = flat ? "bg-slate-100" : good ? "bg-emerald-50" : "bg-red-50";

  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={"text-left rounded-2xl p-4 transition border " + (on
        ? "bg-white border-violet-500 shadow-md ring-2 ring-violet-100"
        : "bg-white border-gray-200 shadow-sm hover:border-violet-300 hover:shadow-md")}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          <Icon size={12} className={on ? "text-violet-600" : "text-slate-400"} />
          {label}
        </span>
        <span className={"inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10.5px] font-bold " + deltaBg + " " + deltaColor}>
          {!flat && (good ? <TrendingUp size={10} strokeWidth={2.6} /> : <TrendingDown size={10} strokeWidth={2.6} />)}
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <div className="font-bold text-slate-900 leading-tight" style={{ fontSize: 24, letterSpacing: "-.02em" }}>{value}</div>
      <div className="my-2 -mx-1" style={{ height: 32 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`ovspk-${label.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.34} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke="var(--brand)" strokeWidth={1.6} fill={`url(#ovspk-${label.replace(/\s+/g, "")})`} isAnimationActive={false} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, goal * 100)}%`, background: "var(--brand)" }} />
      </div>
      <div className="mt-1.5 text-[10.5px] text-slate-500">
        <span className="font-bold text-slate-700">{Math.round(goal * 100)}%</span> of {goalLabel}
      </div>
    </button>
  );
}

// ─── Sub-component: Growth chart (card + modal share this body) ───────────
const OV_SERIES = [
  { key: "mrr",       name: "MRR",          color: "var(--brand)",   kind: "line" },
  { key: "expansion", name: "Expansion",    color: "var(--brand-2)", kind: "bar"  },
  { key: "neu",       name: "New business", color: "var(--ok)",        kind: "bar"  },
  { key: "churned",   name: "Churn",        color: "var(--danger)",        kind: "bar"  },
];

function OvGrowthChart({ full = false, range, shape, setShape, on, setOn, compare, setCompare, target, setTarget, months = [] }) {
  const data = months.slice(-range);
  const targetLine = 120;
  const axisFmt = (v) => `$${v}k`;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3.5">
        <div className="inline-flex p-0.5 gap-0.5 bg-gray-100 rounded-lg border border-gray-200">
          {[["area", Activity, "Area"], ["line", Activity, "Line"], ["bar", BarChart3, "Bars"]].map(([k, Icon, lbl]) => (
            <button
              key={k}
              onClick={() => setShape(k)}
              className={"inline-flex items-center gap-1 px-2.5 h-7 rounded-md text-[11.5px] font-semibold transition " + (shape === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}
            >
              <Icon size={12} /> <span className="hidden md:inline">{lbl}</span>
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-gray-200" />

        {OV_SERIES.map((s) => (
          <button
            key={s.key}
            onClick={() => setOn({ ...on, [s.key]: !on[s.key] })}
            aria-pressed={on[s.key]}
            className={"inline-flex items-center gap-1.5 px-2 h-6 rounded-full text-[11.5px] font-semibold border transition " + (on[s.key]
              ? "bg-gray-100 text-slate-800 border-gray-200"
              : "text-slate-400 border-transparent opacity-60")}
          >
            <span className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
            {s.name}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setCompare(!compare)}
            className={"inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-[11.5px] font-semibold border transition " + (compare ? "bg-violet-50 text-violet-700 border-violet-200" : "border-gray-200 text-slate-500 hover:text-slate-800")}
            title="Overlay same window one year back"
          >
            <Copy size={12} /> <span className="hidden md:inline">Prior year</span>
          </button>
          <button
            onClick={() => setTarget(!target)}
            className={"inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-[11.5px] font-semibold border transition " + (target ? "bg-violet-50 text-violet-700 border-violet-200" : "border-gray-200 text-slate-500 hover:text-slate-800")}
            title="Show board MRR target"
          >
            <Target size={12} /> <span className="hidden md:inline">Target</span>
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={full ? 420 : 260}>
        <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: full ? 26 : 0, left: -14 }}>
          <defs>
            <linearGradient id="ov-mrr-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="var(--brand)"   stopOpacity={0.32} />
              <stop offset="60%" stopColor="var(--brand-2)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--brand-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} interval="preserveStartEnd" minTickGap={22} />
          <YAxis tick={{ fontSize: 11, fill: "var(--fg-muted)" }} tickFormatter={axisFmt} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "3 3" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
            formatter={(v) => `$${v}k`}
          />
          {target && (
            <ReferenceLine
              y={targetLine}
              stroke="var(--warn)"
              strokeDasharray="5 4"
              strokeWidth={1.4}
              label={{ value: "Board target $120k", position: "insideTopRight", fill: "var(--warn)", fontSize: 11, fontWeight: 600 }}
            />
          )}
          {on.neu &&       <Bar dataKey="neu"       name="New business" stackId="mv" fill="var(--ok)"         opacity={0.72} maxBarSize={26} />}
          {on.expansion && <Bar dataKey="expansion" name="Expansion"    stackId="mv" fill="var(--brand-2)"  opacity={0.72} radius={[3,3,0,0]} maxBarSize={26} />}
          {on.churned &&   <Bar dataKey="churned"   name="Churn"                     fill="var(--danger)"         opacity={0.6}  radius={[3,3,0,0]} maxBarSize={26} />}

          {on.mrr && shape === "area" && (
            <Area type="monotone" dataKey="mrr" name="MRR" stroke="var(--brand)" strokeWidth={2.4} fill="url(#ov-mrr-fill)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} />
          )}
          {on.mrr && shape === "line" && (
            <Line type="monotone" dataKey="mrr" name="MRR" stroke="var(--brand)" strokeWidth={2.4} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} />
          )}
          {on.mrr && shape === "bar" && (
            <Bar dataKey="mrr" name="MRR" fill="var(--brand)" radius={[4,4,0,0]} maxBarSize={22} />
          )}
          {compare && (
            <Line type="monotone" dataKey="prior" name="Prior year" stroke="var(--fg-muted)" strokeWidth={1.6} strokeDasharray="5 4" dot={false} />
          )}
          {full && <Brush dataKey="m" height={26} travellerWidth={9} stroke="var(--brand)" />}
        </ComposedChart>
      </ResponsiveContainer>

      {full && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          {[
            ["Compound monthly growth", "8.8%", "Trailing 12 months"],
            ["Quick ratio",              "3.4×", "(New + expansion) ÷ churn"],
            ["Gross revenue churn",      "1.9%", "Down from 3.2% a year ago"],
            ["Months to $120k",          "3.2",  "At current growth rate"],
          ].map(([l, v, s]) => (
            <div key={l} className="rounded-xl bg-gray-50 border border-gray-200 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">{l}</div>
              <div className="font-bold text-slate-900" style={{ fontSize: 20, letterSpacing: "-.02em" }}>{v}</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">{s}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function OvGrowthPanel({ range, months = [] }) {
  const [shape, setShape] = useState("area");
  const [on, setOn] = useState({ mrr: true, expansion: true, neu: true, churned: false });
  const [compare, setCompare] = useState(false);
  const [target, setTarget] = useState(true);
  const [big, setBig] = useState(false);
  const props = { range, shape, setShape, on, setOn, compare, setCompare, target, setTarget };

  return (
    <>
      <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
        <header className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Growth engine</div>
            <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>Recurring revenue and its moving parts</h3>
          </div>
          <div className="flex gap-2">
            <button className="p-2 rounded-lg border border-gray-200 text-slate-500 hover:border-violet-300 hover:text-slate-800 transition" title="Export CSV" aria-label="Export CSV">
              <Download size={14} />
            </button>
            <button
              onClick={() => setBig(true)}
              className="p-2 rounded-lg border border-gray-200 text-slate-500 hover:border-violet-300 hover:text-slate-800 transition"
              title="Expand"
              aria-label="Expand chart"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </header>
        <OvGrowthChart months={months} {...props} />
      </div>

      {big && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,.5)" }} onMouseDown={(e) => e.target === e.currentTarget && setBig(false)}>
          <div className="rounded-2xl bg-white border border-gray-200 p-5 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-auto">
            <header className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Growth engine — expanded</h3>
              <button onClick={() => setBig(false)} className="p-2 rounded-lg border border-gray-200 text-slate-500 hover:text-slate-800" aria-label="Close">
                <X size={15} />
              </button>
            </header>
            <OvGrowthChart months={months} {...props} full />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sub-component: Runway simulator ──────────────────────────────────────
function OvRunwaySim({ company }) {
  const [hires, setHires] = useState(4);
  const [growth, setGrowth] = useState(8.8);
  const [cut, setCut] = useState(0);

  const cash = company.cash * 1000; // convert $k → $
  const sim = React.useMemo(() => {
    let bal = cash;
    let rev = company.mrr * 1000;
    let cost = (company.netBurn + company.mrr) * 1000 * (1 - cut / 100) + hires * 12_000;
    const rows = [];
    for (let i = 0; i < 24; i++) {
      rev *= 1 + growth / 100;
      cost *= 1.012;
      bal += rev - cost;
      rows.push({ i, m: `M${i + 1}`, bal: Math.max(bal, 0), alive: bal > 0, burn: cost - rev });
      if (bal <= 0) { for (let k = i + 1; k < 24; k++) rows.push({ i: k, m: `M${k + 1}`, bal: 0, alive: false }); break; }
    }
    const months = rows.filter((r) => r.alive).length;
    return { rows, months, breakeven: rows.find((r) => r.burn < 0)?.i ?? null };
  }, [cash, hires, growth, cut, company.mrr, company.netBurn]);

  const verdict = sim.months >= 18 ? "emerald" : sim.months >= 12 ? "amber" : "red";
  const vHex = verdict === "emerald" ? "var(--ok)" : verdict === "amber" ? "var(--warn)" : "var(--danger)";
  const vSoft = verdict === "emerald" ? "bg-emerald-50 text-emerald-700" : verdict === "amber" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Runway simulator</div>
          <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>How long the cash lasts</h3>
        </div>
        <span className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold " + vSoft}>
          <Gauge size={12} /> {sim.months >= 24 ? "24+" : sim.months} months
        </span>
      </header>

      <div className="flex gap-[3px] mb-1.5" role="img" aria-label={`${sim.months} of the next 24 months are funded`}>
        {sim.rows.map((r) => (
          <div
            key={r.i}
            title={`${r.m} · ${r.alive ? ovK(Math.round(r.bal)) : "out of cash"}`}
            className="flex-1 rounded transition"
            style={{
              height: 44,
              background: r.alive
                ? "var(--brand)"
                : "var(--bg)",
              opacity: r.alive ? 1 - r.i * 0.022 : 1,
              border: r.alive ? "none" : "1px dashed var(--border-2)",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10.5px] text-slate-500 mb-4">
        <span>Today</span>
        <span className="font-bold" style={{ color: vHex }}>
          {sim.breakeven != null ? `Breakeven at month ${sim.breakeven + 1}` : "No breakeven in window"}
        </span>
        <span>24 months</span>
      </div>

      <div className="space-y-3.5 mb-3.5">
        {[
          ["Net new hires", hires,  setHires,  0, 20, 1,   (v) => `${v} people`],
          ["Monthly growth", growth, setGrowth, 0, 20, 0.2, (v) => `${v.toFixed(1)}%`],
          ["Cost reduction", cut,    setCut,    0, 40, 1,   (v) => `${v}%`],
        ].map(([label, val, set, min, max, step, fmt]) => (
          <label key={label} className="block">
            <span className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-semibold text-slate-600">{label}</span>
              <span className="text-[12.5px] font-bold text-violet-600">{fmt(val)}</span>
            </span>
            <input
              type="range" min={min} max={max} step={step} value={val}
              onChange={(e) => set(parseFloat(e.target.value))}
              className="w-full ov-range"
              style={{ background: `var(--brand)` }}
            />
          </label>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={104}>
        <AreaChart data={sim.rows} margin={{ top: 4, right: 0, bottom: 0, left: -30 }}>
          <defs>
            <linearGradient id="ov-cash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor={vHex} stopOpacity={0.3} />
              <stop offset="100%" stopColor={vHex} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="m" hide />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => ovK(Math.round(v))}
          />
          <ReferenceLine y={0} stroke="var(--border-2)" />
          <Area type="monotone" dataKey="bal" name="Cash balance" stroke={vHex} strokeWidth={2} fill="url(#ov-cash)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="text-[10.5px] text-slate-500 mt-1">Projected cash balance · starting from {ovK(cash)}</div>
    </div>
  );
}

// ─── Sub-component: Cohort heatmap ────────────────────────────────────────
function OvCohortHeatmap() {
  const [hover, setHover] = useState(null);
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <header className="mb-3.5">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Retention</div>
        <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>Logo retention by signup cohort</h3>
      </header>
      <div className="overflow-x-auto scroll-thin">
        <table style={{ borderCollapse: "separate", borderSpacing: 3, minWidth: 520, width: "100%" }}>
          <thead>
            <tr>
              <th className="text-left pr-2.5"><span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Cohort</span></th>
              {Array.from({ length: 8 }, (_, k) => (
                <th key={k} className="text-center"><span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">M{k}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OV_COHORTS.map((c) => (
              <tr key={c.cohort}>
                <td className="pr-2.5 whitespace-nowrap">
                  <div className="text-[12.5px] font-semibold text-slate-800">{c.cohort}</div>
                  <div className="text-[10.5px] text-slate-500">{c.size} accounts</div>
                </td>
                {Array.from({ length: 8 }, (_, k) => {
                  const v = c.cells[k];
                  if (v == null) return <td key={k}><div style={{ height: 30, borderRadius: 5, border: "1px dashed var(--border)" }} /></td>;
                  const t = Math.max(0, Math.min(1, (v - 55) / 45));
                  return (
                    <td key={k}>
                      <div
                        onMouseEnter={() => setHover({ cohort: c.cohort, month: k, v })}
                        onMouseLeave={() => setHover(null)}
                        style={{
                          height: 30, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                          background: `color-mix(in srgb, var(--brand) ${Math.round(12 + t * 78)}%, var(--bg))`,
                          color: t > 0.55 ? "#fff" : "var(--fg-muted)",
                          fontSize: 11.5, fontWeight: 600, cursor: "default",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                      >
                        {v}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-[11.5px] text-slate-500">
        <span>{hover ? `${hover.cohort} · month ${hover.month} · ${hover.v}% still active` : "Percent of the cohort still active each month after signup"}</span>
        <span className="inline-flex items-center gap-1.5">
          55%
          <span style={{ width: 62, height: 8, borderRadius: 999, background: "var(--brand)" }} />
          100%
        </span>
      </div>
    </div>
  );
}

// ─── Sub-component: Channels ──────────────────────────────────────────────
function OvChannelPanel() {
  const [metric, setMetric] = useState("cac");
  const sorted = React.useMemo(
    () => [...OV_CHANNELS].sort((a, b) => (metric === "cac" ? a.cac - b.cac : b[metric] - a[metric])),
    [metric]
  );
  const ceiling = 300;

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <header className="flex items-start justify-between gap-3 mb-3.5">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Acquisition</div>
          <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>Where customers actually come from</h3>
        </div>
        <div className="inline-flex p-0.5 gap-0.5 bg-gray-100 rounded-lg border border-gray-200">
          {[["cac", "CAC"], ["won", "Wins"], ["spend", "Spend"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMetric(k)}
              className={"px-2.5 h-7 rounded-md text-[11.5px] font-semibold transition " + (metric === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}
            >{l}</button>
          ))}
        </div>
      </header>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 6 }}>
          <CartesianGrid stroke="var(--grid)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => metric === "won" ? v : `$${v}k`} />
          <YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 12, fill: "var(--fg-muted)" }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--bg)" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
            formatter={(v) => metric === "won" ? `${v} accounts` : `$${v}k`}
          />
          {metric === "cac" && (
            <ReferenceLine x={ceiling} stroke="var(--warn)" strokeDasharray="4 4"
              label={{ value: "payback ceiling", position: "top", fill: "var(--warn)", fontSize: 10.5, fontWeight: 600 }} />
          )}
          <Bar dataKey={metric} name={metric === "cac" ? "CAC" : metric === "won" ? "Accounts won" : "Spend"} radius={[0, 5, 5, 0]} maxBarSize={22}>
            {sorted.map((c) => (
              <Cell key={c.name} fill={metric === "cac" && c.cac > ceiling ? "var(--danger)" : "var(--brand)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {metric === "cac" && (
        <p className="text-[11.5px] text-slate-500 mt-2.5">
          Paid search sits above the ceiling. Shifting a third of that budget to referral would pay back in under four months on last quarter's conversion rates.
        </p>
      )}
    </div>
  );
}

// ─── Sub-component: Unit economics ────────────────────────────────────────
function OvUnitEconomics({ range, months = [] }) {
  const data = React.useMemo(
    () => months.slice(-range).map((d) => ({ ...d, ratio: d.cac > 0 ? +(d.ltv / d.cac).toFixed(1) : 0 })),
    [range, months]
  );
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <header className="flex items-start justify-between gap-3 mb-3.5">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Unit economics</div>
          <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>LTV against cost to acquire</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold bg-emerald-50 text-emerald-700">
          <Zap size={12} /> {data[data.length - 1].ratio}× ratio
        </span>
      </header>
      <ResponsiveContainer width="100%" height={218}>
        <ComposedChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="m" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} minTickGap={26} />
          <YAxis yAxisId="l" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} width={44} />
          <YAxis yAxisId="r" orientation="right" domain={[0, 8]} tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} width={26} />
          <Tooltip
            cursor={{ stroke: "var(--brand)", strokeDasharray: "3 3" }}
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
            formatter={(v, k) => k === "LTV:CAC" ? `${v}×` : `$${v}`}
          />
          <ReferenceLine yAxisId="r" y={3} stroke="var(--ok)" strokeDasharray="4 4"
            label={{ value: "3× floor", position: "right", fill: "var(--ok)", fontSize: 10.5, fontWeight: 600 }} />
          <Bar  yAxisId="l" dataKey="cac"   name="CAC"      fill="var(--brand)"   opacity={0.28} radius={[3,3,0,0]} maxBarSize={20} />
          <Line yAxisId="l" dataKey="ltv"   name="LTV"      stroke="var(--brand-2)" strokeWidth={2.2} dot={false} type="monotone" />
          <Line yAxisId="r" dataKey="ratio" name="LTV:CAC"  stroke="var(--brand)"  strokeWidth={2.2} strokeDasharray="4 3" dot={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Sub-component: PMF radar ─────────────────────────────────────────────
function OvPmfRadar() {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <header className="mb-2">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Product–market fit</div>
        <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>Signal against B2B benchmark</h3>
      </header>
      <ResponsiveContainer width="100%" height={246}>
        <RadarChart data={OV_PMF} outerRadius="76%">
          <PolarGrid stroke="var(--grid)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--fg-muted)", fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
            formatter={(v) => `${v}/100`}
          />
          <Radar name="Benchmark" dataKey="bench" stroke="var(--fg-muted)" strokeDasharray="4 3" fill="none" strokeWidth={1.4} />
          <Radar name="Your score" dataKey="score" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.2} strokeWidth={2.2} />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-[11.5px] text-slate-500 mt-1">
        Support load is the one axis below benchmark — reads as a documentation gap, not a product defect.
      </p>
    </div>
  );
}

// ─── Sub-component: Accounts table ────────────────────────────────────────
function OvAccountsTable() {
  const [sort, setSort] = useState("arr");
  const rows = React.useMemo(
    () => [...OV_ACCOUNTS].sort((a, b) => (sort === "health" ? a.health - b.health : b[sort] - a[sort])),
    [sort]
  );
  const stageTone = { "At risk": "bg-red-50 text-red-700", Watch: "bg-amber-50 text-amber-700", Stable: "bg-emerald-50 text-emerald-700", Expanding: "bg-emerald-50 text-emerald-700" };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <header className="flex items-start justify-between gap-3 mb-3.5">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Accounts</div>
          <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>Largest contracts by revenue</h3>
        </div>
        <div className="inline-flex p-0.5 gap-0.5 bg-gray-100 rounded-lg border border-gray-200">
          {[["arr", "By ARR"], ["health", "By risk"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={"px-2.5 h-7 rounded-md text-[11.5px] font-semibold transition " + (sort === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}
            >{l}</button>
          ))}
        </div>
      </header>
      <div className="overflow-x-auto scroll-thin">
        <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 540 }}>
          <thead>
            <tr>
              {["Account", "ARR", "Seats", "Health", "90-day usage", "Stage"].map((h, i) => (
                <th key={h} className={i === 0 || i === 5 ? "text-left pb-2" : "text-right pb-2"}>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.name} style={{ borderTop: "1px solid var(--border)" }}>
                <td className="py-2.5 text-[13px] font-semibold text-slate-800">{a.name}</td>
                <td className="text-right text-[12.5px] text-slate-700" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>${(a.arr / 1000).toFixed(1)}k</td>
                <td className="text-right text-[12.5px] text-slate-500" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{a.seats}</td>
                <td className="text-right pl-3" style={{ width: 118 }}>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden" style={{ width: 56 }}>
                      <div className="h-full rounded-full" style={{
                        width: `${a.health}%`,
                        background: a.health > 70 ? "var(--ok)" : a.health > 40 ? "var(--warn)" : "var(--danger)",
                      }} />
                    </div>
                    <span className="text-[12px] text-slate-700" style={{ width: 22, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{a.health}</span>
                  </div>
                </td>
                <td className="text-right pl-3">
                  <span
                    className={"inline-flex items-center gap-1 justify-end text-[12.5px] font-bold " + (a.trend >= 0 ? "text-emerald-600" : "text-red-600")}
                    style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                  >
                    {a.trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(a.trend)}%
                  </span>
                </td>
                <td className="pl-3">
                  <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold " + stageTone[a.stage]}>
                    {a.stage}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Sub-component: Alert feed (richer than original) ─────────────────────
function OvAlertFeed({ setActive }) {
  const [only, setOnly] = useState("all");
  const rows = [
    { id: 1, sev: "High",   title: "Northwind Retail usage down 41%",         meta: "$42.0k ARR · renewal in 38 days", target: "clients", time: "12m" },
    { id: 2, sev: "High",   title: "Paid search CAC crossed payback ceiling",  meta: "$360 vs $300 ceiling",             target: "leads",   time: "1h"  },
    { id: 3, sev: "Medium", title: "Runway fell below 12 months",              meta: "9.5 mo at current burn",           target: "runway",  time: "4h"  },
    { id: 4, sev: "Medium", title: "3 enterprise trials stalled at day 9",     meta: "No workspace created",             target: "leads",   time: "1d"  },
    { id: 5, sev: "Low",    title: "NPS up 6 points after v4.2 ship",          meta: "n=214 responses",                  target: "feedback",time: "2d"  },
  ].filter((a) => only === "all" || a.sev === only);
  const tone = { High: "bg-red-50 text-red-600", Medium: "bg-amber-50 text-amber-600", Low: "bg-emerald-50 text-emerald-600" };

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Needs attention</div>
          <h3 className="text-[15px] font-bold text-slate-900" style={{ letterSpacing: "-.01em" }}>Open signals</h3>
        </div>
        <div className="inline-flex p-0.5 gap-0.5 bg-gray-100 rounded-lg border border-gray-200">
          {[["all", "All"], ["High", "High"], ["Medium", "Med"]].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setOnly(k)}
              className={"px-2.5 h-7 rounded-md text-[11.5px] font-semibold transition " + (only === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}
            >{l}</button>
          ))}
        </div>
      </header>
      <ul className="m-0 p-0" style={{ listStyle: "none" }}>
        {rows.map((a, i) => (
          <li
            key={a.id}
            className="flex items-start gap-3 py-2.5"
            style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
          >
            <span className={"w-7 h-7 rounded-lg flex items-center justify-center shrink-0 " + tone[a.sev]}>
              <AlertTriangle size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-slate-800 leading-snug">{a.title}</div>
              <div className="text-[11.5px] text-slate-500 mt-0.5" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{a.meta}</div>
              <button onClick={() => setActive(a.target)} className="mt-1.5 text-[11.5px] font-bold text-violet-600 hover:text-violet-800 inline-flex items-center gap-1">
                Investigate <ArrowRight size={11} />
              </button>
            </div>
            <span className="text-[11px] text-slate-400 whitespace-nowrap">{a.time} ago</span>
          </li>
        ))}
        {!rows.length && (
          <li className="py-6 text-center text-[12.5px] text-slate-500">Nothing open at this severity.</li>
        )}
      </ul>
    </div>
  );
}

// ─── Sub-component: Copilot strip (live API + fallback) ───────────────────
const OV_FALLBACK =
  "Two things move the needle this month. Paid search CAC ($360) is above your $300 payback ceiling while referral sits at $44 — reallocating a third of that budget is the cheapest growth on the board. Separately, Northwind Retail is 38 days from renewal with usage down 41%; that single account is $42k ARR and worth an exec touch this week.";

function OvCopilotStrip({ company }) {
  const [text, setText] = useState(OV_FALLBACK);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    try {
      const system = "You are the copilot inside GenCopilot, a startup operations platform. Name the two highest-leverage actions for the founder this month. Be specific, cite the numbers, no preamble, no bullet points, under 90 words.";
      const user = JSON.stringify({
        mrr: company.mrr, mrrGrowth: company.mrrGrowth, netBurn: company.netBurn, cash: company.cash,
        customers: company.customers, churn: company.churn, cac: company.cac, ltv: company.arpu * 24,
        channels: OV_CHANNELS,
      });

      let out;
      if (AI_MODE === "puter") {
        const puter = await loadPuter();
        const result = await puter.ai.chat(
          [{ role: "system", content: system }, { role: "user", content: user }],
          false,
          { model: PUTER_MODEL, max_tokens: 1024 }
        );
        out = typeof result === "string" ? result : (result?.message?.content ?? result?.text ?? "");
      } else {
        const recaptchaToken = await getRecaptchaToken("copilot_refresh");
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(recaptchaToken ? { "x-recaptcha-token": recaptchaToken } : {}),
          },
          body: JSON.stringify({
            model: NVIDIA_MODEL,
            max_tokens: 1024,
            system,
            messages: [{ role: "user", content: user }],
          }),
        });
        const d = await r.json();
        out = (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
      }
      if (out && String(out).trim()) setText(String(out).trim());
    } catch {
      setText(OV_FALLBACK);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl border shadow-sm p-4"
      style={{
        background: "var(--brand-soft-bg)",
        borderColor: "var(--brand-soft-bg)",
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
          style={{ background: "var(--brand)" }}
        >
          <Sparkles size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700">Copilot read</span>
            <button
              onClick={refresh}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 h-7 text-[11.5px] font-semibold text-slate-600 hover:text-slate-900 hover:border-violet-300 transition disabled:opacity-60"
            >
              <Sparkles size={11} /> {busy ? "Thinking…" : "Re-run"}
            </button>
          </div>
          <p className="text-[13.5px] leading-relaxed text-slate-700 m-0">{text}</p>
        </div>
      </div>
    </section>
  );
}

// ─── Live Activity feed (auto-ticking) ──────────────────────────────────

function OvActivityFeed({ setActive }) {
  const [feed, setFeed] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState("all");
  // Real activity: live community posts from Firestore (no synthetic events).
  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        unsub = fb.onCommunityFeed((posts) => {
          setFeed(posts.slice(0, 8).map((p) => ({
            id: p.id, kind: "community",
            text: p.authorName + (p.projectName ? " · " + p.projectName : "") + ": " + (p.text || "").slice(0, 90),
            when: "community", to: "community",
          })));
        }, 8);
      } catch { setFeed([]); }
    })();
    return () => unsub && unsub();
  }, []);

  const filtered = filter === "all" ? feed : feed.filter((f) => f.kind === filter);
  const KIND_LABELS = { all: "All", signup: "Signups", deal: "Deals", feedback: "Feedback", alert: "Alerts", meeting: "Meetings" };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">Live activity</h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className={"w-1.5 h-1.5 rounded-full bg-emerald-500 " + (paused ? "" : "pulse-dot")} />
              {paused ? "PAUSED" : "LIVE"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Events across your whole workspace</p>
        </div>
        <button onClick={() => setPaused(!paused)} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-slate-500" aria-label={paused ? "Resume feed" : "Pause feed"}>
          {paused ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {Object.entries(KIND_LABELS).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={"px-2 h-6 rounded-full text-[10.5px] font-bold transition " + (filter === k ? "bg-violet-600 text-white" : "bg-gray-100 text-slate-500 hover:bg-gray-200")}>{l}</button>
        ))}
      </div>
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto scroll-thin -mr-1 pr-1">
        {filtered.map((a, i) => {
          const Icon = a.icon;
          const bgCls = a.tone === "emerald" ? "bg-emerald-50 text-emerald-600" : a.tone === "amber" ? "bg-amber-50 text-amber-600" : a.tone === "red" ? "bg-red-50 text-red-600" : "bg-violet-50 text-violet-600";
          return (
            <div key={a.id} className={"flex items-start gap-2.5 rounded-xl p-2.5 hover:bg-gray-50 transition " + (i === 0 && !paused ? "anim-fadeUp" : "")}>
              <span className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " + bgCls}><Icon size={14} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] leading-tight"><span className="font-extrabold text-slate-800">{a.who}</span> <span className="text-slate-600">{a.what}</span></div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] font-semibold text-slate-400">
                  <span>{a.when}</span>
                  <span>·</span>
                  <span className="text-slate-500">{a.meta}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-xs text-slate-400 py-6">No {filter} events yet.</div>}
      </div>
    </Card>
  );
}

// ─── Quick Actions grid ─────────────────────────────────────────────────
function OvQuickActions({ setActive }) {
  const actions = [
    { icon: Mail, label: "Send investor update", sub: "Draft with live metrics", tone: "violet", to: "investors" },
    { icon: MessageSquare, label: "Ask the copilot", sub: "Answer any founder-y question", tone: "fuchsia", to: "copilot" },
    { icon: Handshake, label: "Review pipeline", sub: "4 deals in negotiation", tone: "emerald", to: "leads" },
    { icon: CalendarDays, label: "This week's meetings", sub: "6 scheduled", tone: "blue", to: "meetings" },
    { icon: ShieldCheck, label: "Check compliance", sub: "1 due this week", tone: "amber", to: "compliance" },
    { icon: Users, label: "Talk to a customer", sub: "Pick from at-risk list", tone: "red", to: "churn" },
  ];
  const toneCls = {
    violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
    fuchsia: "bg-fuchsia-50 text-fuchsia-600 group-hover:bg-fuchsia-500 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
    blue: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
    red: "bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Quick actions</h3>
          <p className="text-xs text-slate-400 mt-0.5">Six things founders do most</p>
        </div>
        <Badge tone="slate">6</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => setActive(a.to)}
              className="group text-left rounded-xl border border-gray-200 bg-white hover:border-violet-300 hover:shadow-md hover:-translate-y-0.5 transition-all p-3"
            >
              <div className={"w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors " + toneCls[a.tone]}>
                <Icon size={16} />
              </div>
              <div className="text-[12.5px] font-extrabold text-slate-800 leading-tight">{a.label}</div>
              <div className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">{a.sub}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── The Overview module itself ───────────────────────────────────────────
function OverviewModule({ module, setActive, company, user }) {
  const OV_MONTHS = React.useMemo(() => ovMonthsFrom(company), [company]);
  const hasData = OV_MONTHS.length > 0;
  const [range, setRange] = useState(12);
  const [segment, setSegment] = useState("All segments");
  const [focus, setFocus] = useState(null);
  const { openDetail } = useTheme();

  // Kanban — real tasks from Firestore
  const { items: fsTasks, update: updateTask } = useUserCollection(user, "tasks");
  const tasks = fsTasks || [];
  const cols = ["To do", "In progress", "Done"];
  const moveTask = (id, dir) => { const t = tasks.find((x) => x.id === id); if (t) updateTask(id, { col: Math.min(2, Math.max(0, (t.col || 0) + dir)) }); };

  const runwayMo = company.netBurn > 0 ? (company.cash / company.netBurn).toFixed(1) : "—";

  const kpis = [
    { id: "mrr",     icon: Wallet,   label: "MRR",                value: `$${company.mrr.toFixed(1)}k`,
      delta: company.mrrGrowth, goal: Math.min(1, company.mrr / 120), goalLabel: "$120k target",
      spark: OV_MONTHS.slice(-12).map((d) => ({ v: d.mrr })) },
    { id: "nrr",     icon: TrendingUp, label: "Net revenue retention", value: "114%",
      delta: 2.4, goal: 0.95, goalLabel: "120% target",
      spark: OV_MONTHS.slice(-12).map((d) => ({ v: 100 + (d.expansion - d.churned) / (d.mrr / 100) })) },
    { id: "users",   icon: Users,    label: "Active customers",   value: company.customers.toLocaleString(),
      delta: 7.8, goal: Math.min(1, company.customers / 2000), goalLabel: "2,000 target",
      spark: OV_MONTHS.slice(-12).map((d) => ({ v: d.users })) },
    { id: "burn",    icon: Flame,    label: "Net burn",           value: `$${company.netBurn}k`,
      delta: -2.1, invert: true, goal: Math.min(1, 60 / Math.max(company.netBurn, 1)), goalLabel: "$40k ceiling",
      spark: OV_MONTHS.slice(-12).map((_, i) => ({ v: 50 + i * 0.6 })) },
    { id: "runway",  icon: Gauge,    label: "Runway",             value: `${runwayMo} mo`,
      delta: -4.2, invert: true, goal: Math.min(1, parseFloat(runwayMo) / 18), goalLabel: "18 mo target",
      spark: OV_MONTHS.slice(-12).map((_, i) => ({ v: 20 - i * 0.5 })) },
  ];

  const drillKpi = (id) => {
    setFocus(id);
    const k = kpis.find((x) => x.id === id); if (!k) return;
    const spark12 = OV_MONTHS.slice(-12);
    const chartData = id === "mrr" ? spark12.map((d) => ({ x: d.m, y: d.mrr }))
      : id === "users" ? spark12.map((d) => ({ x: d.m, y: d.users }))
      : id === "burn" ? spark12.map((d, i) => ({ x: d.m, y: 50 + i * 0.6 }))
      : id === "runway" ? spark12.map((d, i) => ({ x: d.m, y: Math.max(2, 20 - i * 0.5) }))
      : spark12.map((d) => ({ x: d.m, y: 100 + (d.expansion - d.churned) / (d.mrr / 100) }));

    const perKpi = {
      mrr: {
        stats: [
          { label: "MRR", value: k.value, tone: "emerald" },
          { label: "MoM", value: "+" + company.mrrGrowth + "%", tone: "emerald" },
          { label: "ARR", value: "$" + (company.mrr * 12 / 1000).toFixed(2) + "M" },
        ],
        rows: [{
          heading: "MRR composition",
          items: [
            { k: "New MRR", v: "$" + Math.round(company.mrr * 0.14) + "k", sub: "logos signed this month", tone: "emerald", dot: true },
            { k: "Expansion MRR", v: "$" + Math.round(company.mrr * 0.18) + "k", sub: "upgrades + seat adds", tone: "emerald", dot: true },
            { k: "Contraction MRR", v: "-$" + Math.round(company.mrr * 0.06) + "k", sub: "downgrades", tone: "amber", dot: true },
            { k: "Churned MRR", v: "-$" + Math.round(company.mrr * 0.032) + "k", sub: "canceled accounts", tone: "red", dot: true },
          ]
        }, {
          heading: "By segment",
          items: [
            { k: "Enterprise", v: "$" + Math.round(company.mrr * 0.42) + "k", sub: "42% of MRR · 8 accounts" },
            { k: "Mid-market", v: "$" + Math.round(company.mrr * 0.31) + "k", sub: "31% · 42 accounts" },
            { k: "Self-serve", v: "$" + Math.round(company.mrr * 0.27) + "k", sub: "27% · 1,190 accounts" },
          ]
        }],
        note: "Expansion is now bigger than new — the sign of a maturing product. Keep the expansion team resourced; it's your cheapest MRR.",
        related: [
          { icon: Wallet, title: "Full runway model", sub: "Model burn scenarios", payload: null },
          { icon: TrendingDown, title: "Churn deep-dive", sub: "Who's leaving and why", payload: null },
        ]
      },
      nrr: {
        stats: [
          { label: "NRR", value: "114%", tone: "emerald" },
          { label: "GRR", value: "97.8%", sub: "gross retention" },
          { label: "Target", value: "120%" },
        ],
        rows: [{
          heading: "The math",
          items: [
            { k: "Starting MRR", v: "$45.0k", sub: "beginning of month", dot: true },
            { k: "+ Expansion", v: "+$8.1k", tone: "emerald", dot: true },
            { k: "− Contraction", v: "-$2.4k", tone: "amber", dot: true },
            { k: "− Churn", v: "-$1.4k", tone: "red", dot: true },
            { k: "= Ending", v: "$49.3k = 109.6%", tone: "emerald" },
          ]
        }],
        note: "NRR > 110% is investor gold — it means you can grow without acquiring new customers. Protect it fiercely."
      },
      users: {
        stats: [
          { label: "Active", value: k.value, tone: "emerald" },
          { label: "MoM", value: "+" + company.customerAdds, sub: "net new" },
          { label: "Churn", value: company.churn + "%" },
        ],
        rows: [{
          heading: "Acquisition mix (Aug)",
          items: [
            { k: "Referral", v: Math.round(company.customerAdds * 0.32), sub: "cheapest channel", tone: "emerald", dot: true },
            { k: "Organic search", v: Math.round(company.customerAdds * 0.28), sub: "SEO compounding", tone: "emerald", dot: true },
            { k: "Paid", v: Math.round(company.customerAdds * 0.24), sub: "CAC $186", dot: true },
            { k: "Outbound", v: Math.round(company.customerAdds * 0.16), sub: "high-touch closes", dot: true },
          ]
        }],
        note: "Referral is your best channel by cost AND retention. Every hour spent on your referral program has 3× the ROI of paid ads."
      },
      burn: {
        stats: [
          { label: "Burn", value: k.value, tone: "amber" },
          { label: "Runway", value: runwayMo + " mo" },
          { label: "Target", value: "≤$40k" },
        ],
        rows: [{
          heading: "Burn composition",
          items: [
            { k: "Payroll (loaded)", v: "$38k", sub: "68% of gross · 11 heads", tone: "amber", dot: true },
            { k: "GTM (paid + tools)", v: "$9k", sub: "16%", dot: true },
            { k: "Infra (cloud + AI)", v: "$5k", sub: "9%", tone: "emerald", dot: true },
            { k: "SaaS + other", v: "$4k", sub: "7%", dot: true },
          ]
        }],
        note: "Payroll is the only lever big enough to move the needle. A pause on 2 open reqs takes burn to $45k and adds 2 months of runway."
      },
      runway: {
        stats: [
          { label: "Runway", value: k.value, tone: parseFloat(runwayMo) >= 12 ? "emerald" : "amber" },
          { label: "Cash", value: "$" + company.cash + "k" },
          { label: "Target", value: "18 mo" },
        ],
        rows: [{
          heading: "At current burn",
          items: [
            { k: "Cash today", v: "$" + company.cash + "k", tone: "emerald", dot: true },
            { k: "Runway", v: runwayMo + " months", dot: true },
            { k: "Fundraise buffer", v: parseFloat(runwayMo) >= 9 ? "OK" : "Open the round", tone: parseFloat(runwayMo) >= 9 ? "emerald" : "amber", dot: true },
          ]
        }],
        note: "You have time, but not so much that you can afford a bad quarter. The rule of thumb is to have your next round closed by month 6 of runway.",
        actions: [
          { label: "Open Runway module", icon: Wallet, primary: true, onClick: () => setActive("runway") },
        ]
      },
    };

    const p = perKpi[id];
    openDetail({
      kicker: "KPI · " + k.label,
      title: k.value,
      subtitle: (k.delta >= 0 ? "+" : "") + k.delta + "% vs. prior period",
      bar: { label: k.goalLabel, value: Math.round(k.goal * 100) + "%", pct: k.goal * 100 },
      chart: {
        kind: "area",
        title: "12-month trend",
        data: chartData,
        name: k.label,
        caption: "Full 12-month window. Drag the range switcher on the dashboard to zoom in on a shorter window.",
      },
      ...p,
    });
  };

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      {/* Local styles: range slider look, animation delay helpers */}
      <style>{`
        .ov-range { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 999px; outline: none; }
        .ov-range::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 0; background: var(--fg); border: 1px solid var(--bg); cursor: grab; box-shadow: none; }
        .ov-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--brand); border: 2px solid var(--surface); cursor: grab; }
      `}</style>

      {/* Greeting + toolbar */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">Overview</div>
          <h1 className="text-[22px] font-bold text-slate-900" style={{ letterSpacing: "-.025em" }}>{greetingFor(user)}</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Revenue is compounding at {company.mrrGrowth}% a month. Runway is the constraint worth watching.
            <button onClick={() => setActive("company")} className="ml-2 text-[11.5px] font-bold text-violet-600 hover:text-violet-800 inline-flex items-center gap-1"><Edit3 size={11} /> Edit numbers</button>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 h-8 text-[12.5px] font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
          >
            {["All segments", "Enterprise", "Mid-market", "Self-serve"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="inline-flex p-0.5 gap-0.5 bg-gray-100 rounded-lg border border-gray-200">
            {[[6, "6M"], [12, "1Y"], [19, "All"]].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setRange(v)}
                className={"px-2.5 h-7 rounded-md text-[11.5px] font-semibold transition " + (range === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}
              >{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Copilot strip */}
      <OvCopilotStrip company={company} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
        {kpis.map((k) => (
          <OvKpi key={k.id} {...k} on={focus === k.id} onClick={() => drillKpi(k.id)} />
        ))}
      </div>

      {/* Growth engine + runway simulator */}
      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2"><OvGrowthPanel months={OV_MONTHS} range={range} /></div>
        <OvRunwaySim company={company} />
      </div>

      {/* Cohort + PMF radar */}
      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2"><OvCohortHeatmap /></div>
        <OvPmfRadar />
      </div>

      {/* Channels + unit economics */}
      <div className="grid xl:grid-cols-2 gap-4 mt-4">
        <OvChannelPanel />
        <OvUnitEconomics months={OV_MONTHS} range={range} />
      </div>

      {/* Accounts + alerts */}
      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2"><OvAccountsTable /></div>
        <OvAlertFeed setActive={setActive} />
      </div>

      {/* Live activity + Quick actions */}
      <div className="grid xl:grid-cols-3 gap-4 mt-4">
        <div className="xl:col-span-2"><OvActivityFeed setActive={setActive} /></div>
        <OvQuickActions setActive={setActive} />
      </div>

      {/* Kanban (kept from original) */}
      <ChartCard title="Team progress" sub="Sprint 34 · drag tasks with the arrows" right={<Badge tone="emerald">{tasks.filter((t) => t.col === 2).length}/{tasks.length} done</Badge>}>
        <div className="grid md:grid-cols-3 gap-4 mt-1">
          {cols.map((c, ci) => (
            <div key={c} className="rounded-2xl bg-gray-100 p-3 min-h-[180px]">
              <div className="flex items-center justify-between px-1 mb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{c}</span>
                <span className="text-xs font-bold text-slate-400">{tasks.filter((t) => t.col === ci).length}</span>
              </div>
              <div className="space-y-2.5">
                {tasks.filter((t) => t.col === ci).map((t) => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition group">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{t.t}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-[10px] font-extrabold flex items-center justify-center">{t.who}</span>
                      <span className="flex gap-1 opacity-40 group-hover:opacity-100 transition">
                        <button onClick={() => moveTask(t.id, -1)} disabled={ci === 0} className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-20" aria-label="Move left"><ChevronLeft size={14} /></button>
                        <button onClick={() => moveTask(t.id, 1)} disabled={ci === 2} className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-20" aria-label="Move right"><ChevronRight size={14} /></button>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    </ModuleShell>
  );
}

// ------------------------------------------------------- module 2: PMF -----
function PMFModule({ module }) {
  const [wl, setWl] = useState(WAITLIST_INIT);
  const [em, setEm] = useState("");
  const [joined, setJoined] = useState(false);
  const passed = PMF_SURVEY[0].v >= 40;
  const { openDetail } = useTheme();

  const PMF_VERBATIMS = {
    "Very disappointed": [
      "\"Honestly, I've built our whole reporting flow on this. Removing it would set us back weeks.\" — Series A ops lead",
      "\"The AI copilot is the reason I stopped exporting to sheets every Monday.\" — solo founder, SaaS",
      "\"We evaluated 4 tools. Nothing else keeps our numbers this current.\" — pre-seed CEO",
    ],
    "Somewhat disappointed": [
      "\"Useful, but I'd survive if I had to rebuild the dashboard elsewhere.\" — bootstrapped founder",
      "\"I like it, but the compliance module is what really keeps me here.\" — India-based CEO",
    ],
    "Not disappointed": [
      "\"Nice to have, honestly. My Notion setup covers most of this.\" — team of 2",
      "\"I've been meaning to check out MetricHive — probably fine either way.\" — CTO",
    ],
  };

  const drillPmf = (idx) => {
    const s = PMF_SURVEY[idx]; if (!s) return;
    const isVeryDisappointed = s.label === "Very disappointed";
    openDetail({
      kicker: "Sean Ellis · n=412",
      title: s.v + "% " + s.label.toLowerCase(),
      subtitle: isVeryDisappointed
        ? "Above the classic 40% PMF threshold"
        : "Cohort " + s.label.toLowerCase() + " if the product disappeared",
      bar: { label: "Share of respondents", value: s.v + "%", pct: s.v },
      stats: [
        { label: "Respondents", value: Math.round(412 * s.v / 100), sub: "of 412" },
        { label: "vs. Q1", value: (idx === 0 ? "+6" : idx === 1 ? "-3" : "-3") + "pp", tone: idx === 0 ? "emerald" : "amber" },
        { label: "Segment lean", value: idx === 0 ? "Ops-heavy" : "Mixed", sub: idx === 0 ? "Series A+" : "" },
      ],
      chart: {
        kind: "bar",
        title: "Same question, past 4 quarters",
        data: [
          { x: "Q4'25", y: Math.max(5, s.v - (idx === 0 ? 8 : idx === 1 ? -2 : -4)) },
          { x: "Q1'26", y: Math.max(5, s.v - (idx === 0 ? 5 : idx === 1 ? -1 : -3)) },
          { x: "Q2'26", y: Math.max(5, s.v - (idx === 0 ? 2 : idx === 1 ? 0 : -1)) },
          { x: "Q3'26", y: s.v },
        ],
        name: "%",
        caption: "Track trend: 'very disappointed' has trended up 3 quarters in a row.",
      },
      rows: [{
        heading: "Sample verbatims",
        badge: (PMF_VERBATIMS[s.label] || []).length + " quotes",
        items: (PMF_VERBATIMS[s.label] || []).map((q) => ({ k: q, v: "" })),
      }],
      note: isVeryDisappointed
        ? "You've cleared PMF. The playbook now is to double-down on the language these customers use — pull the top 20 verbatims and hand-craft your homepage headlines from them."
        : idx === 1
          ? "This is the segment to convert. They like it but haven't wired it into their weekly workflow — usually an onboarding + activation problem, not a product one."
          : "For this group, don't chase them. Focus energy on the 'very disappointed' segment and let churn filter this cohort naturally."
    });
  };

  const drillWaitlist = (idx) => {
    const p = wl[idx]; if (!p) return;
    const prev = idx > 0 ? wl[idx - 1] : null;
    const weekly = prev ? p.signups - prev.signups : p.signups;
    openDetail({
      kicker: "Waitlist · week " + (idx + 1),
      title: p.signups.toLocaleString() + " total",
      subtitle: prev ? "+" + weekly + " signups this week" : "Starting cohort",
      bar: { label: "Progress to 5,000 target", value: Math.round((p.signups / 5000) * 100) + "%", pct: (p.signups / 5000) * 100 },
      stats: [
        { label: "Signups", value: "+" + weekly, tone: "emerald" },
        { label: "Conversion", value: "18%", sub: "of visits" },
        { label: "Referral", value: Math.round(weekly * 0.3), sub: "of this week" },
      ],
      chart: {
        kind: "area",
        title: "Full 8-week trajectory",
        data: wl.map((x) => ({ x: x.w, y: x.signups })),
        name: "Total signups",
        caption: "Momentum is steady — the referral loop is starting to compound.",
      },
      rows: [{
        heading: "Traffic sources (this week)",
        items: [
          { k: "Product Hunt launch echo", v: Math.round(weekly * 0.34), sub: "34%", tone: "emerald", dot: true },
          { k: "Founder Twitter/LinkedIn", v: Math.round(weekly * 0.28), sub: "28%", dot: true },
          { k: "Direct referral", v: Math.round(weekly * 0.24), sub: "24%", tone: "emerald", dot: true },
          { k: "Organic search", v: Math.round(weekly * 0.14), sub: "14%", dot: true },
        ]
      }],
      note: "Weekly velocity is trending up. Set a hard cutoff at 5,000 before opening waitlist invites — scarcity is doing real work here."
    });
  };

  function join() {
    if (!em.includes("@")) return;
    setWl((d) => d.map((p, i) => (i === d.length - 1 ? { ...p, signups: p.signups + 1 } : p)));
    setJoined(true);
    setEm("");
  }

  return (
    <ModuleShell module={module}>
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard
          title="Sean Ellis PMF survey"
          sub="Click any bar for verbatims and trend · n=412"
          right={passed ? <Badge tone="emerald"><CheckCircle2 size={11} /> PMF signal · ≥40%</Badge> : <Badge tone="amber">Below 40%</Badge>}
        >
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PMF_SURVEY} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 0 }} onClick={(e) => e && e.activeTooltipIndex != null && drillPmf(e.activeTooltipIndex)}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => v + "%"} cursor={{ fill: "var(--brand-soft-bg)" }} />
                <Bar dataKey="v" radius={[0, 8, 8, 0]} barSize={26}>
                  {PMF_SURVEY.map((s) => <Cell key={s.label} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">41% of respondents would be <span className="font-bold text-emerald-600">very disappointed</span> to lose the product — above the classic 40% product–market fit threshold.</p>
        </ChartCard>

        <ChartCard title="Waitlist momentum" sub="Click any point for the weekly breakdown" right={<Badge tone="blue">{wl[wl.length - 1].signups.toLocaleString()} total</Badge>}>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wl} margin={{ top: 5, right: 5, left: -18, bottom: 0 }} onClick={(e) => e && e.activeTooltipIndex != null && drillWaitlist(e.activeTooltipIndex)}>
                <defs>
                  <linearGradient id="wlFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="w" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="signups" name="Signups" stroke={BLUE} strokeWidth={2.5} fill="url(#wlFill)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {joined ? (
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-600"><CheckCircle2 size={16} /> Added to the waitlist — chart updated live.</div>
          ) : (
            <div className="mt-3 flex gap-2">
              <input value={em} onChange={(e) => setEm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && join()} placeholder="Test the widget: you@startup.com" className="flex-1 min-w-0 rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
              <Btn onClick={join}>Join</Btn>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Active surveys" sub="Embedded in-app & on the waitlist page">
          <div className="space-y-3">
            {SURVEYS.map((s) => (
              <div key={s.name} className="rounded-xl border border-gray-200 p-3.5 flex items-center gap-3 hover:border-violet-200 transition">
                <span className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0"><MessageSquare size={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-800 truncate">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.responses} responses</div>
                </div>
                <Badge tone={s.status === "Live" ? "emerald" : "slate"}>{s.status}</Badge>
              </div>
            ))}
            <Btn variant="soft" className="w-full" onClick={() => alert("New survey builder coming soon")}>+ New survey</Btn>
          </div>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {[
          { t: "Double down on ops-lead founders", d: "78% of 'very disappointed' respondents are operations-focused founders at 5–20 person companies. That's your beachhead persona — aim positioning and ads there." },
          { t: "The 'somewhat' group wants integrations", d: "63% of 'somewhat disappointed' users cite a missing HubSpot/Slack sync as the gap. Shipping one integration could convert a chunk of them to core users." },
          { t: "Waitlist velocity is accelerating", d: "Week-over-week signup growth rose from 2.6× to 3.9× after the founder-community launch. Referral loop is working — formalize it with an invite incentive." },
        ].map((c) => (
          <Card key={c.t} className="p-5 border-l-4 border-l-fuchsia-400">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={15} className="text-fuchsia-500" /><span className="text-xs font-extrabold uppercase tracking-wide text-fuchsia-600">AI insight</span></div>
            <h4 className="text-sm font-extrabold text-slate-900">{c.t}</h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{c.d}</p>
          </Card>
        ))}
      </div>
    </ModuleShell>
  );
}

// -------------------------------------------------- module 3: feedback -----
function FeedbackModule({ module, user, company }) {
  const [filter, setFilter] = useState("all");
  const [selId, setSelId] = useState(null);
  const { items: fsItems, add: addFb } = useUserCollection(user, "feedback");
  const ALL = fsItems || [];
  const items = ALL.filter((f) => filter === "all" || f.sentiment === filter);
  const sel = ALL.find((f) => f.id === selId) || items[0];
  const tone = { positive: "emerald", neutral: "slate", negative: "red" };
  const counts = {
    positive: ALL.filter((f) => f.sentiment === "positive").length,
    neutral: ALL.filter((f) => f.sentiment === "neutral").length,
    negative: ALL.filter((f) => f.sentiment === "negative").length,
  };
  const [nfUser, setNfUser] = useState(""); const [nfText, setNfText] = useState(""); const [nfSent, setNfSent] = useState("positive");
  async function logFeedback() {
    if (!nfText.trim()) return;
    await addFb({ user: nfUser || "Customer", text: nfText, sentiment: nfSent, theme: "General", source: "Manual", when: "now", ai: "" });
    setNfUser(""); setNfText("");
  }
  const replies = {
    positive: "Thank you so much — this made our week! Mind if we quote you (first name only) on our site? Also flagging your account for early access to the next reporting upgrade.",
    neutral: "Great question — it's on the roadmap and I've added your vote to the request. I'll ping you personally the moment it ships. Anything that would make the current workaround easier meanwhile?",
    negative: "You're right and I'm sorry — that's below the bar we hold ourselves to. Engineering is on it this sprint; I'll follow up with you directly by Friday with a fix or a concrete timeline.",
  };
  const { openDetail } = useTheme();

  const drillSentiment = (idx) => {
    const pt = SENTIMENT_TREND[idx]; if (!pt) return;
    const prev = idx > 0 ? SENTIMENT_TREND[idx - 1] : null;
    const delta = prev ? pt.score - prev.score : 0;
    const themes = idx % 2 === 0
      ? [{ k: "Performance complaints", v: "-3.2", tone: "red", sub: "biggest drag", dot: true }, { k: "Copilot delight", v: "+4.1", tone: "emerald", dot: true }, { k: "Onboarding friction", v: "-1.4", tone: "amber", dot: true }]
      : [{ k: "Copilot delight", v: "+5.2", tone: "emerald", sub: "biggest lift", dot: true }, { k: "Runway module praise", v: "+2.8", tone: "emerald", dot: true }, { k: "Export limitations", v: "-2.0", tone: "amber", dot: true }];
    openDetail({
      kicker: "Sentiment · week " + pt.w,
      title: pt.score + " / 100",
      subtitle: prev ? (delta >= 0 ? "+" : "") + delta.toFixed(1) + " vs. prior week" : "Baseline week",
      bar: { label: "Score vs. 80 target", value: Math.round((pt.score / 80) * 100) + "%", pct: (pt.score / 80) * 100 },
      stats: [
        { label: "Score", value: pt.score, tone: pt.score >= 70 ? "emerald" : "amber" },
        { label: "vs. prev", value: (delta >= 0 ? "+" : "") + delta.toFixed(1), tone: delta >= 0 ? "emerald" : "red" },
        { label: "Volume", value: 24 + (idx % 5) * 4, sub: "responses" },
      ],
      chart: {
        kind: "line",
        title: "Weekly score, 8-week window",
        data: SENTIMENT_TREND.map((s) => ({ x: s.w, y: s.score })),
        name: "Sentiment",
        caption: "Score of 70+ is 'happy' territory. Every dip should trigger a theme review.",
      },
      rows: [{
        heading: "Top movers this week",
        badge: themes.length + " themes",
        items: themes,
      }, {
        heading: "Channel breakdown",
        items: [
          { k: "In-app", v: pt.score + 3, sub: "45% of responses", tone: "emerald" },
          { k: "Email", v: pt.score - 2, sub: "30% of responses" },
          { k: "Slack Connect", v: pt.score + 6, sub: "15% of responses", tone: "emerald" },
          { k: "Support tickets", v: pt.score - 8, sub: "10% of responses", tone: "amber" },
        ]
      }],
      note: delta < -2
        ? "Score dropped meaningfully this week. Pull the negative-sentiment items above, cluster by theme, and ship a public 'here's what we're doing about it' note within 48 hours."
        : delta > 2
          ? "Real lift this week. Capture 2–3 verbatims from the positive column and turn them into case studies — sentiment spikes fade if you don't preserve them."
          : "Steady week. Watch for one theme drifting negative for 3 weeks in a row — that's the pattern worth escalating."
    });
  };

  const logForm = (
    <Card className="p-5 mb-4">
      <h3 className="text-sm font-extrabold text-slate-900 mb-3">Log customer feedback</h3>
      <div className="flex flex-wrap gap-2">
        <input value={nfUser} onChange={(e) => setNfUser(e.target.value)} placeholder="Customer name" className="flex-1 min-w-[140px] rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none" />
        <select value={nfSent} onChange={(e) => setNfSent(e.target.value)} className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none">
          <option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option>
        </select>
        <input value={nfText} onChange={(e) => setNfText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && logFeedback()} placeholder="What did they say?" className="w-full flex-[3] min-w-[200px] rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none" />
        <Btn variant="primary" className="px-4" onClick={logFeedback} disabled={!nfText.trim()}>Log it</Btn>
      </div>
    </Card>
  );

  if (fsItems === null) {
    return <ModuleShell module={module} companyLine={companyLineFrom(company || {})}><Card className="p-10 text-center text-sm text-slate-500">Loading feedback…</Card></ModuleShell>;
  }
  if (ALL.length === 0) {
    return (
      <ModuleShell module={module} companyLine={companyLineFrom(company || {})}>
        {logForm}
        <EmptyState icon={Inbox} title="No feedback yet" body="Log your first piece of customer feedback above. As real feedback accumulates, sentiment analytics and AI themes light up here." />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company || {})}>
      {logForm}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Stat icon={Inbox} label="Feedback logged" value={String(ALL.length)} delta={"+" + counts.positive + " positive"} />
        <Stat icon={TrendingUp} label="Sentiment score" value="72 / 100" delta="+4 pts" tone="emerald" />
        <Stat icon={AlertTriangle} label="Top negative theme" value="Performance" sub="3 mentions · escalated" tone="red" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex flex-wrap gap-1.5">
              {[["all", "All " + FEEDBACK_ITEMS.length], ["positive", "Positive " + counts.positive], ["neutral", "Neutral " + counts.neutral], ["negative", "Negative " + counts.negative]].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)} className={"px-3 py-1.5 rounded-full text-xs font-bold transition " + (filter === k ? "bg-violet-600 text-white" : "bg-gray-100 text-slate-500 hover:bg-gray-200")}>{l}</button>
              ))}
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto scroll-thin">
            {items.map((f) => (
              <button key={f.id} onClick={() => setSelId(f.id)} className={"w-full text-left px-4 py-3.5 border-b border-gray-50 transition " + (sel && sel.id === f.id ? "bg-violet-50" : "hover:bg-gray-50")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-slate-800">{f.user}</span>
                  <Badge tone={tone[f.sentiment]} className="capitalize">{f.sentiment}</Badge>
                  <span className="ml-auto text-[11px] font-semibold text-slate-400">{f.time}</span>
                </div>
                <p className="text-xs text-slate-500 leading-snug line-clamp-2">{f.text}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          {sel && (
            <Card className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-base font-extrabold text-slate-900">{sel.user}</span>
                <Badge tone={tone[sel.sentiment]} className="capitalize">{sel.sentiment}</Badge>
                <Badge tone="blue">{sel.theme}</Badge>
                <Badge tone="slate">{sel.channel}</Badge>
                <span className="ml-auto text-xs font-semibold text-slate-400">{sel.time}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">“{sel.text}”</p>
              <div className="mt-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-4">
                <div className="flex items-center gap-2 mb-1.5"><Sparkles size={14} className="text-fuchsia-600" /><span className="text-xs font-extrabold uppercase tracking-wide text-fuchsia-700">AI-suggested reply</span></div>
                <p className="text-sm text-slate-700 leading-relaxed">{replies[sel.sentiment]}</p>
                <div className="mt-3 flex gap-2">
                  <Btn variant="green" className="px-3.5 py-2 text-xs" onClick={() => alert("Reply sent to " + sel.user)}>Send reply</Btn>
                  <Btn variant="ghost" className="px-3.5 py-2 text-xs" onClick={() => alert("Opening reply editor…")}>Edit first</Btn>
                </div>
              </div>
            </Card>
          )}

          <ChartCard title="Sentiment trend" sub="Click any week for a full breakdown">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SENTIMENT_TREND} margin={{ top: 5, right: 5, left: -22, bottom: 0 }} onClick={(e) => e && e.activeTooltipIndex != null && drillSentiment(e.activeTooltipIndex)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="w" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 80]} tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                  <Line type="monotone" dataKey="score" name="Sentiment" stroke={GREEN} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </ModuleShell>
  );
}

// ----------------------------------------------------- module 4: leads -----
function LeadsModule({ module, user, company }) {
  const { items: fsLeads, add: addLead } = useUserCollection(user, "leads");
  const LEADS = fsLeads || [];
  const [nlName, setNlName] = useState(""); const [nlCo, setNlCo] = useState(""); const [nlVal, setNlVal] = useState("");
  async function createLead() {
    if (!nlName.trim()) return;
    await addLead({ name: nlName, company: nlCo || "-", stage: "New", score: 50, value: parseFloat(nlVal) || 0, last: "just added", intent: "unknown" });
    setNlName(""); setNlCo(""); setNlVal("");
  }
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("All");
  const [desc, setDesc] = useState(true);
  const [starred, setStarred] = useState([1]);
  const stages = ["All", "New", "Qualified", "Demo", "Negotiation"];
  const stageTone = { New: "slate", Qualified: "blue", Demo: "amber", Negotiation: "emerald" };

  const rows = LEADS
    .filter((l) => (stage === "All" || l.stage === stage) && (l.name + " " + l.company).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (desc ? b.score - a.score : a.score - b.score));
  const pipeline = rows.reduce((s, l) => s + l.value, 0);

  return (
    <ModuleShell module={module}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Stat icon={Filter} label="Leads in view" value={rows.length} sub={stage === "All" ? "all stages" : stage} />
        <Stat icon={DollarSign} label="Pipeline value" value={"$" + pipeline + "k"} sub="annual contract value" tone="emerald" />
        <Stat icon={Zap} label="Hot leads (85+)" value={rows.filter((l) => l.score >= 85).length} sub="work these first" tone="amber" />
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or company…" className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm focus:bg-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stages.map((s) => (
              <button key={s} onClick={() => setStage(s)} className={"px-3 py-1.5 rounded-full text-xs font-bold transition " + (stage === s ? "bg-violet-600 text-white" : "bg-gray-100 text-slate-500 hover:bg-gray-200")}>{s}</button>
            ))}
          </div>
          <button onClick={() => setDesc(!desc)} className="md:ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition">
            Score {desc ? "high → low" : "low → high"} {desc ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left text-[11px] font-extrabold uppercase tracking-wide text-slate-400 border-b border-gray-100">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Last activity</th>
                <th className="px-4 py-3 w-56">AI score</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 hover:bg-violet-50/40 transition">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-800">{l.name}</div>
                    <div className="text-xs text-slate-400">{l.company}</div>
                  </td>
                  <td className="px-4 py-3.5"><Badge tone={stageTone[l.stage]}>{l.stage}</Badge></td>
                  <td className="px-4 py-3.5 font-bold text-slate-700">${l.value}k</td>
                  <td className="px-4 py-3.5 text-slate-500">{l.last}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={"text-sm font-extrabold w-8 " + (l.score >= 85 ? "text-emerald-600" : l.score >= 70 ? "text-violet-600" : "text-slate-400")}>{l.score}</span>
                      <div className="flex-1"><Progress v={l.score} tone={scoreTone(l.score)} /></div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button onClick={() => setStarred((s) => (s.includes(l.id) ? s.filter((x) => x !== l.id) : [...s, l.id]))} className="p-1.5 rounded-lg hover:bg-amber-50 transition" aria-label="Prioritize">
                      <Star size={17} className={starred.includes(l.id) ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No leads match — clear the search or pick another stage.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4 p-5 border-l-4 border-l-violet-500">
        <div className="flex items-center gap-2 mb-1.5"><Sparkles size={15} className="text-violet-600" /><span className="text-xs font-extrabold uppercase tracking-wide text-violet-700">How scoring works</span></div>
        <p className="text-sm text-slate-600 leading-relaxed">Scores blend <span className="font-bold">engagement recency</span> (40%), <span className="font-bold">firmographic fit</span> to your ICP (35%), and <span className="font-bold">deal-stage momentum</span> (25%), recalculated nightly. A score of 85+ historically converts 4.2× more often than sub-60 — spend your best hours there.</p>
      </Card>
    </ModuleShell>
  );
}

// ----------------------------------------------------- module 5: churn -----
function ChurnModule({ module, user, company }) {
  const { items: fsClients } = useUserCollection(user, "clients");
  const CLIENT_LIST = fsClients || [];
  const COHORTS = [];
  const AT_RISK = CLIENT_LIST.filter((cl) => (cl.health || 100) < 70).map((cl) => ({
    id: cl.id, name: cl.name, plan: (cl.plan || "-") + " · $" + (cl.mrr || 0) + "/mo",
    risk: Math.min(99, 100 - (cl.health || 0)), why: "Health score " + (cl.health || 0) + "/100", play: "Reach out this week; book a check-in call and confirm goals.",
  }));
  const [openId, setOpenId] = useState(null);
  const monthsSince = ["M0", "M1", "M2", "M3", "M4", "M5"];
  const { openDetail } = useTheme();

  const drillCohort = (cohort, mi) => {
    const retention = cohort.vals[mi];
    if (retention == null) return;
    const curve = cohort.vals.map((v, i) => ({ x: monthsSince[i], y: v == null ? null : v })).filter((p) => p.y != null);
    const monthly = mi > 0 && cohort.vals[mi - 1] != null ? cohort.vals[mi - 1] - retention : 0;
    const risk = retention < 60 ? "red" : retention < 80 ? "amber" : "emerald";
    openDetail({
      kicker: cohort.name + " cohort · " + monthsSince[mi],
      title: retention + "% retained",
      subtitle: mi === 0 ? "Starting cohort baseline" : "Down from " + cohort.vals[0] + "% at signup",
      bar: { label: "Retention vs. 70% benchmark", value: retention + "%", pct: retention },
      stats: [
        { label: "Retained", value: retention + "%", tone: risk },
        { label: "Monthly loss", value: monthly + "pp", tone: monthly > 5 ? "red" : "amber" },
        { label: "Cohort size", value: 60 + Math.floor(cohort.name.charCodeAt(0) % 20) + 40 },
      ],
      chart: {
        kind: "line",
        title: "Retention curve for this cohort",
        data: curve,
        name: "% retained",
        caption: "The classic pattern: steep drop in the first 2 months, then flatten. A flat tail is worth more than a slow bleed.",
      },
      rows: [{
        heading: "Why customers left (this cohort)",
        items: [
          { k: "Didn't reach activation", v: Math.round((100 - retention) * 0.42) + "%", sub: "no dashboard viewed in week 2", tone: "red", dot: true },
          { k: "Price sensitivity", v: Math.round((100 - retention) * 0.28) + "%", sub: "downgraded then churned", tone: "amber", dot: true },
          { k: "Missing feature", v: Math.round((100 - retention) * 0.18) + "%", sub: "mostly exports + integrations", tone: "amber", dot: true },
          { k: "Company shutdown", v: Math.round((100 - retention) * 0.12) + "%", sub: "unrecoverable", dot: true },
        ]
      }, {
        heading: "Cohort economics",
        items: [
          { k: "Avg. ARPU", v: "$" + (36 + mi * 2), sub: mi > 0 ? "expansion + contraction" : "at signup" },
          { k: "LTV so far", v: "$" + Math.round((36 + mi * 2) * (mi + 1) * (retention / 100)), tone: "emerald" },
          { k: "CAC payback", v: (retention >= 70 ? (mi + 1) + " mo" : "Not yet"), tone: retention >= 70 ? "emerald" : "amber" },
        ]
      }],
      note: retention >= 80
        ? "This cohort is doing what you want — healthy long tail. Bottle whatever onboarding you shipped that month; other cohorts should look like this."
        : retention >= 60
          ? "Standard shape but ~20pp drop in months 1–2 is where the fix lives. That's a first-week activation problem, not a product problem."
          : "This cohort is bleeding. Pull the top 5 churned accounts from this cohort, do 20-min calls with each, and find the one shared root cause. It's usually just one."
    });
  };

  return (
    <ModuleShell module={module}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Stat icon={TrendingDown} label="Monthly churn" value="3.2%" delta="-0.4pp vs target" sub="up 0.4pp in Aug" tone="amber" />
        <Stat icon={AlertTriangle} label="Accounts at risk" value="4" sub="$3.9k MRR exposed" tone="red" />
        <Stat icon={CheckCircle2} label="Saves this quarter" value="11" delta="+$6.2k MRR retained" tone="emerald" />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <ChartCard title="Retention heatmap" sub="Click any cell for the cohort's retention curve" right={<Badge tone="slate">Cohorts Feb–Jul</Badge>}>
          <div className="overflow-x-auto">
            <div className="min-w-[420px]">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}>
                <div />
                {monthsSince.map((m) => <div key={m} className="text-center text-[11px] font-extrabold text-slate-400">{m}</div>)}
                {COHORTS.map((c) => (
                  <React.Fragment key={c.name}>
                    <div className="flex items-center text-[11px] font-extrabold text-slate-500">{c.name}</div>
                    {monthsSince.map((_, mi) => {
                      const v = c.vals[mi];
                      if (v == null) return <div key={mi} className="h-10 rounded-lg bg-gray-50" />;
                      return (
                        <button key={mi} onClick={() => drillCohort(c, mi)} className="h-10 rounded-lg flex items-center justify-center text-[11px] font-extrabold text-white shadow-sm hover:scale-110 hover:shadow-md transition-all cursor-pointer" style={{ backgroundColor: heatColor((100 - v) / 45) }} title={c.name + " cohort · " + m0(mi) + ": " + v + "% retained · click for detail"}>
                          {v}%
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-[11px] font-semibold text-slate-400">
                <span>Healthy</span>
                <span className="h-2 flex-1 rounded-full" style={{ background: heatColor(0.5) }} />
                <span>At risk</span>
              </div>
            </div>
          </div>
        </ChartCard>

        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">At-risk accounts</h3>
              <p className="text-xs text-slate-400 mt-0.5">Model flags · click an account for its retention play</p>
            </div>
            <Badge tone="red">4 flagged</Badge>
          </div>
          <div className="space-y-3">
            {AT_RISK.map((a) => (
              <div key={a.id} className="rounded-xl border border-gray-200 overflow-hidden hover:border-violet-200 transition">
                <button onClick={() => setOpenId(openId === a.id ? null : a.id)} className="w-full text-left p-4 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-slate-900">{a.name}</span>
                      <span className="text-xs text-slate-400">{a.plan}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{a.reason}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-extrabold" style={{ color: heatColor(a.risk / 100) }}>{a.risk}%</div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">churn risk</div>
                  </div>
                  <ChevronDown size={16} className={"text-slate-400 transition-transform " + (openId === a.id ? "rotate-180" : "")} />
                </button>
                {openId === a.id && (
                  <div className="px-4 pb-4 anim-fadeUp">
                    <div className="rounded-xl bg-fuchsia-50 border border-fuchsia-200 p-3.5">
                      <div className="flex items-center gap-2 mb-1"><Lightbulb size={14} className="text-fuchsia-600" /><span className="text-xs font-extrabold uppercase tracking-wide text-fuchsia-700">Retention play</span></div>
                      <p className="text-sm text-slate-700 leading-relaxed">{a.play}</p>
                      <Btn variant="green" className="mt-3 px-3.5 py-2 text-xs" onClick={() => alert("Retention play assigned to your CS team")}>Assign play to CS</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        {[
          { t: "Fix month-1 drop-off first", d: "Your steepest retention loss is M0→M1 (−8 to −12pp). A guided 'first win' checklist in week one typically recovers 3–5pp here." },
          { t: "Champion-loss early warning", d: "2 of 4 flagged accounts follow a champion departure. Track title changes on key contacts and auto-trigger an exec check-in." },
          { t: "Cohort quality is improving", d: "Jun and Jul cohorts retain 4–5pp better at M1 than Feb — the new onboarding flow is working. Keep it in the control group no longer; roll out to all." },
        ].map((c) => (
          <Card key={c.t} className="p-5 border-l-4 border-l-violet-500">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={15} className="text-violet-600" /><span className="text-xs font-extrabold uppercase tracking-wide text-violet-700">AI insight</span></div>
            <h4 className="text-sm font-extrabold text-slate-900">{c.t}</h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{c.d}</p>
          </Card>
        ))}
      </div>
    </ModuleShell>
  );
}
function m0(i) { return "M" + i; }

// ---------------------------------------------------- module 6: runway -----
function RunwayModule({ module, company }) {
  const cash = company?.cash > 0 ? company.cash : 0;
  const baseBurn = company?.netBurn > 0 ? company.netBurn : 0;
  const [adj, setAdj] = useState(100); // % of base burn
  const [hire, setHire] = useState(false);
  const burn = Math.max(1, Math.round((baseBurn * adj) / 100) + (hire ? 15 : 0));
  const runway = cash / burn;
  const proj = [];
  for (let t = 0; t <= 13; t++) proj.push({ m: "M" + t, balance: Math.round(cash - burn * t) });
  const runwayTone = runway >= 12 ? "emerald" : runway >= 8 ? "amber" : "red";
  const { openDetail } = useTheme();

  if (!cash || !baseBurn) {
    return (
      <ModuleShell module={module} companyLine={companyLineFrom(company)}>
        <Card className="p-10 text-center max-w-lg mx-auto">
          <Wallet size={30} className="mx-auto text-violet-500 mb-3" />
          <div className="font-extrabold text-slate-900">Add your cash & burn first</div>
          <div className="text-sm text-slate-500 mt-1">Enter your current cash balance and monthly net burn in Company Data — this model then projects your real runway with what-if sliders.</div>
        </Card>
      </ModuleShell>
    );
  }

  const drillCash = (idx) => {
    const p = proj[idx]; if (!p) return;
    const monthsFromNow = idx;
    const remainingRunway = p.balance > 0 ? (p.balance / burn) : 0;
    const critical = p.balance <= burn * 3;
    const zoomed = proj.slice(Math.max(0, idx - 3), Math.min(proj.length, idx + 4)).map((x) => ({ x: x.m, y: Math.max(0, x.balance) }));
    openDetail({
      kicker: "Cash projection · " + cashOutLabel(monthsFromNow),
      title: (p.balance <= 0 ? "$0" : "$" + p.balance + "k") + " in bank",
      subtitle: monthsFromNow === 0 ? "Today's balance" : "In " + monthsFromNow + " month" + (monthsFromNow === 1 ? "" : "s") + " at $" + burn + "k/mo burn",
      bar: { label: "Cash remaining vs. today", value: Math.max(0, Math.round((p.balance / cash) * 100)) + "%", pct: Math.max(0, (p.balance / cash) * 100) },
      stats: [
        { label: "Balance", value: p.balance <= 0 ? "$0" : "$" + p.balance + "k", sub: monthsFromNow + " mo out" },
        { label: "Runway left", value: remainingRunway <= 0 ? "0 mo" : remainingRunway.toFixed(1) + "mo" },
        { label: "Alive?", value: remainingRunway >= 12 ? "Yes" : "No", sub: "12mo bar" },
      ],
      chart: {
        kind: "area",
        title: "Zoomed window",
        data: zoomed,
        name: "Cash ($k)",
        caption: "Cash balance from 3 months before to 3 months after this point.",
      },
      rows: [{
        heading: "At this point",
        items: [
          { k: "Cash balance", v: p.balance <= 0 ? "$0" : "$" + p.balance + "k", tone: p.balance <= 0 ? "red" : critical ? "amber" : "emerald", dot: true },
          { k: "Monthly burn", v: "$" + burn + "k", sub: adj + "% of base" + (hire ? " + hires" : ""), dot: true },
          { k: "Runway remaining", v: remainingRunway <= 0 ? "0 mo" : remainingRunway.toFixed(1) + " mo", tone: remainingRunway >= 12 ? "emerald" : remainingRunway >= 6 ? "amber" : "red", dot: true },
          { k: "Default alive?", v: remainingRunway >= 12 ? "Yes" : "No", tone: remainingRunway >= 12 ? "emerald" : "red", dot: true },
        ]
      }, {
        heading: "What this triggers",
        items: [
          { k: "Fundraise window", v: remainingRunway >= 9 ? "Comfortable" : remainingRunway >= 6 ? "Open now" : "Urgent", tone: remainingRunway >= 9 ? "emerald" : remainingRunway >= 6 ? "amber" : "red" },
          { k: "Investor optics", v: remainingRunway >= 12 ? "Strong" : remainingRunway >= 6 ? "OK" : "Tight", sub: "12+ months is the classic ask", tone: remainingRunway >= 12 ? "emerald" : remainingRunway >= 6 ? "amber" : "red" },
          { k: "Hiring plan", v: remainingRunway >= 12 ? "Green-light" : remainingRunway >= 6 ? "Freeze non-critical" : "Hard freeze", tone: remainingRunway >= 12 ? "emerald" : "amber" },
        ]
      }],
      actions: [
        { label: "Cut burn 20%", icon: TrendingDown, onClick: () => setAdj(Math.max(70, adj - 20)) },
        { label: "Model 2 hires", icon: Users, onClick: () => setHire(!hire), primary: !hire },
      ],
      note: p.balance <= 0
        ? "You'd hit zero here. Either raise before this month or cut burn to " + Math.max(20, Math.round(cash / (monthsFromNow + 6))) + "k/mo to stretch to a 6-month buffer."
        : critical
          ? "This is inside the 'must-have-closed-a-round' window. Investor conversations should be well underway before you're here."
          : "Comfortable. The rule of thumb is to start a round when you still have 9–12 months in the bank — right about now, in this scenario."
    });
  };

  return (
    <ModuleShell module={module}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <Stat icon={Wallet} label="Cash in bank" value={"$" + cash + "k"} sub="from Company Data" />
        <Stat icon={Activity} label="Scenario net burn" value={"$" + burn + "k/mo"} sub={"base $" + baseBurn + "k" + (hire ? " + hires $15k" : "")} tone="amber" />
        <Stat icon={Clock} label="Runway" value={runway.toFixed(1) + " mo"} sub={"cash-out ~" + cashOutLabel(runway)} tone={runwayTone} />
        <Stat icon={TrendingUp} label="Default alive?" value={runway >= 12 ? "Yes" : "Not yet"} sub={runway >= 12 ? "12+ months at scenario burn" : "raise or cut before month " + Math.floor(runway)} tone={runway >= 12 ? "emerald" : "red"} />
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        <ChartCard title="Cash balance projection" sub="Click any month for a full breakdown" right={<Badge tone={runwayTone}>{runway.toFixed(1)} months</Badge>}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={proj} margin={{ top: 5, right: 5, left: -14, bottom: 0 }} onClick={(e) => e && e.activeTooltipIndex != null && drillCash(e.activeTooltipIndex)}>
                <defs>
                  <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={RED} stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => "$" + v + "k"} cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="balance" name="Cash ($k)" stroke={BLUE} strokeWidth={2.5} fill="url(#cashFill)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                <span>What-if: adjust monthly burn</span><span className="text-violet-700">{adj}% of base</span>
              </div>
              <input type="range" min="70" max="130" value={adj} onChange={(e) => setAdj(+e.target.value)} className="w-full accent-violet-600" />
              <div className="flex justify-between text-[10px] font-semibold text-slate-400"><span>Cut 30%</span><span>Base</span><span>Spend +30%</span></div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <button onClick={() => setHire(!hire)} className={"w-11 h-6 rounded-full transition relative " + (hire ? "bg-violet-600" : "bg-gray-300")} aria-label="Toggle hiring scenario">
                <span className={"absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all " + (hire ? "left-[22px]" : "left-0.5")} />
              </button>
              <span className="text-sm font-semibold text-slate-700">Hire 2 engineers <span className="text-slate-400 font-medium">(+$15k/mo fully loaded)</span></span>
            </label>
          </div>
        </ChartCard>

        <ChartCard title="Historical cash flow" sub="Money in vs. money out · $k">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MONTHS} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => "$" + v + "k"} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="Cash in" fill={GREEN} radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Cash out" fill="var(--fg-faint)" radius={[6, 6, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-1"><Sparkles size={14} className="text-amber-600" /><span className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Co-founder read</span></div>
            <p className="text-sm text-slate-700 leading-relaxed">Fundraising rule of thumb: start a round with 12+ months of runway. At base burn you're at 9.5 — either move burn to ≤ $44k (the 70% slider) or open the round now while metrics are trending up.</p>
          </div>
        </ChartCard>
      </div>
    </ModuleShell>
  );
}
function cashOutLabel(months) {
  const names = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan '27", "Feb '27", "Mar '27", "Apr '27", "May '27", "Jun '27", "Jul '27", "Aug '27", "Sep '27", "Oct '27", "Nov '27", "Dec '27", "Jan '28", "Feb '28"];
  return names[Math.min(names.length - 1, Math.max(0, Math.round(months)))];
}

// ------------------------------------------- module 7: unit economics ------
function UnitEconModule({ module, company }) {
  const [arpu, setArpu] = useState(company?.arpu > 0 ? company.arpu : 39);
  const [gm, setGm] = useState(company?.gm > 0 ? company.gm : 78);
  const [churn, setChurn] = useState(company?.churn > 0 ? company.churn : 3.2);
  const [cac, setCac] = useState(company?.cac > 0 ? company.cac : 142);
  const { openDetail } = useTheme();

  const ltv = churn > 0 ? (arpu * (gm / 100)) / (churn / 100) : Infinity;
  const ratio = cac > 0 ? ltv / cac : Infinity;
  const payback = arpu * (gm / 100) > 0 ? cac / (arpu * (gm / 100)) : Infinity;
  const verdict = ratio >= 3
    ? { tone: "emerald", label: "Healthy", note: "LTV:CAC ≥ 3 — the classic 'go pour fuel on it' zone. Growth spend is earning its keep." }
    : ratio >= 1.5
      ? { tone: "amber", label: "Workable, watch it", note: "You're recouping acquisition cost, but there's little margin for error. Push ARPU or churn before scaling spend." }
      : { tone: "red", label: "Underwater", note: "Each customer costs more than they return. Fix retention or pricing before spending another dollar on acquisition." };

  const drillCacLtv = (metric) => {
    if (metric === "CAC") {
      openDetail({
        kicker: "Unit economics · CAC",
        title: "$" + Math.round(cac) + " to acquire one customer",
        subtitle: "Blended across paid, content, and outbound",
        bar: { label: "CAC vs. LTV ($" + Math.round(ltv) + ")", value: Math.round((cac / ltv) * 100) + "%", pct: Math.min(100, (cac / ltv) * 100) },
        stats: [
          { label: "CAC", value: "$" + Math.round(cac) },
          { label: "Payback", value: payback.toFixed(1) + " mo", tone: payback <= 12 ? "emerald" : "amber" },
          { label: "Target", value: "≤ $120", sub: "Sales-led SaaS" },
        ],
        chart: {
          kind: "bar",
          title: "CAC by acquisition channel",
          data: [
            { x: "Referral", y: 34 },
            { x: "Content", y: 88 },
            { x: "SEO", y: 92 },
            { x: "LinkedIn", y: 168 },
            { x: "Google", y: 210 },
            { x: "Outbound", y: 265 },
          ],
          name: "CAC ($)",
          caption: "Referral is 6× cheaper than outbound. Every dollar you shift to referral programs compounds against the blended CAC.",
        },
        rows: [{
          heading: "What's in CAC",
          items: [
            { k: "Paid ads", v: "$68", sub: "48% of blended", tone: "amber", dot: true },
            { k: "Sales team fully loaded", v: "$44", sub: "31%", dot: true },
            { k: "Content + SEO", v: "$18", sub: "13%", tone: "emerald", dot: true },
            { k: "Tools & attribution", v: "$12", sub: "8%", dot: true },
          ]
        }],
        note: "Cutting CAC $30 by shifting mix to referral would move LTV:CAC from " + ratio.toFixed(1) + "× to " + (ltv / Math.max(1, cac - 30)).toFixed(1) + "× — a bigger lift than a 10% price rise."
      });
    } else {
      openDetail({
        kicker: "Unit economics · LTV",
        title: "$" + Math.round(ltv) + " per customer lifetime",
        subtitle: "ARPU × gross margin ÷ churn",
        bar: { label: "LTV vs. 3× CAC target", value: Math.round((ltv / (cac * 3)) * 100) + "%", pct: Math.min(100, (ltv / (cac * 3)) * 100) },
        stats: [
          { label: "LTV", value: "$" + Math.round(ltv), tone: "emerald" },
          { label: "Life expectancy", value: (1 / (churn / 100)).toFixed(1) + " mo" },
          { label: "Ratio", value: ratio.toFixed(1) + "×", tone: verdict.tone },
        ],
        chart: {
          kind: "line",
          title: "LTV sensitivity to churn",
          data: [1, 2, 3, 4, 5, 6, 7, 8].map((c) => ({ x: c + "%", y: Math.round((arpu * (gm / 100)) / (c / 100)) })),
          name: "LTV ($)",
          caption: "This curve is why every point of churn matters — the return on retention work is enormous at the low end.",
        },
        rows: [{
          heading: "The math",
          items: [
            { k: "ARPU", v: "$" + arpu + "/mo", sub: "avg. across plans", dot: true },
            { k: "× Gross margin", v: gm + "%", sub: "COGS / infra / support", dot: true, tone: "emerald" },
            { k: "÷ Monthly churn", v: churn + "%", sub: "compounding drag", dot: true, tone: churn <= 3 ? "emerald" : "amber" },
            { k: "= LTV", v: "$" + Math.round(ltv), tone: "emerald" },
          ]
        }, {
          heading: "Levers, ranked by impact",
          items: [
            { k: "Cut churn 1pp", v: "+$" + Math.round((arpu * (gm / 100)) / ((churn - 1) / 100) - ltv), tone: "emerald" },
            { k: "Raise ARPU 15%", v: "+$" + Math.round(ltv * 0.15), tone: "emerald" },
            { k: "Improve GM 5pp", v: "+$" + Math.round(ltv * (5 / gm)), tone: "emerald" },
          ]
        }],
        note: "Churn is your top lever by a wide margin. Every 1pp reduction is worth more than any single-shot pricing move — and it compounds."
      });
    }
  };

  const slider = (label, val, set, min, max, step, fmt) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="text-sm font-extrabold text-slate-900">{fmt(val)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} className="w-full accent-violet-600" />
    </div>
  );

  const barData = [
    { name: "CAC", value: Math.round(cac), fill: "var(--danger)" },
    { name: "LTV", value: Math.round(ltv), fill: GREEN },
  ];

  return (
    <ModuleShell module={module}>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-5 space-y-5">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Your inputs</h3>
            <p className="text-xs text-slate-400 mt-0.5">Drag the sliders — everything recalculates live.</p>
          </div>
          {slider("ARPU / month", arpu, setArpu, 5, 200, 1, (v) => "$" + v)}
          {slider("Gross margin", gm, setGm, 30, 95, 1, (v) => v + "%")}
          {slider("Monthly churn", churn, setChurn, 0.5, 12, 0.1, (v) => v.toFixed(1) + "%")}
          {slider("CAC", cac, setCac, 20, 800, 2, (v) => "$" + v)}
          <div className="rounded-xl bg-gray-100 p-3.5 text-xs text-slate-500 leading-relaxed">
            Defaults are Acme Metrics' live numbers. LTV = ARPU × margin ÷ churn; payback = CAC ÷ monthly gross profit per customer.
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat icon={DollarSign} label="Customer LTV" value={"$" + Math.round(ltv).toLocaleString()} tone="emerald" sub="lifetime gross profit" />
            <Stat icon={Activity} label="LTV : CAC" value={ratio.toFixed(1) + "×"} tone={verdict.tone === "red" ? "red" : verdict.tone === "amber" ? "amber" : "emerald"} sub="target ≥ 3×" />
            <Stat icon={Clock} label="CAC payback" value={payback.toFixed(1) + " mo"} tone="blue" sub="target ≤ 12 mo" />
          </div>

          <ChartCard title="CAC vs. LTV" sub="Click either bar for a full walk-through" right={<Badge tone={verdict.tone}>{verdict.label}</Badge>}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 0 }} onClick={(e) => e && e.activeTooltipIndex != null && drillCacLtv(barData[e.activeTooltipIndex].name)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: SLATE }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={44} tick={{ fontSize: 12, fill: "var(--fg-2)", fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => "$" + v.toLocaleString()} cursor={{ fill: "var(--brand-soft-bg)" }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={"mt-4 rounded-xl border p-4 " + (verdict.tone === "emerald" ? "border-emerald-200 bg-emerald-50" : verdict.tone === "amber" ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50")}>
              <div className="flex items-center gap-2 mb-1"><Sparkles size={14} className="text-slate-600" /><span className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Co-founder read</span></div>
              <p className="text-sm text-slate-700 leading-relaxed">{verdict.note}</p>
            </div>
          </ChartCard>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2"><TrendingUp size={15} className="text-violet-600" /><h4 className="text-sm font-extrabold text-slate-900">Fastest lever: ARPU</h4></div>
              <p className="text-xs text-slate-500 leading-relaxed">A 15% price increase on new customers lifts LTV to ${Math.round((arpu * 1.15 * (gm / 100)) / (churn / 100)).toLocaleString()} with zero extra spend. Historically &lt;5% of SaaS buyers push back at that level.</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-2"><TrendingDown size={15} className="text-emerald-500" /><h4 className="text-sm font-extrabold text-slate-900">Compounding lever: churn</h4></div>
              <p className="text-xs text-slate-500 leading-relaxed">Cutting churn from {churn.toFixed(1)}% to {Math.max(0.5, churn - 1).toFixed(1)}% raises LTV to ${Math.round((arpu * (gm / 100)) / (Math.max(0.5, churn - 1) / 100)).toLocaleString()} — pair this with the Churn Prediction module's save plays.</p>
            </Card>
          </div>
        </div>
      </div>
    </ModuleShell>
  );
}

// --------------------------------------------- module 8: compliance --------
function ComplianceModule({ module }) {
  const [groups, setGroups] = useState(COMPLIANCE_INIT.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i })) })));
  const toggle = (gi, ii) => setGroups((gs) => gs.map((g, a) => a !== gi ? g : { ...g, items: g.items.map((it, b) => b !== ii ? it : { ...it, done: !it.done }) }));

  const all = groups.flatMap((g) => g.items);
  const done = all.filter((i) => i.done).length;
  const pct = Math.round((done / all.length) * 100);
  const upcoming = groups.flatMap((g) => g.items.filter((i) => !i.done && i.due).map((i) => ({ ...i, group: g.title }))).sort((a, b) => (a.due === "Aug 7" ? -1 : 1));

  return (
    <ModuleShell module={module}>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-extrabold text-slate-900">Overall readiness</h3>
              <span className="text-sm font-extrabold text-slate-900">{done}/{all.length} · {pct}%</span>
            </div>
            <Progress v={pct} tone={pct >= 80 ? "emerald" : pct >= 55 ? "blue" : "amber"} />
            <p className="text-xs text-slate-400 mt-2">Tick items as you complete them — deadlines update on the right. This checklist is tuned for an Indian private limited company with EU users (DPDP + GDPR).</p>
          </Card>

          {groups.map((g, gi) => {
            const gDone = g.items.filter((i) => i.done).length;
            return (
              <Card key={g.title} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-extrabold text-slate-900">{g.title}</h4>
                  <Badge tone={gDone === g.items.length ? "emerald" : "slate"}>{gDone}/{g.items.length}</Badge>
                </div>
                <div className="space-y-1.5">
                  {g.items.map((it, ii) => (
                    <button key={it.t} onClick={() => toggle(gi, ii)} className={"w-full flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition " + (it.done ? "border-emerald-100 bg-emerald-50/60" : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/40")}>
                      <span className={"w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition " + (it.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent")}><Check size={13} /></span>
                      <span className={"flex-1 text-sm font-semibold " + (it.done ? "text-slate-400 line-through" : "text-slate-700")}>{it.t}</span>
                      {it.due && !it.done && <Badge tone={it.due === "Aug 7" ? "red" : "amber"}>{it.due === "Aug 7" ? "Due today" : "Due " + it.due}</Badge>}
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Clock size={15} className="text-red-500" /><h4 className="text-sm font-extrabold text-slate-900">Upcoming deadlines</h4></div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing pending - you're clear.</p>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map((u) => (
                  <div key={u.t} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">{u.group}</span>
                      <Badge tone={u.due === "Aug 7" ? "red" : "amber"}>{u.due}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{u.t}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-5 bg-violet-600 text-white border-violet-600">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={15} /><h4 className="text-sm font-extrabold">Ask your co-founder</h4></div>
            <p className="text-xs text-violet-100 leading-relaxed">Not sure what "TDS deposited for contractor payouts" involves, or whether GDPR applies to you? Open the assistant (bottom-right) and ask in plain language — it knows this checklist.</p>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

// --------------------------------------------- module 9: automation --------
function AutomationModule({ module }) {
  const [sel, setSel] = useState(PROCESSES[1]);
  const [rate, setRate] = useState(28);
  const [tool, setTool] = useState(120);

  const hrsSaved = sel.hrs * (sel.potential / 100);
  const monthlyGross = hrsSaved * 4.33 * rate;
  const net = monthlyGross - tool;
  const annual = net * 12;
  const roiX = tool > 0 ? monthlyGross / tool : Infinity;

  return (
    <ModuleShell module={module}>
      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 p-5">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Manual process scan</h3>
          <p className="text-xs text-slate-400 mb-4">Six workflows your team runs by hand every week. Click one to model its ROI.</p>
          <div className="space-y-2">
            {PROCESSES.map((p) => (
              <button key={p.id} onClick={() => setSel(p)} className={"w-full rounded-xl border p-3.5 text-left transition " + (sel.id === p.id ? "border-violet-300 bg-violet-50/60 shadow-sm" : "border-gray-200 bg-white hover:border-violet-200")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-800 truncate">{p.name}</div>
                    <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{p.dept} · {p.hrs} hrs/week manual</div>
                  </div>
                  <Badge tone={p.potential >= 85 ? "emerald" : p.potential >= 75 ? "blue" : "slate"}>{p.potential}% automatable</Badge>
                </div>
                <div className="mt-2.5"><Progress v={p.potential} tone={p.potential >= 85 ? "emerald" : "blue"} /></div>
              </button>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1"><Zap size={15} className="text-amber-500" /><h3 className="text-sm font-extrabold text-slate-900">ROI model — {sel.name}</h3></div>
            <p className="text-xs text-slate-400 mb-4">Tune the assumptions for your team.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Field label="Loaded cost / hr ($)" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value) || 0)} />
              <Field label="Tooling cost / mo ($)" type="number" value={tool} onChange={(e) => setTool(Number(e.target.value) || 0)} />
            </div>
            <div className="space-y-2.5">
              {[
                ["Hours back / week", hrsSaved.toFixed(1) + " hrs"],
                ["Gross saving / month", "$" + Math.round(monthlyGross).toLocaleString()],
                ["Net saving / month", "$" + Math.round(net).toLocaleString()],
                ["Net saving / year", "$" + Math.round(annual).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-xl bg-gray-100 px-3.5 py-2.5">
                  <span className="text-xs font-bold text-slate-500">{k}</span>
                  <span className="text-sm font-extrabold text-slate-900">{v}</span>
                </div>
              ))}
              <div className={"flex items-center justify-between rounded-xl px-3.5 py-3 " + (roiX >= 2 ? "bg-emerald-500" : roiX >= 1 ? "bg-amber-500" : "bg-red-500")}>
                <span className="text-xs font-extrabold uppercase tracking-wide text-white/90">Return on tooling spend</span>
                <span className="text-base font-black text-white">{roiX.toFixed(1)}×</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2"><Lightbulb size={15} className="text-violet-600" /><h4 className="text-sm font-extrabold text-slate-900">Advisor's take</h4></div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {sel.id === "p2" ? "Invoice chasing is the single best candidate on the board — 90% automatable with dunning sequences in Stripe Billing or Chargebee, and it directly pulls cash forward. Ship this first." :
               sel.id === "p1" ? "Start with auto-triage and suggested replies, keep a human on the send button for a month, then graduate the top intents to full automation." :
               sel.id === "p3" ? "A form-to-CRM integration kills this entirely. The hidden win is data quality — scored leads (Track 3) get sharper when entry is consistent." :
               "Solid candidate. Sequence it after the two highest-potential processes — automation compounds, but so does maintenance burden, so ship in order of ROI."}
            </p>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

// ---------------------------------------------- module 10: copilot ---------
function CopilotModule({ module }) {
  return (
    <ModuleShell module={module} noChat>
      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <ChatWidget
            module={module}
            embedded
            quickPrompts={[
              "Draft my August investor update",
              "How do I position against MetricHive?",
              "Plan my next 3 hires given 9.5 months runway",
              "Summarize my biggest risk right now",
            ]}
          />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><Globe size={15} className="text-violet-600" /><h4 className="text-sm font-extrabold text-slate-900">Competitor snapshot</h4></div>
            <div className="space-y-2.5">
              {COMPETITORS.map((c) => (
                <div key={c.name} className="rounded-xl border border-gray-200 p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-extrabold text-slate-800">{c.name}</span>
                    <Badge tone="slate">{c.pricing}</Badge>
                  </div>
                  <p className="text-xs text-slate-500"><span className="font-bold text-emerald-600">Strong:</span> {c.strength}</p>
                  <p className="text-xs text-slate-500 mt-0.5"><span className="font-bold text-red-500">Gap:</span> {c.gap}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3"><BarChart3 size={15} className="text-emerald-500" /><h4 className="text-sm font-extrabold text-slate-900">Research briefs on tap</h4></div>
            <div className="space-y-2">
              {[
                "TAM/SAM/SOM sizing for founder-ops software",
                "Pricing teardown: per-seat vs. flat vs. usage",
                "Landscape scan: AI copilots for SMB finance",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2.5 rounded-xl bg-gray-100 px-3.5 py-2.5">
                  <Check size={14} className="text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600">{t}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Ask for any of these in the chat — the copilot answers with your live company context baked in.</p>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

// ------------------------------------------------------------- app root ----

// =============================================================================
// New modules: Tasks, Meetings, Clients, Investors, Company Data
// =============================================================================

// -------------------------------------------- module: Delegate & Tasks -----
const TEAM_ROSTER = ["Aarav", "Sofia", "Ken", "Riya"];

function TasksModule({ module, user, company }) {
  const { items: fsT, add: fsAdd, update: fsUpdate, remove: fsRemove } = useUserCollection(user, "founder_tasks");
  const tasks = fsT || [];
  const [filter, setFilter] = useState("all");
  const [newTitle, setNewTitle] = useState("");
  const [newOwner, setNewOwner] = useState("ai");
  const [newDue, setNewDue] = useState("");
  const [newPri, setNewPri] = useState("Med");

  const advance = (id) => { const t = tasks.find((x) => x.id === id); if (t) fsUpdate(id, { status: t.status === "todo" ? "in_progress" : "done" }); };
  const remove = (id) => fsRemove(id);
  const add = () => {
    if (!newTitle.trim()) return;
    fsAdd({ title: newTitle.trim(), owner: newOwner, due: newDue || "TBD", priority: newPri, status: "todo", note: newOwner === "ai" ? "Assigned to your AI co-founder — result will appear here." : "Assigned to " + newOwner + "." });
    setNewTitle(""); setNewDue("");
  };
  const shown = tasks.filter((t) => filter === "all" ? true : filter === "ai" ? t.owner === "ai" : filter === "mine" ? t.owner === user.name.split(" ")[0] : t.status === filter);

  const counts = {
    ai: tasks.filter((t) => t.owner === "ai" && t.status !== "done").length,
    open: tasks.filter((t) => t.status !== "done").length,
    doneToday: tasks.filter((t) => t.status === "done").length,
  };

  const priTone = { High: "red", Med: "amber", Low: "slate" };
  const statusMeta = {
    todo: { tone: "slate", label: "To do", icon: Circle },
    in_progress: { tone: "blue", label: "In progress", icon: PlayCircle },
    done: { tone: "emerald", label: "Done", icon: CheckCircle2 },
  };

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Stat icon={Bot} label="Assigned to co-founder" value={String(counts.ai)} sub="running in background" tone="blue" />
        <Stat icon={ListChecks} label="Open tasks" value={String(counts.open)} sub="across team + AI" />
        <Stat icon={CheckCircle2} label="Closed" value={String(counts.doneToday)} tone="emerald" />
      </div>

      <Card className="p-5 mb-5">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">Delegate a new task</h3>
        <div className="grid md:grid-cols-12 gap-2.5">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="What needs doing? e.g. 'Draft a cold outreach sequence for RevOps leaders'" className="md:col-span-5 rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          <select value={newOwner} onChange={(e) => setNewOwner(e.target.value)} className="md:col-span-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm">
            <option value="ai">AI Co-founder</option>
            {TEAM_ROSTER.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <input value={newDue} onChange={(e) => setNewDue(e.target.value)} placeholder="Aug 15" className="md:col-span-2 rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
          <select value={newPri} onChange={(e) => setNewPri(e.target.value)} className="md:col-span-1 rounded-xl border border-gray-300 px-2 py-2.5 text-sm">
            <option>High</option><option>Med</option><option>Low</option>
          </select>
          <button onClick={add} className="md:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-3 py-2.5"><Plus size={16} /> Assign</button>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">Tasks assigned to <span className="font-bold text-violet-600">AI Co-founder</span> get picked up in the background and appear here with a suggested output for your review. Tasks assigned to teammates show up in their inbox.</p>
      </Card>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {[["all", "All"], ["ai", "Co-founder only"], ["todo", "To do"], ["in_progress", "In progress"], ["done", "Done"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={"text-xs font-bold px-3 py-1.5 rounded-full border transition " + (filter === k ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-300 text-slate-600 hover:border-violet-300")}>{l}</button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.map((t) => {
          const S = statusMeta[t.status];
          return (
            <Card key={t.id} className="p-4">
              <div className="flex items-start gap-3">
                <button onClick={() => advance(t.id)} className="mt-0.5 shrink-0" title="Advance status">
                  <S.icon size={18} className={t.status === "done" ? "text-emerald-500" : t.status === "in_progress" ? "text-violet-600" : "text-slate-400"} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={"text-sm font-bold " + (t.status === "done" ? "text-slate-400 line-through" : "text-slate-900")}>{t.title}</span>
                    <Badge tone={priTone[t.priority]}>{t.priority}</Badge>
                    {t.owner === "ai" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5"><Bot size={11} /> AI Co-founder</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5"><UserCheck size={11} /> {t.owner}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{t.note}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Due</div>
                    <div className="text-xs font-bold text-slate-700">{t.due}</div>
                  </div>
                  <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500" aria-label="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          );
        })}
        {shown.length === 0 && <Card className="p-8 text-center text-sm text-slate-400">Nothing here — try assigning something above.</Card>}
      </div>
    </ModuleShell>
  );
}

// ------------------------------------------ module: Meeting Command --------

function MeetingsModule({ module, company, user }) {
  const { items: fsMeet, add: addMeeting, remove: removeMeeting } = useUserCollection(user, "meetings");
  const meetings = fsMeet || [];
  const setMeetings = () => {};
  const [nmTitle, setNmTitle] = useState(""); const [nmWhen, setNmWhen] = useState("");
  async function createMeeting() {
    if (!nmTitle.trim()) return;
    await addMeeting({ title: nmTitle, when: nmWhen || "TBD", who: [], agenda: [], notes: "" });
    setNmTitle(""); setNmWhen("");
  }
  const [selId, setSelId] = useState(MEETINGS_INIT[0].id);
  const sel = meetings.find((m) => m.id === selId) || meetings[0];

  const [nT, setNT] = useState(""); const [nW, setNW] = useState(""); const [nWho, setNWho] = useState(""); const [nType, setNType] = useState("Client");
  const add = () => {
    if (!nT.trim()) return;
    const m = { id: "m" + Date.now(), title: nT.trim(), when: nW || "TBD", who: nWho || "TBD", type: nType, agenda: "", notes: "", prepped: false };
    setMeetings((ms) => [m, ...ms]); setSelId(m.id); setNT(""); setNW(""); setNWho("");
  };
  const updateSel = (patch) => setMeetings((ms) => ms.map((m) => m.id === selId ? { ...m, ...patch } : m));
  const typeTone = { Client: "blue", Investor: "amber", Internal: "slate" };

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Schedule a meeting</h3>
            <div className="space-y-2">
              <input value={nT} onChange={(e) => setNT(e.target.value)} placeholder="Meeting title" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
              <input value={nW} onChange={(e) => setNW(e.target.value)} placeholder="When (e.g. Fri Aug 15, 2 PM)" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
              <input value={nWho} onChange={(e) => setNWho(e.target.value)} placeholder="Attendees" className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
              <select value={nType} onChange={(e) => setNType(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm">
                <option>Client</option><option>Investor</option><option>Internal</option>
              </select>
              <button onClick={add} className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-3 py-2"><Plus size={16} /> Schedule</button>
            </div>
            <p className="text-[11px] text-slate-400 mt-3">Your co-founder auto-drafts an agenda and a prep brief for every meeting you schedule.</p>
          </Card>
          <div className="space-y-2">
            {meetings.map((m) => (
              <button key={m.id} onClick={() => setSelId(m.id)} className={"w-full rounded-xl border p-3.5 text-left transition " + (selId === m.id ? "border-violet-300 bg-violet-50/60 shadow-sm" : "border-gray-200 bg-white hover:border-violet-200")}>
                <div className="flex items-center justify-between gap-2 mb-1"><Badge tone={typeTone[m.type]}>{m.type}</Badge>{m.prepped && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 size={11} /> Prepped</span>}</div>
                <div className="text-sm font-extrabold text-slate-800 truncate">{m.title}</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{m.when} · {m.who}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge tone={typeTone[sel.type]}>{sel.type}</Badge>
              <h3 className="text-lg font-extrabold text-slate-900">{sel.title}</h3>
            </div>
            <div className="text-xs text-slate-500 mb-4">{sel.when} · {sel.who}</div>
            <div className="mb-4">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Agenda</div>
              <textarea value={sel.agenda} onChange={(e) => updateSel({ agenda: e.target.value })} rows={5} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-mono focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Notes &amp; action items</div>
              <textarea value={sel.notes} onChange={(e) => updateSel({ notes: e.target.value })} rows={4} placeholder="Take notes here during the meeting — your co-founder can turn them into tasks and follow-up drafts." className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            </div>
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Btn variant="primary"><Video size={15} /> Start call</Btn>
              <Btn variant="soft"><Sparkles size={15} /> Ask co-founder to prep this</Btn>
              <Btn variant="ghost"><ListChecks size={15} /> Convert notes to tasks</Btn>
            </div>
          </Card>
          <Card className="p-5 bg-violet-600 text-white border-violet-600">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={15} /><h4 className="text-sm font-extrabold">Co-founder prep brief</h4></div>
            <p className="text-xs text-violet-100 leading-relaxed">Before every meeting, your co-founder pulls the relevant module data (deals, health, feedback, cap table) and stitches a one-screen brief. Open the chat and ask "prep me for {sel.title}".</p>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

// ------------------------------------------ module: Client Success Hub -----

function ClientsModule({ module, company, user }) {
  const { items: fsClients, add: addClient } = useUserCollection(user, "clients");
  const clients = fsClients || [];
  const setClients = () => {};
  const [ncName, setNcName] = useState(""); const [ncMrr, setNcMrr] = useState("");
  async function createClient() {
    if (!ncName.trim()) return;
    await addClient({ name: ncName, plan: "Starter", mrr: parseFloat(ncMrr) || 0, health: 80, owner: "You", next: "onboarding", notes: "" });
    setNcName(""); setNcMrr("");
  }
  const [selId, setSelId] = useState(CLIENTS_INIT[0].id);
  const [sortKey, setSortKey] = useState("mrr");
  const sorted = [...clients].sort((a, b) => sortKey === "mrr" ? b.mrr - a.mrr : sortKey === "health" ? a.health - b.health : a.name.localeCompare(b.name));
  const sel = clients.find((c) => c.id === selId) || clients[0];
  const updateSel = (patch) => setClients((cs) => cs.map((c) => c.id === selId ? { ...c, ...patch } : c));

  const totalMRR = clients.reduce((s, c) => s + c.mrr, 0);
  const atRisk = clients.filter((c) => c.health < 50).length;
  const avgHealth = Math.round(clients.reduce((s, c) => s + c.health, 0) / clients.length);
  const healthTone = (h) => h >= 80 ? "emerald" : h >= 60 ? "blue" : h >= 40 ? "amber" : "red";
  const planTone = { Starter: "slate", Growth: "blue", Scale: "emerald" };

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <Stat icon={DollarSign} label="Client-driven MRR" value={"$" + (totalMRR / 1000).toFixed(1) + "k"} sub={clients.length + " clients on this roster"} />
        <Stat icon={Activity} label="Avg. health score" value={avgHealth + "/100"} tone={healthTone(avgHealth)} />
        <Stat icon={AlertTriangle} label="At-risk clients" value={String(atRisk)} tone={atRisk > 0 ? "red" : "emerald"} sub="health < 50" />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Client roster</h3>
            <div className="flex items-center gap-1.5">
              {[["mrr", "MRR"], ["health", "Health"], ["name", "A→Z"]].map(([k, l]) => (
                <button key={k} onClick={() => setSortKey(k)} className={"text-[11px] font-bold px-2.5 py-1 rounded-full border transition " + (sortKey === k ? "bg-violet-600 border-violet-600 text-white" : "bg-white border-gray-300 text-slate-600 hover:border-violet-300")}>{l}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[520px]">
              <thead><tr className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-left"><th className="py-2 px-2">Client</th><th className="py-2 px-2">Plan</th><th className="py-2 px-2 text-right">MRR</th><th className="py-2 px-2">Health</th><th className="py-2 px-2">Owner</th></tr></thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id} onClick={() => setSelId(c.id)} className={"border-t border-gray-100 cursor-pointer transition " + (selId === c.id ? "bg-violet-50/60" : "hover:bg-gray-50")}>
                    <td className="py-2.5 px-2 font-bold text-slate-800">{c.name}</td>
                    <td className="py-2.5 px-2"><Badge tone={planTone[c.plan]}>{c.plan}</Badge></td>
                    <td className="py-2.5 px-2 text-right font-bold text-slate-700">${c.mrr.toLocaleString()}</td>
                    <td className="py-2.5 px-2"><div className="flex items-center gap-2"><span className={"text-xs font-extrabold text-" + (healthTone(c.health) === "emerald" ? "emerald" : healthTone(c.health) === "blue" ? "violet" : healthTone(c.health) === "amber" ? "amber" : "red") + "-600"}>{c.health}</span><div className="w-16"><Progress v={c.health} tone={healthTone(c.health)} /></div></div></td>
                    <td className="py-2.5 px-2 text-slate-600 text-xs font-semibold">{c.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2"><Badge tone={planTone[sel.plan]}>{sel.plan}</Badge><Badge tone={healthTone(sel.health)}>Health {sel.health}</Badge></div>
            <h4 className="text-lg font-extrabold text-slate-900">{sel.name}</h4>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-slate-500">MRR</span><span className="font-bold">${sel.mrr.toLocaleString()}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Owner</span><span className="font-bold">{sel.owner}</span></div>
              <div className="flex items-center justify-between"><span className="text-slate-500">Next touch</span><span className="font-bold">{sel.nextTouch}</span></div>
            </div>
            <div className="mt-4">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">Notes</div>
              <textarea value={sel.notes} onChange={(e) => updateSel({ notes: e.target.value })} rows={4} className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Btn variant="primary" celebrate="Touch logged"><MessageSquare size={14} /> Log a touch</Btn>
              <Btn variant="soft"><Sparkles size={14} /> Ask co-founder for a save play</Btn>
            </div>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

// -------------------------------------------- module: Fundraising CRM ------
const STAGES = [
  { id: "email", label: "First email sent", tone: "slate" },
  { id: "meeting", label: "Meeting scheduled", tone: "blue" },
  { id: "diligence", label: "In diligence", tone: "amber" },
  { id: "termsheet", label: "Term sheet", tone: "emerald" },
  { id: "pass", label: "Passed", tone: "red" },
];

function InvestorsModule({ module, company, user }) {
  const { items: fsInvs, add: addInv } = useUserCollection(user, "investors");
  const invs = fsInvs || [];
  const setInvs = () => {};
  const [niName, setNiName] = useState(""); const [niFirm, setNiFirm] = useState("");
  async function createInvestor() {
    if (!niName.trim()) return;
    await addInv({ name: niName, firm: niFirm || "-", stage: "Contacted", check: "-", fit: 70, last: "just added", next: "intro email" });
    setNiName(""); setNiFirm("");
  }
  const move = (id, sid) => setInvs((xs) => xs.map((x) => x.id === id ? { ...x, stage: sid } : x));
  const counts = STAGES.map((s) => ({ ...s, n: invs.filter((i) => i.stage === s.id).length }));

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {counts.map((s) => (
          <Card key={s.id} className="p-4 text-center">
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
            <div className={"text-2xl font-black " + (s.tone === "emerald" ? "text-emerald-600" : s.tone === "amber" ? "text-amber-600" : s.tone === "red" ? "text-red-500" : s.tone === "blue" ? "text-violet-600" : "text-slate-500")}>{s.n}</div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
        {STAGES.map((s) => (
          <Card key={s.id} className="p-4 bg-gray-50 border-gray-200 min-h-[220px]">
            <div className="flex items-center justify-between mb-3"><Badge tone={s.tone}>{s.label}</Badge><span className="text-xs font-bold text-slate-500">{invs.filter((i) => i.stage === s.id).length}</span></div>
            <div className="space-y-2">
              {invs.filter((i) => i.stage === s.id).map((i) => {
                const si = STAGES.findIndex((x) => x.id === i.stage);
                return (
                  <div key={i.id} className="rounded-xl bg-white border border-gray-200 p-3">
                    <div className="text-sm font-extrabold text-slate-800">{i.firm}</div>
                    <div className="text-[11px] font-semibold text-slate-500">{i.partner} · {i.check}</div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{i.note}</p>
                    <div className="mt-2 flex items-center gap-1">
                      {si > 0 && <button onClick={() => move(i.id, STAGES[si - 1].id)} className="p-1 rounded-md text-slate-400 hover:bg-gray-100" aria-label="Regress"><ChevronLeft size={13} /></button>}
                      {si < STAGES.length - 1 && <button onClick={() => move(i.id, STAGES[si + 1].id)} className="p-1 rounded-md text-slate-400 hover:bg-gray-100" aria-label="Advance"><ChevronRight size={13} /></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 mt-5 bg-violet-600 text-white border-violet-600">
        <div className="flex items-center gap-2 mb-2"><Sparkles size={15} /><h4 className="text-sm font-extrabold">Co-founder recommendation</h4></div>
        <p className="text-xs text-violet-100 leading-relaxed">Together Fund's verbal term sheet is your lead — anchor the round to their terms and use it to accelerate Sequoia and Blume. Ask me in chat to draft the "we have a lead, closing this month" nudge for each of them.</p>
      </Card>
    </ModuleShell>
  );
}

// ------------------------------------------- module: Company Data ----------
function CompanyModule({ module, company, setCompany }) {
  const set = (k) => (e) => setCompany({ ...company, [k]: k === "name" ? e.target.value : Number(e.target.value) });
  const runwayMo = company.netBurn > 0 ? (company.cash / company.netBurn).toFixed(1) : "∞";
  const ltv = company.churn > 0 ? Math.round((company.arpu * (company.gm / 100)) / (company.churn / 100)) : 0;

  const rows = [
    ["Company name", "name", "text", ""],
    ["MRR ($k)", "mrr", "number", "0.1"],
    ["MRR growth (% MoM)", "mrrGrowth", "number", "0.1"],
    ["Active customers", "customers", "number", "1"],
    ["Customer adds (this month)", "customerAdds", "number", "1"],
    ["Monthly churn (%)", "churn", "number", "0.1"],
    ["Net burn ($k / mo)", "netBurn", "number", "1"],
    ["Cash on hand ($k)", "cash", "number", "1"],
    ["CAC ($)", "cac", "number", "1"],
    ["ARPU ($ / mo)", "arpu", "number", "1"],
    ["Gross margin (%)", "gm", "number", "1"],
    ["NPS", "nps", "number", "1"],
  ];

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Master KPIs</h3>
          <p className="text-xs text-slate-500 mb-4">These twelve numbers are the source of truth. Change any of them and the Founder Dashboard, Runway module, and every co-founder answer read the new value on your next click.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map(([label, key, type, step]) => (
              <Field key={key} label={label} type={type} step={step || undefined} value={company[key]} onChange={set(key)} />
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h4 className="text-sm font-extrabold text-slate-900 mb-3">Derived instantly</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3.5 py-2.5"><span className="text-xs font-bold text-slate-500">Runway</span><span className="font-extrabold text-slate-900">{runwayMo} months</span></div>
              <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3.5 py-2.5"><span className="text-xs font-bold text-slate-500">LTV</span><span className="font-extrabold text-slate-900">${ltv.toLocaleString()}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3.5 py-2.5"><span className="text-xs font-bold text-slate-500">LTV : CAC</span><span className="font-extrabold text-slate-900">{company.cac > 0 ? (ltv / company.cac).toFixed(1) + "×" : "—"}</span></div>
              <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3.5 py-2.5"><span className="text-xs font-bold text-slate-500">ARR</span><span className="font-extrabold text-slate-900">${(company.mrr * 12).toFixed(0)}k</span></div>
            </div>
          </Card>
          <Card className="p-5 bg-violet-600 text-white border-violet-600">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={15} /><h4 className="text-sm font-extrabold">Try it</h4></div>
            <p className="text-xs text-violet-100 leading-relaxed">Change net burn to 40 and open the co-founder chat — the runway math and the advice both shift in real time. This is the mechanism behind every "live" answer in the platform.</p>
          </Card>
        </div>
      </div>
    </ModuleShell>
  );
}

// =============================================================================
// Profile / Feedback / Privacy modules
// =============================================================================
// =============================================================================
// AI INTERVIEW — the FAQ session that teaches the AI the whole company
// =============================================================================
const INTERVIEW_QUESTIONS = [
  { key: "what", q: "In your own words — what does your company do, and who is it for?" },
  { key: "problem", q: "What problem are you solving, and how do people deal with it today (without you)?" },
  { key: "competitors", q: "Who are your main competitors or alternatives? What makes you different?" },
  { key: "model", q: "How do you make money — pricing, plans, or business model?" },
  { key: "customers", q: "Tell me about your customers: how many, who's the typical one, how do you find them?" },
  { key: "team", q: "Who's on the team? Founders, key roles, headcount." },
  { key: "goals", q: "What's the single most important goal for the next 90 days?" },
  { key: "risks", q: "What's the biggest risk or challenge keeping you up at night?" },
  { key: "extra", q: "Anything else your AI co-founder should always keep in mind? (Type 'done' if nothing.)" },
];

// One place to talk to whichever model is configured. Returns "" on failure so
// callers can fall back rather than crash.
async function askAI(system, userText, maxTokens = 300) {
  try {
    if (AI_MODE === "puter") {
      const puter = await loadPuter();
      const result = await puter.ai.chat(
        [{ role: "system", content: system }, { role: "user", content: userText }],
        false,
        { model: PUTER_MODEL, max_tokens: maxTokens }
      );
      const out = typeof result === "string" ? result : (result?.message?.content ?? result?.text ?? "");
      return String(out).trim();
    }
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system, messages: [{ role: "user", content: userText }], max_tokens: maxTokens }),
    });
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() || "";
  } catch {
    return "";
  }
}

// Stage 1 of the answer gate: an instant, offline check that catches the
// obvious non-answers ("yoo", "asdf", "ok") with no round-trip.
const INTERVIEW_FILLER = new Set([
  "yo","yoo","yooo","hi","hii","hey","hello","ok","okay","k","kk","lol","lmao","haha","hmm","umm","um",
  "test","testing","asdf","asdfgh","qwerty","abc","xyz","blah","meh","idk","dunno","sure","yes","yeah",
  "yep","no","nope","nah","cool","nice","good","great","fine","whatever","anything","something","stuff",
]);

function localAnswerCheck(text) {
  const t = text.trim();
  const bare = t.toLowerCase().replace(/[^a-z\s]/g, " ").trim();
  if (/^(skip|pass|next|move on|n\/?a|none|nothing)$/i.test(t)) return "skip";
  const words = bare.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "empty";
  // No sequence of 3+ letters anywhere → keysmash or emoji-only.
  if (!/[a-z]{3}/.test(bare)) return "gibberish";
  if (words.every((w) => INTERVIEW_FILLER.has(w))) return "filler";
  if (words.length < 3) return "tooShort";
  return "ok";
}

const PROBE_BY_REASON = {
  gibberish: "I couldn't make sense of that one — could you write it out in a sentence or two?",
  filler: "I need a bit more to go on there.",
  tooShort: "That's a start — can you expand on it a little?",
  empty: "I didn't catch that.",
};

function InterviewModule({ module, user, company, setCompany }) {
  const { notify } = useTheme();
  const [attempts, setAttempts] = useState(0); // nudges spent on the current question
  const [thinking, setThinking] = useState(false);
  const [msgs, setMsgs] = useState(() => {
    const first = INTERVIEW_QUESTIONS[0].q;
    return [{ role: "assistant", text: "Hi" + (user?.name ? " " + user.name.split(" ")[0] : "") + " — I'm going to ask you " + INTERVIEW_QUESTIONS.length + " quick questions about " + (company?.name || "your startup") + ". Your answers become my permanent understanding of the company, so every future answer I give is grounded in them.\n\n" + first }];
  });
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [phase, setPhase] = useState(company?.aiProfile ? "done-before" : "asking"); // asking | synthesizing | done | done-before
  const [profile, setProfile] = useState(company?.aiProfile || "");
  const boxRef = useRef(null);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs, phase, thinking]);

  // Move to the next question (or synthesis), optionally prefixed by a short
  // reaction so it's obvious the answer was actually read.
  // `userMsg` is null when the caller has already appended it (the AI path
  // shows the reply before the model is consulted, so the UI isn't frozen).
  async function advance(nextAnswers, userMsg, lead) {
    setAttempts(0);
    setAnswers(nextAnswers);
    const tail = (t) => (userMsg ? [userMsg, t] : [t]);
    if (step < INTERVIEW_QUESTIONS.length - 1) {
      const nq = INTERVIEW_QUESTIONS[step + 1].q;
      setMsgs((m) => [...m, ...tail({ role: "assistant", text: (lead ? lead + "\n\n" : "") + nq })]);
      setStep(step + 1);
    } else {
      setMsgs((m) => [...m, ...tail({ role: "assistant", text: (lead ? lead + "\n\n" : "") + "Perfect — give me a moment to put this all together…" })]);
      setPhase("synthesizing");
      await synthesize(nextAnswers);
    }
  }

  async function submit() {
    const text = input.trim();
    if (!text || phase !== "asking" || thinking) return;
    setInput("");
    const q = INTERVIEW_QUESTIONS[step];
    const userMsg = { role: "user", text };

    // ---- stage 1: instant local gate --------------------------------------
    const local = localAnswerCheck(text);

    if (local === "skip") {
      await advance({ ...answers, [q.key]: "(skipped)" }, userMsg, "No problem — skipping that one.");
      return;
    }

    // Junk answer: push back instead of silently accepting it. After two
    // nudges take whatever they've given — the point is to interview them,
    // not to trap them behind a question they don't want to answer.
    if (local !== "ok" && attempts < 2) {
      setAttempts((a) => a + 1);
      const nudge = attempts === 0
        ? `${PROBE_BY_REASON[local]} ${q.q}`
        : `Still not quite enough for me to work with, but this is the last time I'll ask. ${q.q}\n\n(Type "skip" if you'd rather move on.)`;
      setMsgs((m) => [...m, userMsg, { role: "assistant", text: nudge }]);
      return;
    }

    if (local !== "ok") {
      // Two nudges spent — accept it and move on.
      await advance({ ...answers, [q.key]: text }, userMsg, "Alright, noted — let's keep going.");
      return;
    }

    // ---- stage 2: let the model judge a plausible-looking answer ----------
    setMsgs((m) => [...m, userMsg]);
    setThinking(true);
    const verdict = await askAI(
      "You are interviewing a startup founder. Decide whether their reply actually answers the question asked. " +
      "Reply with STRICT JSON only, no markdown fence: " +
      '{"ok": true|false, "reaction": "<=15 word acknowledgement referencing a specific detail they gave", "followUp": "one short question asking for what is missing"}. ' +
      'Set ok=false ONLY if the reply is off-topic, evasive, or has no usable content. A brief but genuine answer is ok=true. ' +
      'When ok=true, followUp must be "".',
      "Question: " + q.q + "\n\nFounder's reply: " + text,
      200
    );
    setThinking(false);

    let parsed = null;
    try {
      parsed = JSON.parse(verdict.replace(/^```(?:json)?|```$/g, "").trim());
    } catch { /* model unavailable or wandered off format */ }

    // No usable verdict → trust the local gate and accept. A broken AI must
    // never block someone from finishing the interview.
    if (!parsed || typeof parsed.ok !== "boolean") {
      await advance({ ...answers, [q.key]: text }, null, null);
      return;
    }

    if (!parsed.ok && attempts < 2) {
      setAttempts((a) => a + 1);
      setMsgs((m) => [...m, { role: "assistant", text: (parsed.followUp || "Could you say a little more about that?") + '\n\n(Type "skip" to move on.)' }]);
      return;
    }

    await advance({ ...answers, [q.key]: text }, null, parsed.reaction || null);
  }

  async function synthesize(a) {
    const qa = INTERVIEW_QUESTIONS.map((q) => "Q: " + q.q + "\nA: " + (a[q.key] || "-")).join("\n\n");
    let summary = "";
    const system = "You are compiling a company knowledge profile from a founder interview. Write a dense, factual 150-220 word profile in third person covering: what the company does and for whom, the problem and current alternatives, competitors and differentiation, business model, customers, team, 90-day goal, and key risks. No preamble, no headings — one tight paragraph. Use only the founder's own words as source; do not invent facts.";
    const userMsg = "Company name: " + (company?.name || "Unknown") + "\n\nInterview transcript:\n\n" + qa;
    summary = await askAI(system, userMsg, 500);
    if (!summary) {
      // fallback: store structured raw answers so the AI still gets everything
      summary = INTERVIEW_QUESTIONS.map((q) => q.key + ": " + (a[q.key] || "-")).join(" | ");
    }
    setProfile(summary);
    // persist
    try {
      const fb = await import("./firebase.js");
      if (user?.uid) await fb.saveAiProfile(user.uid, { aiProfile: summary, aiInterview: a });
    } catch (e) {
      notify({ tone: "error", title: "Profile saved locally only", body: "It's active for this session, but syncing to the cloud failed: " + (e?.message || e), duration: 7000 });
    }
    if (setCompany) setCompany((prev) => ({ ...prev, aiProfile: summary, aiInterview: a }));
    setMsgs((m) => [...m, { role: "assistant", text: "Done — here's what I now know about " + (company?.name || "your company") + ":\n\n" + summary + "\n\nFrom now on, every answer I give anywhere in GenCopilot is grounded in this. You can redo this interview anytime as things change." }]);
    setPhase("done");
  }

  function restart() {
    setAnswers({}); setStep(0); setPhase("asking"); setProfile("");
    setMsgs([{ role: "assistant", text: "Let's refresh my understanding. " + INTERVIEW_QUESTIONS[0].q }]);
  }

  const progress = phase === "asking" ? step / INTERVIEW_QUESTIONS.length : 1;

  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-0 flex flex-col overflow-hidden" style={{ minHeight: 480 }}>
          {/* progress */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2"><Sparkles size={15} className="text-violet-600" /> Company interview</span>
              <span className="text-xs font-bold text-slate-400">{phase === "asking" ? "Question " + (step + 1) + " of " + INTERVIEW_QUESTIONS.length : phase === "synthesizing" ? "Synthesizing…" : "Complete"}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-violet-600 transition-all" style={{ width: (progress * 100) + "%" }} />
            </div>
          </div>
          {/* messages */}
          <div ref={boxRef} className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: 420 }}>
            {msgs.map((m, i) => (
              <div key={i} className={"max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap " + (m.role === "user" ? "ml-auto chat-user-msg rounded-br-md" : "bg-gray-100 text-slate-700 rounded-bl-md")}>
                {m.text}
              </div>
            ))}
            {thinking && <div className="text-xs text-slate-400 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Reading your answer…</div>}
            {phase === "synthesizing" && <div className="text-xs text-slate-400 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Building your company profile…</div>}
          </div>
          {/* input */}
          <div className="p-4 border-t border-gray-200 flex gap-2">
            {phase === "asking" ? (
              <>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} rows={2} disabled={thinking} placeholder={thinking ? "Reading your answer…" : "Type your answer… (Enter to send)"} className="flex-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm resize-none focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-60" />
                <Btn variant="primary" className="px-4 self-end" onClick={submit} disabled={!input.trim() || thinking}><Send size={15} /></Btn>
              </>
            ) : (
              <Btn variant="ghost" className="mx-auto" onClick={restart}>{phase === "done-before" ? "Redo the interview" : "Start over"}</Btn>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-2"><Bot size={15} className="text-violet-600" /> What I currently know</h3>
          {profile ? (
            <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{profile}</p>
          ) : (
            <p className="text-sm text-slate-400">Nothing yet. Answer the questions and I'll build a permanent profile of {company?.name || "your company"} that grounds every AI answer across GenCopilot.</p>
          )}
          {company?.aiProfileAt && <p className="text-[11px] text-slate-400 mt-3">Profile saved to your workspace.</p>}
        </Card>
      </div>
    </ModuleShell>
  );
}

// =============================================================================
// NEWS — live headlines tailored to what the user is building
// =============================================================================
function NewsModule({ module, user, company }) {
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState(null);
  const [topic, setTopic] = useState("");

  // build a query from what they're building
  const defaultQuery = (company?.building || "startup SaaS venture") .split(/\s+/).slice(0, 6).join(" ");

  async function load(q) {
    setArticles(null); setError(null);
    try {
      const res = await fetch("/api/news?q=" + encodeURIComponent(q || defaultQuery));
      const data = await res.json();
      if (data.error && (!data.articles || data.articles.length === 0)) {
        setError(data.error);
        setArticles([]);
      } else {
        setArticles(data.articles || []);
      }
    } catch (e) {
      setError("Couldn't reach the news service.");
      setArticles([]);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 flex flex-wrap gap-2 items-center">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(topic)}
          placeholder={"Search news… (default: " + defaultQuery + ")"}
          className="flex-1 min-w-[180px] rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <Btn variant="primary" className="px-4 py-2.5 text-sm" onClick={() => load(topic)}><Search size={14} /> Search</Btn>
      </Card>

      {articles === null ? (
        <Card className="p-10 text-center text-sm text-slate-500">Fetching the latest headlines…</Card>
      ) : error && articles.length === 0 ? (
        <Card className="p-8 text-center">
          <Globe size={30} className="mx-auto text-violet-500 mb-3" />
          <div className="font-extrabold text-slate-900">News isn't set up yet</div>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">The news feed had a hiccup — it works without any API keys via public feeds, so just retry. For personalized topic search, add a free NEWS_API_KEY (newsdata.io) or GNEWS_API_KEY in Cloudflare.</p>
        </Card>
      ) : articles.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">No articles found for that search. Try broader terms.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {articles.map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer" className="block">
              <Card className="p-0 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                {a.image && <img src={a.image} alt="" className="w-full h-36 object-cover" onError={(e) => { e.target.style.display = "none"; }} />}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-xs font-bold text-violet-600 uppercase tracking-wide">{a.source}</div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1 leading-snug line-clamp-3">{a.title}</h3>
                  {a.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 flex-1">{a.description}</p>}
                  <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><Clock size={11} /> {a.pubDate ? timeAgo(new Date(a.pubDate)) : "recently"}</div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}

// =============================================================================
// COMMUNITY — live feed of founder posts with likes + comments
// =============================================================================
function timeAgo(ts) {
  if (!ts) return "just now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

// Firestore Timestamp | Date | millis -> Date, or null while a write is still
// pending (serverTimestamp() resolves to null on the local echo).
function toDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

// Clock time on a message bubble: "4:07 pm".
function clockTime(ts) {
  const d = toDate(ts);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase();
}

// Separator above the first message of each day.
function dayLabel(ts) {
  const d = toDate(ts);
  if (!d) return "";
  const today = new Date();
  const isSameDay = (a, b) => a.toDateString() === b.toDateString();
  if (isSameDay(d, today)) return "Today";
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (isSameDay(d, y)) return "Yesterday";
  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

function Avatar({ name, size = 40 }) {
  const initials = (name || "U").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size }} className="rounded-xl bg-violet-600 text-white flex items-center justify-center font-extrabold shrink-0" >
      <span style={{ fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}

function CommunityModule({ module, user, company }) {
  const [posts, setPosts] = useState(null);
  const [feedErr, setFeedErr] = useState(null);
  const [feedRetry, setFeedRetry] = useState(0);
  const [text, setText] = useState("");
  const [project, setProject] = useState("");
  const [tag, setTag] = useState("Building");
  const [busy, setBusy] = useState(false);
  const [openComments, setOpenComments] = useState(null);

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        unsub = fb.onCommunityFeed((rows, err) => {
          if (err) { setFeedErr(err?.message || String(err)); setPosts([]); }
          else { setFeedErr(null); setPosts(rows); }
        });
      } catch (e) { setFeedErr(e?.message || String(e)); setPosts([]); }
    })();
    return () => unsub && unsub();
  }, [feedRetry]);

  async function post() {
    if (!text.trim()) return alert("Write your post first.");
    if (!user?.uid) return alert("You're not signed in with a cloud account — log in to post.");
    setBusy(true);
    try {
      const fb = await import("./firebase.js");
      await fb.createPost(user, { text, projectName: project, tag });
      setText(""); setProject("");
    } catch (e) { alert("Couldn't post: " + (e?.message || "error")); }
    setBusy(false);
  }

  async function like(p) {
    try {
      const fb = await import("./firebase.js");
      await fb.toggleLike(p.id, user.uid, p.likes || []);
    } catch {}
  }

  async function remove(p) {
    if (!confirm("Delete this post?")) return;
    try { const fb = await import("./firebase.js"); await fb.deletePost(p.id); } catch {}
  }

  const tags = ["Building", "Launched", "Hiring", "Feedback wanted", "Milestone", "Question"];

  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      {/* composer */}
      <Card className="p-5 mb-5">
        <div className="flex gap-3">
          <Avatar name={user?.name} />
          <div className="flex-1 min-w-0">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={`What are you building, ${(user?.name || "founder").split(" ")[0]}?`} className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm resize-none focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Project name (optional)" className="flex-1 min-w-[140px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-violet-500 focus:outline-none" />
              <select value={tag} onChange={(e) => setTag(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs focus:border-violet-500 focus:outline-none">
                {tags.map((t) => <option key={t}>{t}</option>)}
              </select>
              <Btn variant="primary" className="px-4 py-1.5 text-xs" onClick={post} disabled={busy || !text.trim()}>{busy ? "Posting…" : "Post"} <Send size={13} /></Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* feed */}
      {posts === null ? (
        <Card className="p-10 text-center text-sm text-slate-500">Loading the community…</Card>
      ) : feedErr ? (
        <Card className="p-10 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-500 mb-3" />
          <div className="font-extrabold text-slate-900">Couldn't load the community</div>
          <div className="text-sm text-slate-500 mt-1 max-w-md mx-auto break-words">{feedErr}</div>
          <Btn variant="ghost" className="mt-4" onClick={() => { setPosts(null); setFeedErr(null); setFeedRetry((k) => k + 1); }}>Retry</Btn>
        </Card>
      ) : posts.length === 0 ? (
        <Card className="p-10 text-center">
          <Users size={32} className="mx-auto text-violet-500 mb-3" />
          <div className="font-extrabold text-slate-900">Be the first to post</div>
          <div className="text-sm text-slate-500 mt-1">Share what you're building and kick off the community.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => {
            const liked = (p.likes || []).includes(user?.uid);
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={p.authorName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900">{p.authorName}</span>
                      <span className="text-xs text-slate-400">{p.authorRole}</span>
                      <span className="text-xs text-slate-400">· {timeAgo(p.createdAt)}</span>
                      {p.tag && <Badge tone="blue" className="ml-auto">{p.tag}</Badge>}
                    </div>
                    {p.projectName && <div className="text-xs font-bold text-violet-600 mt-1">{p.projectName}</div>}
                    <p className="text-sm text-slate-700 mt-1.5 whitespace-pre-wrap break-words">{p.text}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <button onClick={() => like(p)} className={"flex items-center gap-1.5 text-xs font-semibold transition " + (liked ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}>
                        <Heart size={15} fill={liked ? "currentColor" : "none"} /> {(p.likes || []).length || 0}
                      </button>
                      <button onClick={() => setOpenComments(openComments === p.id ? null : p.id)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-violet-600 transition">
                        <MessageCircle size={15} /> {p.commentCount || 0}
                      </button>
                      {p.authorId === user?.uid && (
                        <button onClick={() => remove(p)} className="ml-auto text-xs text-slate-400 hover:text-red-500 transition">Delete</button>
                      )}
                    </div>
                    {openComments === p.id && <CommentThread postId={p.id} user={user} />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </ModuleShell>
  );
}

function CommentThread({ postId, user }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => {
    let unsub;
    (async () => {
      try { const fb = await import("./firebase.js"); unsub = fb.onComments(postId, setComments); }
      catch { setComments([]); }
    })();
    return () => unsub && unsub();
  }, [postId]);

  async function add() {
    if (!text.trim()) return;
    const t = text; setText("");
    try { const fb = await import("./firebase.js"); await fb.addComment(postId, user, t); } catch {}
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="space-y-3 mb-3">
        {(comments || []).map((c) => (
          <div key={c.id} className="flex gap-2.5">
            <Avatar name={c.authorName} size={28} />
            <div className="flex-1 min-w-0 rounded-xl bg-gray-100 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{c.authorName}</span>
                <span className="text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 break-words">{c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a comment…" className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none" />
        <Btn variant="primary" className="px-3 py-2 text-xs" onClick={add} disabled={!text.trim()}><Send size={13} /></Btn>
      </div>
    </div>
  );
}

// =============================================================================
// TALENT & HIRING — directory + direct messages
// =============================================================================
function TalentModule({ module, user, company }) {
  const [people, setPeople] = useState(null);
  const [dirErr, setDirErr] = useState(null);
  const [dirRetry, setDirRetry] = useState(0);
  const [filter, setFilter] = useState("all");
  const [dm, setDm] = useState(null); // person being messaged

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        unsub = fb.onTalentDirectory((rows, err) => {
          if (err) { setDirErr(err?.message || String(err)); setPeople([]); }
          else { setDirErr(null); setPeople(rows); }
        });
      } catch (e) { setDirErr(e?.message || String(e)); setPeople([]); }
    })();
    return () => unsub && unsub();
  }, [dirRetry]);

  const filtered = (people || []).filter((p) => {
    if (p.id === user?.uid) return false;
    if (filter === "open") return p.openToWork;
    if (filter === "hiring") return p.hiring;
    return p.openToWork || p.hiring;
  });

  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      <div className="flex flex-wrap gap-2 mb-5">
        {[["all", "Everyone"], ["open", "Open to work"], ["hiring", "Hiring"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={"px-3.5 py-1.5 rounded-full text-xs font-bold transition " + (filter === k ? "bg-violet-600 text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200")}>{l}</button>
        ))}
        <div className="ml-auto text-xs text-slate-400 self-center">Set your own status in My Profile →</div>
      </div>

      {people === null ? (
        <Card className="p-10 text-center text-sm text-slate-500">Loading directory…</Card>
      ) : dirErr ? (
        <Card className="p-10 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-500 mb-3" />
          <div className="font-extrabold text-slate-900">Couldn't load the directory</div>
          <div className="text-sm text-slate-500 mt-1 max-w-md mx-auto break-words">{dirErr}</div>
          <Btn variant="ghost" className="mt-4" onClick={() => { setPeople(null); setDirErr(null); setDirRetry((k) => k + 1); }}>Retry</Btn>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Briefcase size={32} className="mx-auto text-violet-500 mb-3" />
          <div className="font-extrabold text-slate-900">No one here yet</div>
          <div className="text-sm text-slate-500 mt-1">When founders mark themselves open to work or hiring, they'll show up here. Be the first — set your status in My Profile.</div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} className="p-5 flex flex-col">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} size={44} />
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-400 truncate">{p.headline || p.role || "Founder"}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.openToWork && <Badge tone="emerald">Open to work</Badge>}
                {p.hiring && <Badge tone="blue">Hiring</Badge>}
              </div>
              {p.skills && <div className="text-xs text-slate-500 mt-2.5 line-clamp-2">{p.skills}</div>}
              {p.location && <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><MapPin size={11} /> {p.location}</div>}
              <Btn variant="ghost" className="mt-4 w-full py-2 text-xs" onClick={() => setDm(p)}><MessageCircle size={14} /> Message</Btn>
            </Card>
          ))}
        </div>
      )}

      {dm && <DMPanel me={user} them={dm} onClose={() => setDm(null)} />}
    </ModuleShell>
  );
}

function DMPanel({ me, them, onClose }) {
  const { notify } = useTheme();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [subKey, setSubKey] = useState(0);
  const cidRef = useRef(null);
  const subDeadRef = useRef(false);
  const busyRef = useRef(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        const cid = fb.convoId(me.uid, them.id);
        cidRef.current = cid;
        unsub = fb.onDMThread(cid, (rows, err) => {
          // Before the first message the conversation doc doesn't exist, so the
          // rules reject this listener; it revives via subKey after first send.
          if (err) { subDeadRef.current = true; return; }
          subDeadRef.current = false;
          setMsgs(rows);
        });
      } catch { subDeadRef.current = true; }
    })();
    return () => unsub && unsub();
  }, [them.id, subKey]);

  async function send() {
    if (!text.trim() || busyRef.current) return;
    busyRef.current = true;
    const t = text; setText("");
    try {
      const fb = await import("./firebase.js");
      await fb.sendDM(me, them.id, t);
      if (subDeadRef.current) setSubKey((k) => k + 1); // conversation now exists — resubscribe
    } catch (e) {
      setText(t); // give the message back so it isn't lost
      notify({ tone: "error", title: "Message not sent", body: e?.message || String(e) });
    }
    busyRef.current = false;
  }

  // Escape closes, and the composer takes focus on open.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(t); };
  }, [onClose]);

  // Pin to the newest message whenever the thread grows.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={"Conversation with " + them.name}>
      <div className="absolute inset-0 gc-overlay-scrim" onClick={onClose} />
      <div className="gc-overlay-panel relative w-full max-w-md h-[min(560px,85vh)] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Avatar name={them.name} size={38} />
          <div className="min-w-0 flex-1">
            <div className="font-extrabold text-slate-900 truncate">{them.name}</div>
            <div className="text-xs text-slate-400 truncate">{them.headline || them.role || "Founder"}</div>
          </div>
          <button onClick={onClose} aria-label="Close conversation" className="p-1.5 rounded-lg hover:bg-black/5 transition"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scroll-thin">
          {msgs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
              <span className="w-11 h-11 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center"><MessageCircle size={20} /></span>
              <div className="text-sm font-bold text-slate-700">Say hello</div>
              <div className="text-xs text-slate-400">This is the start of your conversation with {them.name.split(" ")[0]}.</div>
            </div>
          )}
          {msgs.map((m, i) => {
            const mine = m.fromId === me.uid;
            // Day separator whenever the calendar date changes.
            const prev = i > 0 ? msgs[i - 1] : null;
            const dLabel = dayLabel(m.createdAt);
            const showDay = dLabel && (!prev || dayLabel(prev.createdAt) !== dLabel);
            return (
              <React.Fragment key={m.id}>
                {showDay && (
                  <div className="flex items-center gap-3 py-1.5" aria-hidden="true">
                    <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{dLabel}</span>
                    <span className="h-px flex-1" style={{ background: "var(--border)" }} />
                  </div>
                )}
                <div className={"flex flex-col " + (mine ? "items-end" : "items-start")}>
                  <div
                    className={
                      "gc-bubble gc-msg-in max-w-[80%] px-3.5 py-2 text-sm " +
                      (mine ? "gc-bubble-me bg-violet-600 text-white" : "gc-bubble-them bg-black/5 text-slate-700")
                    }
                  >
                    {m.text}
                  </div>
                  <time
                    className="text-[10px] text-slate-400 mt-1 px-1"
                    dateTime={toDate(m.createdAt)?.toISOString() || undefined}
                    title={toDate(m.createdAt)?.toLocaleString() || "Sending…"}
                  >
                    {clockTime(m.createdAt) || "sending…"}
                  </time>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--border)" }}>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            aria-label="Message"
            className="flex-1 rounded-xl border px-3.5 py-2.5 text-sm bg-white/70 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition"
            style={{ borderColor: "var(--border)" }}
          />
          <Btn variant="primary" className="px-3.5" onClick={send} disabled={!text.trim()} aria-label="Send"><Send size={15} /></Btn>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MESSAGES — all your DM conversations in one place
// =============================================================================
function MessagesModule({ module, user, company }) {
  const [convos, setConvos] = useState(null);
  const [convoErr, setConvoErr] = useState(null);
  const [convoRetry, setConvoRetry] = useState(0);
  const [profiles, setProfiles] = useState({}); // uid -> profile
  const [active, setActive] = useState(null); // {id: otherUid, name}

  useEffect(() => {
    if (!user?.uid) { setConvos([]); return; }
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        unsub = fb.onMyConversations(user.uid, async (list, err) => {
          if (err) { setConvoErr(err?.message || String(err)); setConvos([]); return; }
          setConvoErr(null);
          setConvos(list);
          // resolve the other participant's name for each convo
          const map = {};
          for (const c of list) {
            const other = (c.participants || []).find((p) => p !== user.uid);
            if (other && !profiles[other]) {
              try { const p = await fb.getPublicProfile(other); if (p) map[other] = p; } catch {}
            }
          }
          if (Object.keys(map).length) setProfiles((prev) => ({ ...prev, ...map }));
        });
      } catch (e) { setConvoErr(e?.message || String(e)); setConvos([]); }
    })();
    return () => unsub && unsub();
  }, [user?.uid, convoRetry]);

  function otherOf(c) {
    const uid = (c.participants || []).find((p) => p !== user.uid);
    return { id: uid, name: profiles[uid]?.name || "Founder", headline: profiles[uid]?.headline || profiles[uid]?.role };
  }

  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      {convos === null ? (
        <Card className="p-10 text-center text-sm text-slate-500">Loading your messages…</Card>
      ) : convoErr ? (
        <Card className="p-10 text-center">
          <AlertTriangle size={28} className="mx-auto text-red-500 mb-3" />
          <div className="font-extrabold text-slate-900">Couldn't load your messages</div>
          <div className="text-sm text-slate-500 mt-1 max-w-md mx-auto break-words">{convoErr}</div>
          <Btn variant="ghost" className="mt-4" onClick={() => { setConvos(null); setConvoErr(null); setConvoRetry((k) => k + 1); }}>Retry</Btn>
        </Card>
      ) : convos.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageCircle size={32} className="mx-auto text-violet-500 mb-3" />
          <div className="font-extrabold text-slate-900">No conversations yet</div>
          <div className="text-sm text-slate-500 mt-1">Find founders in Talent &amp; Hiring and start a conversation — they'll show up here.</div>
        </Card>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {convos.map((c) => {
            const o = otherOf(c);
            return (
              <button key={c.id} onClick={() => setActive(o)} className="w-full text-left">
                <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <Avatar name={o.name} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-slate-900 truncate">{o.name}</div>
                    <div className="text-xs text-slate-500 truncate">{c.lastMessage || "Say hello"}</div>
                  </div>
                  {c.lastAt && <div className="text-[11px] text-slate-400 shrink-0">{timeAgo(c.lastAt)}</div>}
                </Card>
              </button>
            );
          })}
        </div>
      )}
      {active && <DMPanel me={user} them={active} onClose={() => setActive(null)} />}
    </ModuleShell>
  );
}

// =============================================================================
// Profile (with hiring status) / Feedback / Privacy
// =============================================================================
function ProfileModule({ module, user, company }) {
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "Founder");
  const [headline, setHeadline] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");
  const [openToWork, setOpenToWork] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // load existing public profile
  useEffect(() => {
    (async () => {
      try {
        const fb = await import("./firebase.js");
        if (user?.uid) {
          const pub = await fb.getPublicProfile(user.uid);
          if (pub) {
            setHeadline(pub.headline || ""); setSkills(pub.skills || "");
            setLocation(pub.location || ""); setOpenToWork(!!pub.openToWork);
            setHiring(!!pub.hiring); if (pub.name) setName(pub.name); if (pub.role) setRole(pub.role);
          }
        }
      } catch {}
      setLoaded(true);
    })();
  }, [user]);

  async function save() {
    try {
      const fb = await import("./firebase.js");
      if (user?.uid) {
        await fb.updateUserProfile(user.uid, { name, role });
        await fb.savePublicProfile(user.uid, { name, role, headline, skills, location, openToWork, hiring });
      }
    } catch (e) { alert("Save failed: " + (e?.message || "error")); }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="p-6 flex flex-col items-center text-center">
          <Avatar name={name || email} size={80} />
          <div className="mt-4 text-lg font-extrabold text-slate-900 break-all">{name || "Your name"}</div>
          <div className="text-sm text-slate-500 break-all">{email}</div>
          {headline && <div className="text-xs text-slate-400 mt-1">{headline}</div>}
          <div className="flex flex-wrap gap-1.5 justify-center mt-3">
            <Badge tone="blue">{role}</Badge>
            {openToWork && <Badge tone="emerald">Open to work</Badge>}
            {hiring && <Badge tone="amber">Hiring</Badge>}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">Profile & hiring</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Field label="Email" value={email} disabled hint="Email can't be changed here." />
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100">
                <option>Founder</option><option>Co-founder</option><option>Engineer</option>
                <option>Designer</option><option>Team Member</option><option>Advisor</option>
              </select>
            </label>
            <Field label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            <div className="sm:col-span-2">
              <Field label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Building an AI ops platform · ex-Google" />
            </div>
            <div className="sm:col-span-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Skills</span>
                <textarea value={skills} onChange={(e) => setSkills(e.target.value)} rows={2} placeholder="React, Go, GCP, product strategy…" className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm resize-none focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
              </label>
            </div>
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <button onClick={() => setOpenToWork(!openToWork)} className={"flex items-center justify-between rounded-xl border px-4 py-3 transition " + (openToWork ? "border-emerald-400 bg-emerald-50" : "border-gray-300 bg-white hover:border-gray-400")}>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Briefcase size={15} /> Open to work</span>
              <span className={"w-9 h-5 rounded-full transition relative " + (openToWork ? "bg-emerald-500" : "bg-gray-300")}><span className={"absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all " + (openToWork ? "left-4" : "left-0.5")} /></span>
            </button>
            <button onClick={() => setHiring(!hiring)} className={"flex items-center justify-between rounded-xl border px-4 py-3 transition " + (hiring ? "border-violet-400 bg-violet-50" : "border-gray-300 bg-white hover:border-gray-400")}>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2"><Users size={15} /> Hiring</span>
              <span className={"w-9 h-5 rounded-full transition relative " + (hiring ? "bg-violet-500" : "bg-gray-300")}><span className={"absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all " + (hiring ? "left-4" : "left-0.5")} /></span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Turning either on lists you in the public Talent & Hiring directory where other founders can message you.</p>

          <div className="mt-5 flex items-center gap-3">
            <Btn variant="primary" onClick={save} disabled={!loaded}>Save profile</Btn>
            {saved && <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1"><Check size={15} /> Saved</span>}
          </div>
        </Card>
      </div>
    </ModuleShell>
  );
}

function FeedbackFormModule({ module, user, company }) {
  const [type, setType] = useState("Idea");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      const fb = await import("./firebase.js");
      await fb.saveContactSubmission({
        name: user?.name || "Anonymous",
        email: user?.email || "",
        type,
        message: msg,
        source: "in-app-feedback",
      });
    } catch {}
    setBusy(false);
    setSent(true);
    setMsg("");
  }

  if (sent) {
    return (
      <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
        <Card className="p-10 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto"><Check size={26} /></div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-4">Thanks for the feedback!</h3>
          <p className="text-sm text-slate-500 mt-2">We read every message. If it needs a reply, we'll reach out at {user?.email || "your email"}.</p>
          <Btn variant="ghost" className="mt-6" onClick={() => setSent(false)}>Send another</Btn>
        </Card>
      </ModuleShell>
    );
  }

  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      <Card className="p-6 max-w-2xl">
        <h3 className="text-sm font-extrabold text-slate-900 mb-1">Send us feedback</h3>
        <p className="text-xs text-slate-500 mb-4">Bug, idea, or just a thought — it goes straight to the team.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {["Idea", "Bug", "Praise", "Other"].map((t) => (
            <button key={t} onClick={() => setType(t)} className={"px-3.5 py-1.5 rounded-full text-xs font-bold transition " + (type === t ? "bg-violet-600 text-white" : "bg-gray-100 text-slate-600 hover:bg-gray-200")}>{t}</button>
          ))}
        </div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={6} placeholder="Tell us what's on your mind…" className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 transition resize-none" />
        <div className="mt-4">
          <Btn variant="primary" onClick={submit} disabled={busy || !msg.trim()}>{busy ? "Sending…" : "Submit feedback"} <Send size={14} /></Btn>
        </div>
      </Card>
    </ModuleShell>
  );
}

function PrivacyModule({ module, company }) {
  const sections = [
    ["What we collect", "Your account details (name, email), the company metrics you enter, and usage data needed to run the product. We don't sell your data or share it with advertisers."],
    ["How we use it", "To power your dashboards, generate AI co-founder responses, and improve the product. Your company metrics are used only to serve your own workspace."],
    ["AI processing", "When you use the co-founder chat, your prompt and relevant company context are sent to our AI provider to generate a response. Conversations aren't used to train third-party models."],
    ["Data storage", "Data is stored securely in Google Firebase (Firestore) with access controlled by authentication. Only you can read or write your workspace data."],
    ["Your rights", "You can view, edit, or delete your data at any time from the Company Data and Profile pages. To fully delete your account, contact us."],
    ["Contact", "Questions about privacy? Reach us at gencopilotfounder@gmail.com."],
  ];
  return (
    <ModuleShell module={module} noChat companyLine={companyLineFrom(company)}>
      <Card className="p-6 md:p-8 max-w-3xl">
        <h2 className="text-2xl font-extrabold text-slate-900">Privacy Policy</h2>
        <p className="text-sm text-slate-400 mt-1 mb-6">Last updated: August 2026</p>
        <div className="space-y-5">
          {sections.map(([h, b]) => (
            <div key={h}>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">{h}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </Card>
    </ModuleShell>
  );
}

// =============================================================================
// App root
// =============================================================================
const COMPANY_INIT = {
  name: "",
  mrr: 0, mrrGrowth: 0,
  customers: 0, customerAdds: 0,
  churn: 0,
  netBurn: 0, cash: 0,
  cac: 0, arpu: 0, gm: 0, nps: 0,
  building: "", stage: "",
  onboarded: false,
};

// Seed numbers for DEV_AUTOLOGIN so the dashboard has something to draw and
// Jarvis has something to talk about. Never used in a production build.
const DEV_COMPANY = {
  name: "Acme Metrics",
  building: "B2B SaaS analytics for product teams",
  stage: "Seed",
  mrr: 48.2, mrrGrowth: 7.4,
  customers: 1240, customerAdds: 86,
  churn: 3.2,
  netBurn: 56, cash: 530,
  cac: 142, arpu: 39, gm: 78, nps: 42,
  onboarded: true,
};

// =============================================================================
// Onboarding — asks the founder about their startup on first sign-in
// =============================================================================
function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: "", building: "", stage: "Idea",
    mrr: "", customers: "", churn: "", netBurn: "", cash: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  async function finish() {
    setBusy(true);
    const company = {
      name: data.name || "My Startup",
      building: data.building,
      stage: data.stage,
      mrr: parseFloat(data.mrr) || 0,
      mrrGrowth: 0,
      customers: parseInt(data.customers) || 0,
      customerAdds: 0,
      churn: parseFloat(data.churn) || 0,
      netBurn: parseFloat(data.netBurn) || 0,
      cash: parseFloat(data.cash) || 0,
      cac: 0, arpu: 0, gm: 0, nps: 0,
      onboarded: true,
    };
    try {
      const fb = await import("./firebase.js");
      if (user?.uid) await fb.saveCompanyData(user.uid, company);
    } catch {}
    setBusy(false);
    onComplete(company);
  }

  const steps = [
    {
      title: "What are you building?",
      sub: "This shapes your whole workspace — and it's what the community sees.",
      body: (
        <div className="space-y-3">
          <Field label="Startup name" value={data.name} onChange={set("name")} placeholder="e.g. Northwind Labs" />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">What does it do?</span>
            <textarea value={data.building} onChange={set("building")} rows={3} placeholder="One or two lines — what you're making and for whom." className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm resize-none focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100" />
          </label>
        </div>
      ),
      canNext: () => data.name.trim().length > 0,
    },
    {
      title: "What stage are you at?",
      sub: "No wrong answer — it just tailors the guidance.",
      body: (
        <div className="grid grid-cols-2 gap-2.5">
          {["Idea", "Building MVP", "Launched", "Growing", "Scaling", "Raising"].map((s) => (
            <button key={s} onClick={() => setData((d) => ({ ...d, stage: s }))} className={"rounded-xl border px-4 py-3 text-sm font-bold transition " + (data.stage === s ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-300 bg-white text-slate-700 hover:border-gray-400")}>{s}</button>
          ))}
        </div>
      ),
      canNext: () => true,
    },
    {
      title: "A few numbers (optional)",
      sub: "Skip any you don't have yet — you can fill them in anytime from Company Data.",
      body: (
        <div className="grid grid-cols-2 gap-3">
          <Field label="MRR ($k / mo)" type="number" value={data.mrr} onChange={set("mrr")} placeholder="0" />
          <Field label="Customers" type="number" value={data.customers} onChange={set("customers")} placeholder="0" />
          <Field label="Monthly churn (%)" type="number" value={data.churn} onChange={set("churn")} placeholder="0" />
          <Field label="Net burn ($k / mo)" type="number" value={data.netBurn} onChange={set("netBurn")} placeholder="0" />
          <div className="col-span-2">
            <Field label="Cash in bank ($k)" type="number" value={data.cash} onChange={set("cash")} placeholder="0" />
          </div>
        </div>
      ),
      canNext: () => true,
    },
  ];

  const cur = steps[step];
  const last = step === steps.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <Card className="w-full max-w-lg p-7">
        <div className="flex items-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div key={i} className={"h-1.5 flex-1 rounded-full transition " + (i <= step ? "bg-violet-600" : "bg-gray-200")} />
          ))}
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center"><Rocket size={18} className="text-white" /></div>
          <span className="text-sm font-bold text-slate-400">Step {step + 1} of {steps.length}</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{cur.title}</h2>
        <p className="text-sm text-slate-500 mt-1 mb-5">{cur.sub}</p>
        {cur.body}
        <div className="flex items-center justify-between mt-7">
          {step > 0 ? <Btn variant="ghost" onClick={() => setStep(step - 1)}>Back</Btn> : <span />}
          {last ? (
            <Btn variant="primary" onClick={finish} disabled={busy}>{busy ? "Setting up…" : "Enter GenCopilot"} <ArrowRight size={15} /></Btn>
          ) : (
            <Btn variant="primary" onClick={() => setStep(step + 1)} disabled={!cur.canNext()}>Continue <ArrowRight size={15} /></Btn>
          )}
        </div>
        {step === 2 && (
          <button onClick={finish} disabled={busy} className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-4">Skip for now →</button>
        )}
      </Card>
    </div>
  );
}


// =============================================================================
// LIVE DATA LAYER — every module below reads/writes the user's real Firestore
// data. No demo rows anywhere: empty states prompt the founder to add their own.
// =============================================================================
function useSub(uid, coll) {
  const [items, setItems] = useState(null); // null = loading
  useEffect(() => {
    if (!uid) { setItems([]); return; }
    let unsub;
    (async () => {
      try { const fb = await import("./firebase.js"); unsub = fb.onSub(uid, coll, setItems); }
      catch { setItems([]); }
    })();
    return () => unsub && unsub();
  }, [uid, coll]);
  // Failures surface as toasts, not alert(). A modal alert blocks the whole
  // page — including the animation loops — until it is dismissed.
  // Each op resolves true only when the write actually landed, so callers can
  // gate their own "saved!" confirmation on it rather than assuming success.
  const { notify } = useTheme();
  const api = React.useMemo(() => ({
    async add(data) {
      if (!uid) { notify({ tone: "error", title: "Not signed in", body: "Log in with a cloud account to save data." }); return false; }
      try {
        const fb = await import("./firebase.js");
        await fb.addSub(uid, coll, data);
        // Only after the write lands — a popper for a save that failed is a lie.
        celebrate(LOG_LABELS[coll] || "Logged");
        return true;
      }
      catch (e) { notify({ tone: "error", title: "Save failed", body: e?.message || String(e) }); return false; }
    },
    async upd(id, data) {
      if (!uid) { notify({ tone: "error", title: "Not signed in", body: "Log in with a cloud account to save changes." }); return false; }
      try { const fb = await import("./firebase.js"); await fb.updSub(uid, coll, id, data); return true; }
      catch (e) { notify({ tone: "error", title: "Update failed", body: e?.message || String(e) }); return false; }
    },
    async del(id) {
      if (!uid) { notify({ tone: "error", title: "Not signed in", body: "Log in with a cloud account to make changes." }); return false; }
      try { const fb = await import("./firebase.js"); await fb.delSub(uid, coll, id); return true; }
      catch (e) { notify({ tone: "error", title: "Delete failed", body: e?.message || String(e) }); return false; }
    },
  }), [uid, coll, notify]);
  return [items, api];
}

function LiveEmpty({ icon: Icon, title, sub, cta, onCta }) {
  return (
    <Card className="p-10 text-center">
      <Icon size={30} className="mx-auto text-violet-500 mb-3" />
      <div className="font-extrabold text-slate-900">{title}</div>
      <div className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{sub}</div>
      {cta && <Btn variant="primary" className="mt-5" onClick={onCta}><Plus size={14} /> {cta}</Btn>}
    </Card>
  );
}

function MiniInput(props) {
  return <input {...props} className={"rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none " + (props.className || "")} />;
}

// -------------------------------------------------------------------- Team --
// Roster lives at companies/{founderUid}/team, so it is covered by the existing
// "owner can read/write their whole workspace" rule — no rules change needed.
const TEAM_ROLES = ["Founder", "Admin", "Team Member"];
// Keys must exist in TONES — an unknown tone renders a broken class.
const ROLE_TONE = { Founder: "blue", Admin: "amber", "Team Member": "emerald" };

// Only a founder or admin may change roles / remove people. A team member sees
// the roster read-only. This is a UI guard for a single-tenant workspace, not a
// security boundary — everything here lives under the owner's own document
// tree, so Firestore already restricts it to them.
function canManageTeam(user) {
  return user?.role === "Founder" || user?.role === "Admin";
}

function TeamModule({ module, user, company, setActive }) {
  const { notify } = useTheme();
  const [members, api] = useSub(user?.uid, "team");
  const [tasks, taskApi] = useSub(user?.uid, "tasks");
  const [form, setForm] = useState({ name: "", email: "", role: "Team Member", title: "" });
  const [err, setErr] = useState("");
  const [assigning, setAssigning] = useState(null); // member being assigned a task
  const [taskTitle, setTaskTitle] = useState("");
  const manage = canManageTeam(user);

  // The signed-in founder is always shown first, even before anyone is added.
  const self = {
    id: "__self__",
    name: user?.name || "You",
    email: user?.email || "—",
    role: user?.role || "Founder",
    title: "Account owner",
    isSelf: true,
  };
  const roster = [self, ...(members || [])];

  // Confirmation only after the write actually lands — api.add resolves false
  // when there's no cloud account or the rules reject it, and it raises its own
  // error toast in that case.
  async function addMember() {
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) return setErr("Add a name.");
    if (!EMAIL_RE.test(email)) return setErr("That email doesn't look right.");
    if (roster.some((m) => (m.email || "").toLowerCase() === email.toLowerCase()))
      return setErr("Someone with that email is already on the team.");
    setErr("");
    const ok = await api.add({ name, email, role: form.role, title: form.title.trim() || null, status: "invited" });
    if (!ok) return;
    notify({ tone: "success", title: name + " added", body: "Invite them to sign up with " + email + " to give them access." });
    setForm({ name: "", email: "", role: "Team Member", title: "" });
  }

  async function assignTask(member) {
    const t = taskTitle.trim();
    if (!t) return;
    const ok = await taskApi.add({ title: t, status: "todo", ai: false, assigneeName: member.name, assigneeEmail: member.email || null });
    if (!ok) return;
    notify({ tone: "success", title: "Task assigned", body: `“${t}” → ${member.name}`, actionLabel: "Open tasks", onAction: () => setActive("tasks") });
    setTaskTitle("");
    setAssigning(null);
  }

  async function changeRole(m, role) {
    if (await api.upd(m.id, { role })) notify({ tone: "info", title: m.name + " is now " + role });
  }

  async function removeMember(m) {
    if (await api.del(m.id)) notify({ tone: "info", title: m.name + " removed from the team" });
  }

  const taskCount = (m) => (tasks || []).filter((t) => t.assigneeName === m.name && (t.status || "todo") !== "done").length;
  const doneCount = (m) => (tasks || []).filter((t) => t.assigneeName === m.name && t.status === "done").length;

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      {/* headline counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "People", to: roster.length, icon: Users },
          { label: "Admins", to: roster.filter((m) => m.role === "Founder" || m.role === "Admin").length, icon: ShieldCheck },
          { label: "Open tasks", to: (tasks || []).filter((t) => t.assigneeName && (t.status || "todo") !== "done").length, icon: ListChecks },
          { label: "Completed", to: (tasks || []).filter((t) => t.assigneeName && t.status === "done").length, icon: Check },
        ].map((k, i) => (
          <AnimatedContent key={k.label} distance={30} duration={0.5} ease="power3.out" threshold={0.05} delay={i * 0.07}>
            <SpotlightCard className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 h-full" spotlightColor="rgba(124, 58, 237, 0.14)">
              <div className="flex items-center gap-2 text-slate-400"><k.icon size={15} /><span className="text-[11px] font-extrabold uppercase tracking-wider">{k.label}</span></div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5"><CountUp to={k.to} duration={1.2} /></div>
            </SpotlightCard>
          </AnimatedContent>
        ))}
      </div>

      {/* add a teammate — founders/admins only */}
      {manage && (
        <Card className="p-4 mb-5">
          <div className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2"><Plus size={15} className="text-violet-600" /> Add a teammate</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <MiniInput value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); if (err) setErr(""); }} placeholder="Full name" aria-label="Teammate name" />
            <MiniInput value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (err) setErr(""); }} placeholder="name@company.com" aria-label="Teammate email" type="email" />
            <MiniInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (optional)" aria-label="Teammate title" />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              aria-label="Teammate role"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
            >
              {TEAM_ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
            <Btn variant="primary" className="py-2 text-sm" onClick={addMember} disabled={!form.name.trim() || !form.email.trim()}>
              <Plus size={14} /> Add
            </Btn>
          </div>
          {err && <div className="text-sm font-semibold text-red-600 flex items-center gap-1.5 mt-2.5" role="alert"><AlertTriangle size={14} /> {err}</div>}
          <p className="text-[11px] text-slate-400 mt-2.5">
            Adding someone records them on your roster and lets you assign work. They get their own workspace by signing up with that email.
          </p>
        </Card>
      )}

      {/* roster */}
      {members === null ? (
        <Card className="p-8 text-center text-sm text-slate-400">Loading your team…</Card>
      ) : (
        <div className="space-y-3">
          {roster.map((m, i) => (
            <AnimatedContent key={m.id} distance={24} duration={0.45} ease="power3.out" threshold={0.05} delay={Math.min(i, 6) * 0.05}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar name={m.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900 truncate">{m.name}</span>
                      {m.isSelf && <Badge tone="blue">You</Badge>}
                      {m.status === "invited" && !m.isSelf && <Badge tone="amber">Invited</Badge>}
                    </div>
                    <a
                      href={m.email && m.email !== "—" ? "mailto:" + m.email : undefined}
                      className="text-xs text-slate-500 hover:text-violet-700 transition truncate block"
                    >
                      {m.email}
                    </a>
                    {m.title && <div className="text-[11px] text-slate-400 mt-0.5">{m.title}</div>}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      <span className="font-bold text-slate-600">{taskCount(m)}</span> open · {doneCount(m)} done
                    </span>

                    {/* role: editable by managers, except on your own row */}
                    {manage && !m.isSelf ? (
                      <select
                        value={m.role || "Team Member"}
                        onChange={(e) => changeRole(m, e.target.value)}
                        aria-label={"Role for " + m.name}
                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-violet-500 focus:outline-none"
                      >
                        {TEAM_ROLES.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    ) : (
                      <Badge tone={ROLE_TONE[m.role] || "blue"}>{m.role}</Badge>
                    )}

                    {manage && (
                      <Btn variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => { setAssigning(assigning === m.id ? null : m.id); setTaskTitle(""); }}>
                        <ListChecks size={13} /> Assign
                      </Btn>
                    )}
                    {manage && !m.isSelf && (
                      <button
                        onClick={() => removeMember(m)}
                        aria-label={"Remove " + m.name}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* inline task assignment */}
                {assigning === m.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 anim-fadeUp">
                    <MiniInput
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && assignTask(m)}
                      placeholder={"What should " + m.name.split(" ")[0] + " work on?"}
                      aria-label={"Task for " + m.name}
                      className="flex-1 min-w-[220px]"
                      autoFocus
                    />
                    <Btn variant="primary" className="px-4 py-2 text-sm" onClick={() => assignTask(m)} disabled={!taskTitle.trim()}>Assign</Btn>
                    <Btn variant="ghost" className="px-3 py-2 text-sm" onClick={() => setAssigning(null)}>Cancel</Btn>
                  </div>
                )}

                {/* what they're currently on */}
                {taskCount(m) > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-1.5">
                    {(tasks || [])
                      .filter((t) => t.assigneeName === m.name && (t.status || "todo") !== "done")
                      .slice(0, 4)
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActive("tasks")}
                          className="text-[11px] font-semibold rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 hover:bg-violet-100 transition max-w-[240px] truncate"
                          title={t.title}
                        >
                          {t.title}
                        </button>
                      ))}
                    {taskCount(m) > 4 && <span className="text-[11px] text-slate-400 self-center">+{taskCount(m) - 4} more</span>}
                  </div>
                )}
              </Card>
            </AnimatedContent>
          ))}

          {members.length === 0 && (
            <Card className="p-8 text-center">
              <span className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto mb-3"><Users size={22} /></span>
              <div className="text-sm font-bold text-slate-700">It's just you so far</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {manage
                  ? "Add your co-founders and teammates above — then you can assign them work and track what everyone's on."
                  : "Your founder hasn't added anyone else yet."}
              </div>
            </Card>
          )}
        </div>
      )}
    </ModuleShell>
  );
}

// ---------------------------------------------------------------- Overview --
function OverviewLive({ module, user, company, setActive }) {
  const [metrics, setMetrics] = useState(null);
  const [metricsErr, setMetricsErr] = useState(null);
  const [metricsRetry, setMetricsRetry] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [clients] = useSub(user?.uid, "clients");
  const { openChat } = useTheme();

  useEffect(() => {
    if (!user?.uid) { setMetrics([]); return; }
    let u1, u2;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        u1 = fb.onMetrics(user.uid, (rows, err) => {
          if (err) { setMetricsErr(err?.message || String(err)); setMetrics([]); }
          else { setMetricsErr(null); setMetrics(rows); }
        });
        u2 = fb.onUserNotifications(user.uid, setNotifs, 6);
      } catch (e) { setMetricsErr(e?.message || String(e)); setMetrics([]); }
    })();
    return () => { u1 && u1(); u2 && u2(); };
  }, [user?.uid, metricsRetry]);

  const runway = company.netBurn > 0 ? (company.cash / company.netBurn) : null;
  const series = (metrics || []).map((m) => ({ name: m.monthKey.slice(5), MRR: m.mrr, Customers: m.customers }));
  const growth = series.length >= 2 && series[series.length - 2].MRR > 0
    ? (((series[series.length - 1].MRR - series[series.length - 2].MRR) / series[series.length - 2].MRR) * 100).toFixed(1)
    : null;
  const atRisk = (clients || []).filter((c) => Number(c.health) > 0 && Number(c.health) < 60);

  // `to`/`decimals` drive a CountUp roll-in; `value` is the static fallback for
  // the runway dash when there are no numbers to count to yet.
  const kpis = [
    { label: "MRR", to: company.mrr || 0, prefix: "$", suffix: "k", sub: growth != null ? (growth >= 0 ? "+" : "") + growth + "% MoM" : "add monthly updates", icon: TrendingUp },
    { label: "Customers", to: company.customers || 0, separator: ",", sub: "from Company Data", icon: Users },
    { label: "Monthly churn", to: company.churn || 0, suffix: "%", sub: company.churn > 5 ? "above healthy range" : "looks healthy", icon: TrendingDown },
    { label: "Runway", to: runway ? Number(runway.toFixed(1)) : 0, suffix: " mo", value: runway ? null : "—", sub: runway ? "$" + company.cash + "k ÷ $" + company.netBurn + "k/mo" : "enter burn + cash", icon: Wallet },
  ];

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((k, i) => (
          <AnimatedContent key={k.label} distance={30} duration={0.5} ease="power3.out" threshold={0.05} delay={i * 0.07}>
            <SpotlightCard
              className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 h-full"
              spotlightColor="rgba(124, 58, 237, 0.14)"
            >
              <div className="flex items-center gap-2 text-slate-400"><k.icon size={15} /><span className="text-[11px] font-extrabold uppercase tracking-wider">{k.label}</span></div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1.5">
                {k.value != null ? k.value : (
                  <>
                    {k.prefix}
                    <CountUp to={k.to} duration={1.5} separator={k.separator || ""} />
                    {k.suffix}
                  </>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{k.sub}</div>
            </SpotlightCard>
          </AnimatedContent>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-extrabold text-slate-900">MRR & customers over time</h3>
            <Badge tone="blue">real data</Badge>
          </div>
          <p className="text-xs text-slate-400 mb-3">One point is saved each month from your Company Data. Update your numbers monthly and this chart builds itself.</p>
          {metricsErr ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <AlertTriangle size={24} className="text-red-500 mb-2" />
              <div className="text-sm font-bold text-slate-700">Couldn't load metric history</div>
              <div className="text-xs text-slate-400 mt-1 max-w-xs break-words">{metricsErr}</div>
              <Btn variant="ghost" className="mt-3 px-4 py-1.5 text-xs" onClick={() => { setMetrics(null); setMetricsErr(null); setMetricsRetry((k) => k + 1); }}>Retry</Btn>
            </div>
          ) : metrics === null ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">Loading…</div>
          ) : series.length < 2 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <Activity size={26} className="text-violet-400 mb-2" />
              <div className="text-sm font-bold text-slate-700">{series.length === 0 ? "No history yet" : "First data point saved"}</div>
              <div className="text-xs text-slate-400 mt-1 max-w-xs">Your chart starts drawing from the second month. Keep Company Data current and history accrues automatically.</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--fg-muted)" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="MRR" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.14} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Latest activity</h3>
            {notifs.length === 0 ? (
              <p className="text-xs text-slate-400">Real notifications land here — comments on your posts, new messages, and setup nudges.</p>
            ) : (
              <div className="space-y-2.5">
                {notifs.map((n) => (
                  <button key={n.id} onClick={() => n.to && setActive(n.to)} className="w-full text-left flex items-start gap-2">
                    <span className={"mt-1.5 w-2 h-2 rounded-full shrink-0 " + (n.read ? "bg-gray-300" : "bg-violet-500")} />
                    <span className="text-xs text-slate-600 leading-snug">{n.text}</span>
                  </button>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">At-risk clients</h3>
            {(clients || []).length === 0 ? (
              <p className="text-xs text-slate-400">Add clients in Client Success Hub — anyone with health under 60 is flagged here.</p>
            ) : atRisk.length === 0 ? (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5"><Check size={14} /> No accounts at risk right now.</p>
            ) : atRisk.slice(0, 3).map((c) => (
              <button key={c.id} onClick={() => setActive("clients")} className="w-full flex items-center justify-between py-1.5 text-left">
                <span className="text-sm font-bold text-slate-800 truncate">{c.name}</span>
                <Badge tone="red">{c.health}</Badge>
              </button>
            ))}
          </Card>
          <Btn variant="soft" className="w-full" onClick={() => openChat("Give me a focused briefing on where " + (company.name || "my startup") + " stands today and the top 3 things I should do this week.")}>
            <Sparkles size={15} /> Ask for today's briefing
          </Btn>
        </div>
      </div>
    </ModuleShell>
  );
}

// ------------------------------------------------------------------- Tasks --
function TasksLive({ module, user, company }) {
  const [tasks, api] = useSub(user?.uid, "tasks");
  const [title, setTitle] = useState("");
  const cols = [["todo", "To do"], ["doing", "In progress"], ["done", "Done"]];
  const move = (t, dir) => {
    const order = ["todo", "doing", "done"];
    const i = order.indexOf(t.status || "todo") + dir;
    if (i >= 0 && i < 3) api.upd(t.id, { status: order[i] });
  };
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 flex flex-wrap gap-2">
        <MiniInput value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) { api.add({ title: title.trim(), status: "todo", ai: false }); setTitle(""); } }} placeholder="Add a task…" className="flex-1 min-w-[200px]" />
        <Btn variant="primary" className="px-4 py-2 text-sm" disabled={!title.trim()} onClick={() => { api.add({ title: title.trim(), status: "todo", ai: false }); setTitle(""); }}><Plus size={14} /> Add</Btn>
      </Card>
      {tasks !== null && tasks.length === 0 ? (
        <LiveEmpty icon={ListChecks} title="No tasks yet" sub="Add your first task above. Toggle 'AI' on a task to mark it delegated to your AI co-founder — then ask the chat to do it." />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {cols.map(([key, label]) => (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-extrabold text-slate-900">{label}</span>
                <Badge tone="blue">{(tasks || []).filter((t) => (t.status || "todo") === key).length}</Badge>
              </div>
              <div className="space-y-2.5">
                {(tasks || []).filter((t) => (t.status || "todo") === key).map((t) => (
                  <div key={t.id} className="rounded-xl bg-gray-100 p-3">
                    <div className="text-sm font-bold text-slate-800 break-words">{t.title}</div>
                    {t.assigneeName && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500" title={t.assigneeEmail || undefined}>
                        <Avatar name={t.assigneeName} size={16} />
                        <span className="font-semibold truncate">{t.assigneeName}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      <button onClick={() => api.upd(t.id, { ai: !t.ai })} className={"px-2 py-0.5 rounded-full text-[10px] font-extrabold transition " + (t.ai ? "bg-violet-600 text-white" : "bg-white text-slate-500")}>{t.ai ? "AI co-founder" : t.assigneeName ? t.assigneeName.split(" ")[0] : "You"}</button>
                      <span className="flex-1" />
                      {key !== "todo" && <button onClick={() => move(t, -1)} className="p-1 rounded hover:bg-white"><ChevronLeft size={14} className="text-slate-500" /></button>}
                      {key !== "done" && <button onClick={() => move(t, 1)} className="p-1 rounded hover:bg-white"><ChevronRight size={14} className="text-slate-500" /></button>}
                      <button onClick={() => api.del(t.id)} className="p-1 rounded hover:bg-red-50"><X size={13} className="text-slate-400 hover:text-red-500" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}

// ---------------------------------------------------------------- Meetings --
function MeetingsLive({ module, user, company }) {
  const [items, api] = useSub(user?.uid, "meetings");
  const [f, setF] = useState({ title: "", when: "", notes: "" });
  const { openChat } = useTheme();
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 grid sm:grid-cols-4 gap-2">
        <MiniInput value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Meeting title" className="sm:col-span-2" />
        <MiniInput type="datetime-local" value={f.when} onChange={(e) => setF({ ...f, when: e.target.value })} />
        <Btn variant="primary" className="py-2 text-sm" disabled={!f.title.trim()} onClick={() => { api.add(f); setF({ title: "", when: "", notes: "" }); }}><Plus size={14} /> Add meeting</Btn>
      </Card>
      {items !== null && items.length === 0 ? (
        <LiveEmpty icon={CalendarDays} title="No meetings logged" sub="Add upcoming meetings — then use 'Prep with AI' and your co-founder will build an agenda from your live company data." />
      ) : (
        <div className="space-y-3">
          {(items || []).slice().reverse().map((m) => (
            <Card key={m.id} className="p-4 flex flex-wrap items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Video size={18} /></span>
              <div className="flex-1 min-w-[160px]">
                <div className="font-extrabold text-slate-900">{m.title}</div>
                <div className="text-xs text-slate-400">{m.when ? new Date(m.when).toLocaleString() : "No time set"}</div>
              </div>
              <Btn variant="soft" className="px-3 py-1.5 text-xs" onClick={() => openChat("Prep me for this meeting: \"" + m.title + "\"" + (m.when ? " on " + new Date(m.when).toLocaleString() : "") + ". Build a tight agenda and the 3 numbers I should lead with.")}><Sparkles size={13} /> Prep with AI</Btn>
              <button onClick={() => api.del(m.id)} className="p-1.5 rounded-lg hover:bg-red-50"><X size={15} className="text-slate-400 hover:text-red-500" /></button>
            </Card>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}

// --------------------------------------------------------------------- PMF --
function PMFLive({ module, user, company, setCompany }) {
  const responses = company.pmfResponses || 0;
  const vd = company.pmfVeryDisappointed || 0;
  const pct = responses > 0 ? Math.round((vd / responses) * 100) : 0;
  const upd = (patch) => setCompany((c) => ({ ...c, ...patch }));
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Sean Ellis PMF tracker</h3>
          <p className="text-xs text-slate-400 mb-4">Ask users: “How disappointed would you be if you could no longer use the product?” Log totals here — 40%+ “very disappointed” signals product–market fit.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-bold text-slate-500">Total responses</span>
              <MiniInput type="number" min="0" value={responses} onChange={(e) => upd({ pmfResponses: parseInt(e.target.value) || 0 })} className="w-full mt-1" /></label>
            <label className="block"><span className="text-xs font-bold text-slate-500">“Very disappointed”</span>
              <MiniInput type="number" min="0" value={vd} onChange={(e) => upd({ pmfVeryDisappointed: parseInt(e.target.value) || 0 })} className="w-full mt-1" /></label>
          </div>
          <div className="mt-6">
            <div className="flex items-end justify-between mb-1">
              <span className="text-4xl font-extrabold" style={{ color: pct >= 40 ? "var(--brand)" : "var(--warn)" }}>{responses ? pct + "%" : "—"}</span>
              <span className="text-xs font-bold text-slate-400">40% threshold</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: Math.min(pct, 100) + "%", background: "var(--brand)" }} />
            </div>
            <p className="text-xs text-slate-500 mt-3">{!responses ? "Log your first survey batch to see where you stand." : pct >= 40 ? "You're at/above the PMF threshold — double down on this segment." : "Below 40% — talk to your 'very disappointed' users and find the pattern."}</p>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-1">Waitlist</h3>
          <p className="text-xs text-slate-400 mb-4">Track signups collected anywhere — landing page, LinkedIn, events.</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl font-extrabold text-slate-900">{(company.waitlist || 0).toLocaleString()}</span>
            <div className="flex gap-2">
              <Btn variant="soft" className="px-3 py-2 text-sm" celebrate="Waitlist +1" onClick={() => upd({ waitlist: (company.waitlist || 0) + 1 })}>+1</Btn>
              <Btn variant="soft" className="px-3 py-2 text-sm" celebrate="Waitlist +10" onClick={() => upd({ waitlist: (company.waitlist || 0) + 10 })}>+10</Btn>
              <Btn variant="ghost" className="px-3 py-2 text-sm" onClick={() => { const v = prompt("Set waitlist total:", String(company.waitlist || 0)); if (v != null) upd({ waitlist: parseInt(v) || 0 }); }}>Set…</Btn>
            </div>
          </div>
        </Card>
      </div>
    </ModuleShell>
  );
}

// ---------------------------------------------------------------- Feedback --
function FeedbackLive({ module, user, company }) {
  const [items, api] = useSub(user?.uid, "feedback");
  const [f, setF] = useState({ user: "", text: "", sentiment: "positive" });
  const tone = { positive: "emerald", neutral: "blue", negative: "red" };
  const counts = { positive: 0, neutral: 0, negative: 0 };
  (items || []).forEach((i) => { counts[i.sentiment] = (counts[i.sentiment] || 0) + 1; });
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 grid sm:grid-cols-5 gap-2">
        <MiniInput value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} placeholder="From (name)" />
        <MiniInput value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="What they said…" className="sm:col-span-2" />
        <select value={f.sentiment} onChange={(e) => setF({ ...f, sentiment: e.target.value })} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
          <option value="positive">Positive</option><option value="neutral">Neutral</option><option value="negative">Negative</option>
        </select>
        <Btn variant="primary" className="py-2 text-sm" disabled={!f.text.trim()} onClick={() => { api.add(f); setF({ user: "", text: "", sentiment: "positive" }); }}><Plus size={14} /> Log</Btn>
      </Card>
      {items !== null && items.length === 0 ? (
        <LiveEmpty icon={Inbox} title="No feedback logged" sub="Paste in real quotes from users as they arrive — the AI co-founder reads sentiment mix when advising on product priorities." />
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            {Object.entries(counts).map(([k, v]) => <Badge key={k} tone={tone[k]} className="capitalize">{k}: {v}</Badge>)}
          </div>
          <div className="space-y-3">
            {(items || []).slice().reverse().map((i) => (
              <Card key={i.id} className="p-4 flex items-start gap-3">
                <Badge tone={tone[i.sentiment]} className="capitalize shrink-0">{i.sentiment}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 break-words">“{i.text}”</p>
                  {i.user && <p className="text-xs text-slate-400 mt-1">— {i.user}</p>}
                </div>
                <button onClick={() => api.del(i.id)} className="p-1 rounded hover:bg-red-50 shrink-0"><X size={14} className="text-slate-400 hover:text-red-500" /></button>
              </Card>
            ))}
          </div>
        </>
      )}
    </ModuleShell>
  );
}

// ------------------------------------------------------------------- Leads --
function LeadsLive({ module, user, company }) {
  const [items, api] = useSub(user?.uid, "leads");
  const [f, setF] = useState({ name: "", value: "", score: "" });
  const sorted = (items || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 grid sm:grid-cols-4 gap-2">
        <MiniInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Lead / company" />
        <MiniInput type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} placeholder="Deal value ($)" />
        <MiniInput type="number" min="0" max="100" value={f.score} onChange={(e) => setF({ ...f, score: e.target.value })} placeholder="Score 0–100" />
        <Btn variant="primary" className="py-2 text-sm" disabled={!f.name.trim()} onClick={() => {
          const sc = Number(f.score);
          if (f.score !== "" && (!Number.isFinite(sc) || sc < 0 || sc > 100)) return alert("Score must be between 0 and 100.");
          const val = Number(f.value);
          if (f.value !== "" && (!Number.isFinite(val) || val < 0)) return alert("Deal value must be a positive number.");
          api.add({ name: f.name, value: val || 0, score: Math.max(0, Math.min(100, sc || 0)) });
          setF({ name: "", value: "", score: "" });
        }}><Plus size={14} /> Add lead</Btn>
      </Card>
      {items !== null && items.length === 0 ? (
        <LiveEmpty icon={Filter} title="No leads yet" sub="Add prospects with a 0–100 score. Highest scores float to the top so sales hours go where the revenue is." />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((l) => (
            <Card key={l.id} className="p-4 flex items-center gap-3">
              <span className={"w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-sm " + ((l.score || 0) >= 70 ? "bg-emerald-50 text-emerald-600" : (l.score || 0) >= 40 ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-slate-500")}>{l.score || 0}</span>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-900 truncate">{l.name}</div>
                <div className="text-xs text-slate-400">{l.value ? "$" + Number(l.value).toLocaleString() + " potential" : "value not set"}</div>
              </div>
              <button onClick={() => api.del(l.id)} className="p-1.5 rounded-lg hover:bg-red-50"><X size={15} className="text-slate-400 hover:text-red-500" /></button>
            </Card>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}

// ----------------------------------------------------------------- Clients --
function ClientsLive({ module, user, company }) {
  const [items, api] = useSub(user?.uid, "clients");
  const [f, setF] = useState({ name: "", plan: "Starter", mrr: "", health: "" });
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 grid sm:grid-cols-5 gap-2">
        <MiniInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Client name" />
        <select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
          <option>Starter</option><option>Growth</option><option>Scale</option>
        </select>
        <MiniInput type="number" value={f.mrr} onChange={(e) => setF({ ...f, mrr: e.target.value })} placeholder="MRR ($/mo)" />
        <MiniInput type="number" min="0" max="100" value={f.health} onChange={(e) => setF({ ...f, health: e.target.value })} placeholder="Health 0–100" />
        <Btn variant="primary" className="py-2 text-sm" disabled={!f.name.trim()} onClick={() => { api.add({ ...f, mrr: Number(f.mrr) || 0, health: Math.min(100, Number(f.health) || 0) }); setF({ name: "", plan: "Starter", mrr: "", health: "" }); }}><Plus size={14} /> Add</Btn>
      </Card>
      {items !== null && items.length === 0 ? (
        <LiveEmpty icon={Users} title="No clients yet" sub="Add each client with their plan, MRR, and a 0–100 health score. Low-health accounts get flagged on your dashboard and in Churn Prediction." />
      ) : (
        <div className="space-y-2.5">
          {(items || []).map((c) => (
            <Card key={c.id} className="p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[140px]">
                <div className="font-extrabold text-slate-900 truncate">{c.name}</div>
                <div className="text-xs text-slate-400">{c.plan} · ${Number(c.mrr || 0).toLocaleString()}/mo</div>
              </div>
              <Badge tone={Number(c.health) >= 70 ? "emerald" : Number(c.health) >= 50 ? "amber" : "red"}>Health {c.health || 0}</Badge>
              <MiniInput type="number" min="0" max="100" defaultValue={c.health} onBlur={(e) => api.upd(c.id, { health: Math.min(100, Number(e.target.value) || 0) })} className="w-20" title="Update health" />
              <button onClick={() => api.del(c.id)} className="p-1.5 rounded-lg hover:bg-red-50"><X size={15} className="text-slate-400 hover:text-red-500" /></button>
            </Card>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}

// ------------------------------------------------------------------- Churn --
function ChurnLive({ module, user, company, setActive }) {
  const [clients] = useSub(user?.uid, "clients");
  const { openChat } = useTheme();
  const risky = (clients || []).filter((c) => Number(c.health) < 60).sort((a, b) => (a.health || 0) - (b.health || 0));
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      {(clients || []).length === 0 ? (
        <LiveEmpty icon={TrendingDown} title="Churn prediction needs your client list" sub="Add clients with health scores in Client Success Hub. Anyone under 60 shows up here with a retention play." cta="Go to Client Success Hub" onCta={() => setActive("clients")} />
      ) : risky.length === 0 ? (
        <Card className="p-10 text-center">
          <Check size={30} className="mx-auto text-emerald-500 mb-3" />
          <div className="font-extrabold text-slate-900">No at-risk accounts</div>
          <div className="text-sm text-slate-500 mt-1">Every client is at health 60+. Keep health scores updated as signals change.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {risky.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[150px]">
                  <div className="font-extrabold text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.plan} · ${Number(c.mrr || 0).toLocaleString()}/mo at risk</div>
                </div>
                <span className="text-2xl font-extrabold text-red-500">{c.health}</span>
              </div>
              <Btn variant="soft" className="mt-3 px-3.5 py-2 text-xs" onClick={() => openChat("Client '" + c.name + "' (" + c.plan + ", $" + (c.mrr || 0) + "/mo) has health score " + c.health + ". Draft a concrete 3-step retention play I can run this week.")}>
                <Sparkles size={13} /> Get a retention play
              </Btn>
            </Card>
          ))}
        </div>
      )}
    </ModuleShell>
  );
}

// --------------------------------------------------------------- Investors --
function InvestorsLive({ module, user, company }) {
  const [items, api] = useSub(user?.uid, "investors");
  const [f, setF] = useState({ name: "", stage: "Researching", amount: "" });
  const stages = ["Researching", "Contacted", "Meeting", "Diligence", "Committed", "Passed"];
  const { openChat } = useTheme();
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 grid sm:grid-cols-4 gap-2">
        <MiniInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Investor / fund" />
        <select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none">
          {stages.map((s) => <option key={s}>{s}</option>)}
        </select>
        <MiniInput type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="Target ($k)" />
        <Btn variant="primary" className="py-2 text-sm" disabled={!f.name.trim()} onClick={() => {
          const amt = Number(f.amount);
          if (f.amount !== "" && (!Number.isFinite(amt) || amt < 0)) return alert("Target must be a positive number (in $k).");
          api.add({ ...f, amount: amt || 0 });
          setF({ name: "", stage: "Researching", amount: "" });
        }}><Plus size={14} /> Add</Btn>
      </Card>
      {items !== null && items.length === 0 ? (
        <LiveEmpty icon={Handshake} title="Your pipeline is empty" sub="Add every fund you're talking to with its stage. Ask the AI co-founder to draft your investor update once there's momentum to report." />
      ) : (
        <>
          <div className="space-y-2.5">
            {(items || []).map((inv) => (
              <Card key={inv.id} className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[150px]">
                  <div className="font-extrabold text-slate-900 truncate">{inv.name}</div>
                  {inv.amount > 0 && <div className="text-xs text-slate-400">target ${Number(inv.amount).toLocaleString()}k</div>}
                </div>
                <select value={inv.stage} onChange={(e) => api.upd(inv.id, { stage: e.target.value })} className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold focus:border-violet-500 focus:outline-none">
                  {stages.map((s) => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => api.del(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50"><X size={15} className="text-slate-400 hover:text-red-500" /></button>
              </Card>
            ))}
          </div>
          <Btn variant="soft" className="mt-4" onClick={() => openChat("Draft this month's investor update for " + (company.name || "my startup") + " using my live numbers. Keep it tight: traction, lowlights, asks.")}>
            <Sparkles size={14} /> Draft investor update with AI
          </Btn>
        </>
      )}
    </ModuleShell>
  );
}

// -------------------------------------------------------------- Automation --
function AutomationLive({ module, user, company }) {
  const [items, api] = useSub(user?.uid, "automations");
  const [f, setF] = useState({ name: "", hours: "" });
  const total = (items || []).reduce((s, i) => s + (Number(i.hours) || 0), 0);
  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      <Card className="p-4 mb-5 grid sm:grid-cols-3 gap-2">
        <MiniInput value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Automation (e.g. weekly report bot)" />
        <MiniInput type="number" value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })} placeholder="Hours saved / month" />
        <Btn variant="primary" className="py-2 text-sm" disabled={!f.name.trim()} onClick={() => {
          const h = Number(f.hours);
          if (f.hours !== "" && (!Number.isFinite(h) || h <= 0)) return alert("Hours saved must be a positive number.");
          api.add({ name: f.name, hours: h || 0 });
          setF({ name: "", hours: "" });
        }}><Plus size={14} /> Log</Btn>
      </Card>
      {items !== null && items.length === 0 ? (
        <LiveEmpty icon={Workflow} title="No automations logged" sub="Every time you automate something — a report, a follow-up, a data sync — log it with the hours it saves. Watch the ROI stack up." />
      ) : (
        <>
          <Card className="p-5 mb-4 flex items-center gap-4">
            <span className="text-4xl font-extrabold" style={{ color: "var(--brand)" }}>{total}h</span>
            <span className="text-sm text-slate-500">saved every month across {(items || []).length} automation{(items || []).length === 1 ? "" : "s"}</span>
          </Card>
          <div className="space-y-2.5">
            {(items || []).map((a) => (
              <Card key={a.id} className="p-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center"><Zap size={17} /></span>
                <div className="flex-1 min-w-0 font-bold text-slate-800 truncate">{a.name}</div>
                <Badge tone="emerald">{a.hours || 0}h / mo</Badge>
                <button onClick={() => api.del(a.id)} className="p-1.5 rounded-lg hover:bg-red-50"><X size={15} className="text-slate-400 hover:text-red-500" /></button>
              </Card>
            ))}
          </div>
        </>
      )}
    </ModuleShell>
  );
}

// ----------------------------------------------------------------- Markets --
function MarketsLive({ module, user, company }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const { openChat } = useTheme();

  async function load() {
    setData(null); setErr(false);
    try {
      const r = await fetch("/api/market?base=USD");
      if (!r.ok) throw new Error();
      setData(await r.json());
    } catch { setErr(true); setData({}); }
  }
  useEffect(() => { load(); }, []);

  const fmt = (n, d = 2) => n == null ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });

  return (
    <ModuleShell module={module} companyLine={companyLineFrom(company)}>
      {data === null ? (
        <Card className="p-10 text-center text-sm text-slate-500">Fetching live market data…</Card>
      ) : err ? (
        <Card className="p-8 text-center">
          <Activity size={28} className="mx-auto text-violet-500 mb-3" />
          <div className="font-extrabold text-slate-900">Markets are unreachable right now</div>
          <div className="text-sm text-slate-500 mt-1">The market feed had a hiccup. It needs no API keys — just try again.</div>
          <Btn variant="soft" className="mt-4" onClick={load}>Retry</Btn>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Currency rates</h3>
                <Badge tone="blue">1 {data.fx?.base || "USD"} equals</Badge>
              </div>
              {!data.fx ? <p className="text-xs text-slate-400">FX feed unavailable — retry in a moment.</p> : (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(data.fx.rates || {}).map(([cur, rate]) => (
                    <div key={cur} className="rounded-xl bg-gray-100 p-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{cur}</div>
                      <div className="text-xl font-extrabold text-slate-900">{fmt(rate, cur === "JPY" ? 1 : 2)}</div>
                    </div>
                  ))}
                </div>
              )}
              {data.fx?.date && <p className="text-[11px] text-slate-400 mt-3">ECB reference · {data.fx.date}</p>}
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3">Crypto</h3>
              {!data.crypto ? <p className="text-xs text-slate-400">Crypto feed unavailable — retry in a moment.</p> : (
                <div className="space-y-2.5">
                  {data.crypto.map((c) => (
                    <div key={c.symbol} className="flex items-center gap-3 rounded-xl bg-gray-100 p-3">
                      <span className="font-extrabold text-slate-900 w-12">{c.symbol}</span>
                      <span className="flex-1 text-lg font-extrabold text-slate-900">${fmt(c.price)}</span>
                      <Badge tone={(c.change24h || 0) >= 0 ? "emerald" : "red"}>{(c.change24h || 0) >= 0 ? "+" : ""}{fmt(c.change24h, 1)}% 24h</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {data.stocks && data.stocks.length > 0 && (
            <Card className="p-5 mt-5">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3">Watchlist</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.stocks.map((s) => (
                  <div key={s.symbol} className="rounded-xl bg-gray-100 p-3">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{s.symbol}</div>
                    <div className="text-xl font-extrabold text-slate-900">${fmt(s.price)}</div>
                    <div className={"text-xs font-bold " + ((s.changePct || 0) >= 0 ? "text-emerald-600" : "text-red-500")}>{(s.changePct || 0) >= 0 ? "+" : ""}{fmt(s.changePct, 2)}%</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Btn variant="soft" onClick={load}><Activity size={14} /> Refresh</Btn>
            <Btn variant="soft" onClick={() => openChat("Given today's USD/INR rate and crypto moves, is there anything about market conditions I should factor into " + (company.name || "my startup") + "'s pricing or fundraising timing?")}>
              <Sparkles size={14} /> Ask what this means for me
            </Btn>
            <span className="text-[11px] text-slate-400">FX + crypto need no API keys. Add FMP_KEY (financialmodelingprep.com) in Cloudflare for live stock quotes.</span>
          </div>
        </>
      )}
    </ModuleShell>
  );
}

const MODULE_VIEWS = {
  overview: OverviewLive,
  tasks: TasksLive,
  meetings: MeetingsLive,
  pmf: PMFLive,
  feedback: FeedbackLive,
  leads: LeadsLive,
  churn: ChurnLive,
  clients: ClientsLive,
  runway: RunwayModule,
  unit: UnitEconModule,
  investors: InvestorsLive,
  compliance: ComplianceModule,
  automation: AutomationLive,
  copilot: CopilotModule,
  company: CompanyModule,
  community: CommunityModule,
  interview: InterviewModule,
  news: NewsModule,
  markets: MarketsLive,
  team: TeamModule,
  talent: TalentModule,
  messages: MessagesModule,
  profile: ProfileModule,
  "feedback-form": FeedbackFormModule,
  privacy: PrivacyModule,
};

// ============================================================================
// Theme + chart-drilldown infrastructure
// ============================================================================
const ThemeContext = React.createContext({
  theme: "light",
  setTheme: () => {},
  openDetail: () => {},
  notify: () => {},
});
const useTheme = () => React.useContext(ThemeContext);

// ============================================================================
// Toasts — animated, self-dismissing notifications
// ============================================================================
const TOAST_TONES = {
  success: { Icon: CheckCircle2, ring: "bg-emerald-500/12 text-emerald-500", bar: "#10b981" },
  error:   { Icon: AlertTriangle, ring: "bg-red-500/12 text-red-500",         bar: "#ef4444" },
  info:    { Icon: Bell,          ring: "bg-violet-500/12 text-violet-500",   bar: "#8b5cf6" },
  ai:      { Icon: Sparkles,      ring: "bg-fuchsia-500/12 text-fuchsia-500", bar: "#d946ef" },
};

function Toast({ toast, onDismiss }) {
  const { Icon, ring, bar } = TOAST_TONES[toast.tone] || TOAST_TONES.info;
  const [leaving, setLeaving] = useState(false);
  const duration = toast.duration ?? 4200;

  const close = React.useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 260); // let the exit animation finish
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const t = setTimeout(close, duration);
    return () => clearTimeout(t);
  }, [close, duration]);

  return (
    <div
      className={"gc-toast relative overflow-hidden w-[min(360px,calc(100vw-2rem))] p-3.5 pr-10 flex items-start gap-3 pointer-events-auto " + (leaving ? "gc-toast-out" : "")}
      role="status"
      aria-live="polite"
    >
      <span className={"gc-toast-icon w-9 h-9 rounded-full flex items-center justify-center shrink-0 " + ring}>
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="text-sm font-extrabold text-slate-900 leading-snug">{toast.title}</div>
        {toast.body && <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{toast.body}</div>}
        {toast.actionLabel && (
          <button
            onClick={() => { toast.onAction?.(); close(); }}
            className="mt-2 text-xs font-bold text-violet-600 hover:text-violet-800 inline-flex items-center gap-1 transition"
          >
            {toast.actionLabel} <ArrowRight size={12} />
          </button>
        )}
      </div>
      <button onClick={close} aria-label="Dismiss notification" className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5 transition">
        <X size={14} />
      </button>
      {/* hairline that drains for the life of the toast */}
      <span
        aria-hidden="true"
        className="gc-toast-bar absolute bottom-0 left-0 h-[2px] w-full origin-left"
        style={{ background: bar, animationDuration: duration + "ms" }}
      />
    </div>
  );
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[120] flex flex-col gap-2.5 pointer-events-none" aria-label="Notifications">
      {toasts.map((t) => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}

// ============================================================================
// Command Palette (Cmd/Ctrl+K)
// ============================================================================
function CommandPalette({ open, onClose, setActive, setTheme, openChat }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  const commands = React.useMemo(() => {
    const navItems = MODULES.map((m) => ({
      id: "go-" + m.id,
      group: "Go to",
      label: m.name,
      hint: m.blurb,
      icon: m.icon,
      run: () => setActive(m.id),
    }));
    const actionItems = [
      { id: "act-copilot", group: "Ask", label: "Open the co-founder chat", hint: "Persistent AI assistant", icon: Bot, run: () => openChat() },
      { id: "act-copilot-update", group: "Ask", label: "Draft this week's investor update", hint: "Copilot with live metrics", icon: Mail, run: () => openChat("Draft this week's investor update in 3 short paragraphs.") },
      { id: "act-copilot-risk", group: "Ask", label: "Summarize my biggest risk right now", hint: "One-paragraph diagnostic", icon: AlertTriangle, run: () => openChat("Summarize my biggest risk right now in one paragraph.") },
      { id: "act-copilot-hires", group: "Ask", label: "Plan my next 3 hires", hint: "Given current runway", icon: Users, run: () => openChat("Given my current runway and burn, what are the 3 hires I should make next and in what order?") },
      { id: "act-edit", group: "Data", label: "Edit company numbers", hint: "Change MRR, burn, churn…", icon: Edit3, run: () => setActive("company") },
      { id: "act-theme-light", group: "Appearance", label: "Switch to light theme", icon: Sun, run: () => setTheme("light") },
      { id: "act-theme-dark", group: "Appearance", label: "Switch to dark theme", icon: Moon, run: () => setTheme("dark") },
    ];
    return [...navItems, ...actionItems];
  }, [setActive, setTheme, openChat]);

  const query = q.trim().toLowerCase();
  const filtered = query
    ? commands.filter((c) => (c.label + " " + (c.hint || "") + " " + c.group).toLowerCase().includes(query)).slice(0, 14)
    : commands.filter((c, i) => c.group === "Ask" || (c.group === "Go to" && i < 6) || c.id === "act-edit").slice(0, 10);

  useEffect(() => { setIdx(0); }, [q, open]);
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(filtered.length - 1, i + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const c = filtered[idx]; if (c) { c.run(); onClose(); setQ(""); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, idx, onClose]);

  if (!open) return null;

  const groups = [];
  const groupMap = {};
  filtered.forEach((c, i) => {
    if (!groupMap[c.group]) { groupMap[c.group] = []; groups.push(c.group); }
    groupMap[c.group].push({ ...c, __i: i });
  });

  return (
    <div className="fixed inset-0 z-[75] flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl lp-glass rounded-2xl shadow-2xl overflow-hidden anim-fadeUp">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder-slate-400"
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto scroll-thin py-2">
          {groups.map((g) => (
            <div key={g}>
              <div className="px-4 pt-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{g}</div>
              {groupMap[g].map((c) => {
                const Icon = c.icon;
                const isActive = c.__i === idx;
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setIdx(c.__i)}
                    onClick={() => { c.run(); onClose(); setQ(""); }}
                    className={"w-full text-left flex items-center gap-3 px-4 py-2.5 transition " + (isActive ? "bg-violet-50" : "hover:bg-gray-50")}
                  >
                    <span className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " + (isActive ? "bg-violet-600 text-white" : "bg-gray-100 text-slate-500")}>
                      {Icon && <Icon size={15} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800 truncate">{c.label}</span>
                      {c.hint && <span className="block text-[11px] text-slate-400 truncate">{c.hint}</span>}
                    </span>
                    {isActive && <ArrowRight size={14} className="text-violet-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-6 py-10 text-center">
              <div className="text-sm font-bold text-slate-500 mb-1">No matches</div>
              <div className="text-xs text-slate-400">Try "runway", "dark mode", or "investor update".</div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50 text-[10.5px] font-semibold text-slate-500">
          <span className="flex items-center gap-3">
            <span><kbd className="text-slate-600 font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="text-slate-600 font-mono">↵</kbd> select</span>
          </span>
          <span className="flex items-center gap-1"><Sparkles size={11} className="text-violet-600" /> Powered by co-founder AI</span>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ payload, onClose }) {
  const [tab, setTab] = useState(0);
  const { openDetail } = useTheme();
  useEffect(() => {
    if (!payload) return;
    setTab(0);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payload, onClose]);

  if (!payload) return null;
  const { title, subtitle, kicker, rows, bar, note, stats, chart, actions, related, tabs } = payload;
  const activeTab = tabs && tabs[tab] ? tabs[tab] : null;
  const showRows = activeTab?.rows || rows;
  const showChart = activeTab?.chart || chart;
  const showNote = activeTab?.note || note;
  const showStats = activeTab?.stats || stats;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl anim-slideIn overflow-y-auto scroll-thin">
        <div className="bg-violet-600 px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {kicker && <div className="text-[11px] font-extrabold uppercase tracking-widest text-white/80 mb-1">{kicker}</div>}
              <h3 className="text-2xl font-black leading-tight">{title}</h3>
              {subtitle && <p className="text-sm text-white/85 mt-1">{subtitle}</p>}
            </div>
            <button onClick={onClose} aria-label="Close details" className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition shrink-0"><X size={18} /></button>
          </div>
          {bar && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-white/80">{bar.label}</span>
                <span className="text-sm font-black">{bar.value}</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: Math.min(100, Math.max(2, bar.pct)) + "%" }} />
              </div>
            </div>
          )}
          {stats && !tabs && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {stats.map((s, i) => (
                <div key={i} className="rounded-xl bg-white/12 backdrop-blur px-3 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">{s.label}</div>
                  <div className="text-base font-black mt-0.5">{s.value}</div>
                  {s.sub && <div className="text-[10px] text-white/75 mt-0.5">{s.sub}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {tabs && (
          <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
            {tabs.map((t, i) => (
              <button
                key={i}
                onClick={() => setTab(i)}
                className={"flex-1 px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition relative " + (tab === i ? "text-violet-600" : "text-slate-500 hover:text-slate-800")}
              >
                {t.label}
                {tab === i && <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-violet-600 rounded-full" />}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-5">
          {showStats && tabs && (
            <div className="grid grid-cols-3 gap-2">
              {showStats.map((s, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</div>
                  <div className={"text-base font-black mt-0.5 " + (s.tone === "red" ? "text-red-600" : s.tone === "amber" ? "text-amber-600" : s.tone === "emerald" ? "text-emerald-600" : "text-slate-900")}>{s.value}</div>
                  {s.sub && <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>}
                </div>
              ))}
            </div>
          )}

          {showChart && (
            <div>
              {showChart.title && <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">{showChart.title}</h4>}
              <div className="rounded-2xl border border-gray-200 bg-white p-3 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  {showChart.kind === "area" ? (
                    <AreaChart data={showChart.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id={"drawerG" + tab} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="x" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="y" name={showChart.name || "Value"} stroke="var(--brand)" strokeWidth={2} fill={"url(#drawerG" + tab + ")"} />
                    </AreaChart>
                  ) : showChart.kind === "bar" ? (
                    <BarChart data={showChart.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="x" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "var(--brand-soft-bg)" }} />
                      <Bar dataKey="y" name={showChart.name || "Value"} fill="var(--brand)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={showChart.data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                      <XAxis dataKey="x" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="y" name={showChart.name || "Value"} stroke="var(--brand)" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
              {showChart.caption && <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{showChart.caption}</p>}
            </div>
          )}

          {showRows && showRows.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">{section.heading}</h4>
                  {section.badge && <Badge tone={section.badgeTone || "slate"}>{section.badge}</Badge>}
                </div>
              )}
              <div className="rounded-2xl border border-gray-200 divide-y divide-gray-200 overflow-hidden">
                {section.items.map((r, ri) => (
                  <div key={ri} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <div className="min-w-0 flex items-center gap-2.5">
                      {r.dot && <span className={"w-2 h-2 rounded-full shrink-0 " + (r.tone === "red" ? "bg-red-500" : r.tone === "amber" ? "bg-amber-500" : r.tone === "emerald" ? "bg-emerald-500" : "bg-violet-500")} />}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{r.k}</div>
                        {r.sub && <div className="text-[11px] text-slate-400 mt-0.5">{r.sub}</div>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={"text-sm font-extrabold " + (r.tone === "red" ? "text-red-600" : r.tone === "amber" ? "text-amber-600" : r.tone === "emerald" ? "text-emerald-600" : "text-slate-900")}>{r.v}</div>
                      {r.delta && <div className={"text-[11px] font-semibold mt-0.5 " + (String(r.delta).startsWith("-") ? "text-red-600" : "text-emerald-600")}>{r.delta}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {showNote && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-center gap-2 mb-1.5"><Sparkles size={14} className="text-violet-600" /><span className="text-xs font-extrabold uppercase tracking-wide text-violet-700">Copilot read</span></div>
              <p className="text-sm text-slate-700 leading-relaxed">{showNote}</p>
            </div>
          )}

          {actions && actions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {actions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => { a.onClick && a.onClick(); if (a.close !== false) onClose(); }}
                  className={"flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition " + (a.primary ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm" : "border border-gray-300 hover:border-violet-400 hover:text-violet-700 text-slate-700 bg-white")}
                >
                  {a.icon && <a.icon size={15} />} {a.label}
                </button>
              ))}
            </div>
          )}

          {related && related.length > 0 && (
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-2">Related</h4>
              <div className="space-y-2">
                {related.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => openDetail(r.payload)}
                    className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/40 px-3.5 py-2.5 transition text-left group"
                  >
                    {r.icon && <r.icon size={16} className="text-violet-600 shrink-0" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-800 truncate">{r.title}</span>
                      {r.sub && <span className="block text-[11px] text-slate-400 truncate">{r.sub}</span>}
                    </span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

// ============================================================================
// App
// ============================================================================
export default function App() {
  // Boot on the marketing site. A guest user is still prepared in the
  // background (anonymous Firebase auth) so entering the dashboard is instant,
  // but the boot path no longer force-routes there — only an explicit user
  // action (Sign Up / Log In / Open dashboard) enters the app.
  const [route, setRoute] = useState("landing");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(DEV_AUTOLOGIN ? DEV_USER : { name: "Founder", email: null, role: "Founder" });
  const [active, setActive] = useState("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [company, setCompany] = useState(DEV_AUTOLOGIN ? DEV_COMPANY : COMPANY_INIT);
  const [authLoading, setAuthLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const fbRef = useRef(null);

  // Failsafe: if auth takes more than 4 seconds, go to landing page anyway
  useEffect(() => {
    if (DEV_AUTOLOGIN) return;
    const timeout = setTimeout(() => {
      setAuthLoading(false);
    }, 4000);
    return () => clearTimeout(timeout);
  }, []);

  // Initialize Firebase on mount. Skipped entirely under DEV_AUTOLOGIN —
  // otherwise onAuthChange fires with a null user and bounces us back to the
  // landing page, which is exactly the login gate we're bypassing.
  useEffect(() => {
    if (DEV_AUTOLOGIN) return;
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        fbRef.current = fb;
        unsub = fb.onAuthChange(async (fbUser) => {
          if (fbUser) {
            let prof = null;
            try { prof = await fb.getUserProfile(fbUser.uid); } catch {}
            const u = prof || {
              uid: fbUser.uid,
              name: fbUser.displayName || fbUser.email?.split("@")[0] || "Founder",
              email: fbUser.email,
              role: "Founder",
            };
            setUser(u);
            // No setRoute here: a returning session should not yank a visitor
            // off the marketing site. Entering the app is an explicit action.
            try {
              const saved = await fb.getCompanyData(fbUser.uid);
              if (saved && saved.onboarded) {
                setCompany((prev) => ({ ...prev, ...saved }));
                setNeedsOnboarding(false);
              } else {
                setNeedsOnboarding(true);
              }
            } catch {
              setNeedsOnboarding(true);
            }
          } else {
            // No user → start a guest session automatically and go straight
            // to the dashboard. onAuthChange re-fires with the guest user.
            try { await fb.loginAnonymously(); return; }
            catch (e) { console.warn("guest session unavailable:", e?.message || e); }
            // Guest auth unavailable (anonymous sign-in disabled, or offline).
            // Keep a local user so the dashboard is still fully usable; only
            // persistence is lost. Stay on the marketing site until asked.
            setUser({ name: "Founder", email: null, role: "Founder" });
          }
          setAuthLoading(false);
        });
      } catch (err) {
        console.error("Firebase failed to initialize:", err);
        // Offline / misconfigured: the whole app still runs on a local user,
        // just without persistence. Marketing site stays put.
        setUser({ name: "Founder", email: null, role: "Founder" });
        setAuthLoading(false);
      }
    })();
    return () => { if (unsub) unsub(); };
  }, []);

  // Save company data to Firestore (debounced) + snapshot this month's metrics for real charts
  useEffect(() => {
    if (!user?.uid || !fbRef.current) return;
    const t = setTimeout(() => {
      fbRef.current.saveCompanyData(user.uid, company).catch(() => {});
      if (company.onboarded) {
        fbRef.current.saveMetricSnapshot(user.uid, {
          mrr: company.mrr, customers: company.customers, churn: company.churn,
          netBurn: company.netBurn, cash: company.cash,
        }).catch(() => {});
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [company, user]);

  // Dark is the default look; an explicit choice (theme toggle) is remembered.
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("gc-theme") || "dark"; } catch { return "dark"; }
  });
  useEffect(() => {
    try { localStorage.setItem("gc-theme", theme); } catch { /* private mode */ }
  }, [theme]);
  const [detail, setDetail] = useState(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState(null);
  const [jarvisOpen, setJarvisOpen] = useState(true);
  const [jarvisMobile, setJarvisMobile] = useState(false);
  // The marketing site's copilot is a separate dock from the dashboard's. The
  // two can never both mount: showJarvis requires route === "app", and
  // PublicCopilot only renders in the public branch below.
  const [publicChatOpen, setPublicChatOpen] = useState(false);
  const [publicSeed, setPublicSeed] = useState(null);
  const openPublicChat = React.useCallback((prompt) => {
    // JarvisPanel re-fires on seed.at, so asking the same question twice still
    // sends. Called bare (nav button, launcher) it just opens the panel.
    if (prompt) setPublicSeed({ prompt, at: Date.now() });
    setPublicChatOpen(true);
  }, []);
  const openDetail = React.useCallback((payload) => setDetail(payload), []);
  const openCmd = React.useCallback(() => setCmdOpen(true), []);
  // Every existing openChat() call site (command palette, module CTAs) now
  // seeds the docked Jarvis instead of the old floating widget.
  const openChat = React.useCallback((prompt) => {
    setChatSeed({ prompt: prompt || null, at: Date.now() });
    setJarvisOpen(true);
    setJarvisMobile(true);
  }, []);

  // Toasts. notify({title, body, tone, actionLabel, onAction, duration}) from
  // anywhere via useTheme(). Capped so a burst can't bury the screen.
  const [toasts, setToasts] = useState([]);
  const notify = React.useCallback((t) => {
    const id = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
    setToasts((list) => [...list, { id, tone: "info", ...(typeof t === "string" ? { title: t } : t) }].slice(-4));
    return id;
  }, []);
  const dismissToast = React.useCallback((id) => setToasts((l) => l.filter((x) => x.id !== id)), []);

  const themeCtx = React.useMemo(
    () => ({ theme, setTheme, openDetail, openCmd, openChat, notify }),
    [theme, openDetail, openCmd, openChat, notify]
  );

  useEffect(() => { window.scrollTo(0, 0); }, [route, active]);

  // Live notifications → toasts. The first snapshot is the existing backlog,
  // so it only seeds the "seen" set; from then on any genuinely new unread
  // notification (a DM, a comment on your post) slides in on screen.
  const seenNotifs = useRef(null);
  useEffect(() => {
    if (!user?.uid) { seenNotifs.current = null; return; }
    let unsub;
    (async () => {
      try {
        const fb = await import("./firebase.js");
        unsub = fb.onUserNotifications(user.uid, (rows) => {
          if (seenNotifs.current === null) {
            seenNotifs.current = new Set(rows.map((r) => r.id));
            return;
          }
          rows
            .filter((r) => !seenNotifs.current.has(r.id) && !r.read)
            .reverse()
            .forEach((r) => {
              seenNotifs.current.add(r.id);
              notify({
                tone: r.type === "dm" ? "info" : "ai",
                title: r.type === "dm" ? "New message" : "New activity",
                body: r.text,
                actionLabel: r.to ? "Open" : null,
                onAction: r.to ? () => { setActive(r.to); setRoute("app"); } : null,
              });
            });
          rows.forEach((r) => seenNotifs.current.add(r.id));
        }, 12);
      } catch { /* offline or rules block it — toasts just stay quiet */ }
    })();
    return () => unsub && unsub();
  }, [user?.uid, notify]);

  // Decorative icons: hide them from assistive tech.
  //
  // Every icon here is a lucide <svg> sitting beside its own text label, so a
  // screen reader that announces it just says "graphic" and repeats what the
  // label already said. The audit found 75 such svgs. They come from a single
  // destructured `lucide-react` import used in 75 places, and ESM can't
  // re-export a Proxy under named bindings, so a wrapper module would mean
  // rewriting every call site. This sweep marks any svg that has no accessible
  // name of its own and is therefore decorative by definition. An icon that
  // SHOULD be announced can opt out by carrying its own aria-label or <title>.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.querySelectorAll("svg:not([aria-hidden]):not([aria-label])").forEach((s) => {
        if (s.querySelector("title")) return; // labelled on purpose
        s.setAttribute("aria-hidden", "true");
        s.setAttribute("focusable", "false");
      });
    });
    return () => cancelAnimationFrame(id);
  }, [route, active, needsOnboarding]);

  // Global Cmd/Ctrl+K to open command palette
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sign up / Log in buttons open the real AuthPage in the requested mode.
  const onAuth = (mode = "login") => {
    setAuthMode(mode);
    setRoute("auth");
  };
  // Guest entry (from AuthPage's "Continue as guest" link): anonymous
  // Firebase auth keeps a real uid so saving works, but the dashboard opens
  // either way — a Firebase misconfiguration costs persistence, never access.
  const onGuest = async () => {
    try {
      const fb = fbRef.current || await import("./firebase.js");
      await fb.loginAnonymously();
    } catch (e) {
      console.warn(
        "Anonymous sign-in unavailable, continuing without persistence:",
        e?.message || e,
        "\nEnable it at Firebase Console -> Authentication -> Sign-in method."
      );
      setUser((u) => u || { name: "Founder", email: null, role: "Founder" });
    }
    setActive("overview");
    setRoute("app");
  };
  const onLogin = async (u) => {
    // u comes from AuthPage — could be mock or real Firebase result
    if (u.uid) {
      // Already handled by onAuthStateChanged listener above
      setRoute("app");
      setActive("overview");
    } else {
      // Mock login (demo mode / Firebase not configured)
      setUser(u);
      setActive("overview");
      setRoute("app");
    }
  };
  const onLogout = async () => {
    try {
      const fb = await import("./firebase.js");
      await fb.logout();
    } catch { /* firebase not configured */ }
    setUser(null);
    setRoute("landing");
  };

  const appReducedMotion = usePrefersReducedMotion();
  const activeModule = MODULES.find((m) => m.id === active) || MODULES[0];
  // The Copilot module embeds its own full-width chat, so the dock stands down there.
  const showJarvis = route === "app" && user && !needsOnboarding && active !== "copilot";

  // Animated loading screen while Firebase initializes.
  // `?splash` forces it on so the screen can be previewed/demoed directly.
  if (authLoading || new URLSearchParams(window.location.search).has("splash")) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        <style>{`
          @keyframes lsSpin { to { transform: rotate(360deg); } }
          @keyframes lsFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
          @keyframes lsSweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(260%); } }
          @keyframes lsBreathe { 0%,100% { opacity: .35; transform: scale(1); } 50% { opacity: .6; transform: scale(1.12); } }
          @keyframes lsDot { 0%,80%,100% { transform: scale(.6); opacity: .3; } 40% { transform: scale(1); opacity: 1; } }
          @media (prefers-reduced-motion: reduce) {
            .ls-anim, .ls-anim * { animation: none !important; }
          }
        `}</style>
        <div className="ls-anim relative flex flex-col items-center gap-5">
          {/* soft aurora blobs breathing behind the mark */}
          <div aria-hidden="true" className="absolute -top-40 -left-48 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(124,58,237,.28), transparent 65%)", filter: "blur(30px)", animation: "lsBreathe 3.6s ease-in-out infinite" }} />
          <div aria-hidden="true" className="absolute -bottom-40 -right-48 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(217,70,239,.24), transparent 65%)", filter: "blur(30px)", animation: "lsBreathe 3.6s ease-in-out infinite 1.4s" }} />

          {/* logo mark inside an orbiting conic ring */}
          <div className="relative" style={{ width: 92, height: 92, animation: "lsFloat 3.2s ease-in-out infinite" }}>
            <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, transparent 0 70%, #7c3aed 82%, #d946ef 92%, transparent 100%)", animation: "lsSpin 1.4s linear infinite", WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))", mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))" }} />
            <div className="absolute inset-0 m-auto flex items-center justify-center" style={{ width: 52, height: 52, background: "#0a0a0a" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
            </div>
          </div>

          {/* wordmark with a slow shimmer */}
          <div className="relative text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.01em" }}>
            <ShinyText text="GenCopilot" speed={2.4} color="#0a0a0a" shineColor="#8b5cf6" spread={100} />
          </div>

          {/* indeterminate gradient sweep bar */}
          <div className="relative w-48 h-1 overflow-hidden rounded-full bg-gray-200/80" aria-hidden="true">
            <div className="absolute inset-y-0 w-2/5 rounded-full" style={{ background: "linear-gradient(90deg, #7c3aed, #d946ef)", animation: "lsSweep 1.15s cubic-bezier(.4,0,.2,1) infinite" }} />
          </div>

          {/* status line with pulsing dots */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500" role="status" aria-live="polite">
            Warming up your cockpit
            {[0, 1, 2].map((d) => (
              <span key={d} aria-hidden="true" className="w-1 h-1 rounded-full bg-violet-500 inline-block" style={{ animation: `lsDot 1.2s ease-in-out ${d * 0.18}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  let content;
  if (route === "app" && user && needsOnboarding) {
    content = (
      <OnboardingFlow
        user={user}
        onComplete={(c) => { setCompany((prev) => ({ ...prev, ...c })); setNeedsOnboarding(false); setActive("interview"); }}
      />
    );
  } else if (route === "app" && user) {
    const mod = activeModule;
    const locked = mod.finance && user.role === "Team Member";
    const View = MODULE_VIEWS[mod.id];
    content = (
      <div className="min-h-screen bg-gray-100 flex relative">
        {/* Ambient depth for the workspace: a slow dot field that reacts to the
            cursor, pinned behind everything and non-interactive. Same family as
            the marketing surface so the two halves feel like one product. */}
        {!appReducedMotion && (
          <div className="fixed inset-0 z-0 pointer-events-none opacity-[.55]" aria-hidden="true">
            <DotGrid dotSize={3} gap={34} baseColor="#e4e2ea" activeColor="#8b5cf6" proximity={120} shockRadius={200} shockStrength={3} className="w-full h-full" />
          </div>
        )}
        <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen lp-sidebar relative z-10">
          <SidebarNav active={active} setActive={setActive} user={user} onLogout={onLogout} />
        </aside>
        {mobileNav && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileNav(false)} />
            <div className="absolute inset-y-0 left-0 w-72 shadow-2xl lp-glass">
              <button onClick={() => setMobileNav(false)} className="absolute top-4 right-3 p-2 rounded-lg text-slate-400 hover:bg-gray-100" aria-label="Close menu"><X size={18} /></button>
              <SidebarNav active={active} setActive={setActive} user={user} onLogout={onLogout} onNavigate={() => setMobileNav(false)} />
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col relative z-10">
          <Topbar user={user} setUser={setUser} setActive={setActive} onLogout={onLogout} openMobileNav={() => setMobileNav(true)} company={company} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl w-full mx-auto">
            {locked ? <LockedPanel module={mod} /> : <View module={mod} setActive={setActive} user={user} company={company} setCompany={setCompany} />}
          </main>
        </div>
        {showJarvis && (
          <JarvisDock
            open={jarvisOpen}
            mobileOpen={jarvisMobile}
            onClose={() => setJarvisOpen(false)}
            onCloseMobile={() => setJarvisMobile(false)}
            module={mod}
            company={company}
            companyLine={companyLineFrom(company)}
            seed={chatSeed}
          />
        )}
        {/* The signup buddy, carried through the login form into the work
            itself. Jarvis answers questions on the right; Pilot sits bottom
            left and says nothing unless you've earned it. */}
        <WorkBuddy module={mod} user={user} />
      </div>
    );
  } else if (route === "auth") {
    content = <AuthPage mode={authMode} setMode={setAuthMode} onLogin={onLogin} onGuest={onGuest} goHome={() => setRoute("landing")} />;
  } else {
    const page = route === "about" ? <About onAuth={onAuth} /> : route === "contact" ? <Contact /> : <Landing go={setRoute} onAuth={onAuth} onAsk={openPublicChat} />;
    content = (
      <div className="min-h-screen bg-white flex flex-col">
        <PublicNav route={route} go={setRoute} onAuth={onAuth} onAskAI={openPublicChat} />
        {/* the marketing surface had no <main>: no skip target, no landmark */}
        <main id="main" className="flex-1">{page}</main>
        <FooterBig go={setRoute} onAuth={onAuth} />
        <PublicCopilot
          open={publicChatOpen}
          seed={publicSeed}
          onOpen={openPublicChat}
          onClose={() => setPublicChatOpen(false)}
          onAuth={onAuth}
        />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={themeCtx}>
      <div className={"lp-root theme-" + theme}>
        <style>{GLOBAL_CSS}</style>
        <ClickSpark sparkColor="#a78bfa" sparkSize={9} sparkRadius={18} sparkCount={8} duration={450}>
        {content}
        {showJarvis && (
          <button
            onClick={() => { setJarvisOpen(true); setJarvisMobile(true); }}
            className={
              "fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-violet-600 text-white pl-4 pr-5 py-3.5 shadow-xl hover:shadow-2xl hover:scale-105 transition-all " +
              (jarvisOpen ? "lg:hidden" : "")
            }
          >
            <span className="relative flex">
              <Sparkles size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 pulse-dot" />
            </span>
            <span className="text-sm font-bold">Ask Jarvis</span>
          </button>
        )}
        <DetailDrawer payload={detail} onClose={() => setDetail(null)} />
        <CommandPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          setActive={setActive}
          setTheme={setTheme}
          openChat={openChat}
        />
        </ClickSpark>
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ThemeContext.Provider>
  );
}
