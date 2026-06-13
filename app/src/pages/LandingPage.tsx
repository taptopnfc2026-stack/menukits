import { Link, Navigate, useLocation } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  CloudUpload,
  FileText,
  Globe2,
  Heart,
  Languages,
  Leaf,
  Menu,
  Monitor,
  Play,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  ThumbsUp,
  TriangleAlert,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const yellow = '#FFD400';
const amber = '#F2B900';
const ink = '#151526';
const soft = '#FFF8D6';

const menuItems = [
  ['Margherita', '$12.90', 'Vegetarian'],
  ['Salmon bowl', '$21.50', 'Fish, dairy'],
  ['Chicken salad', '$14.80', 'Gluten-free'],
  ['Chocolate cake', '$8.50', 'Eggs, milk'],
];

const pricingPlans = [
  { name: 'Free', price: '€0', note: 'Try MenuKits', features: ['1 menu', 'QR link', 'Basic allergens', 'Mobile preview'] },
  { name: 'Starter', price: '€19', note: 'For small restaurants', features: ['3 menus', 'Translations', 'PDF export', 'Analytics'] },
  { name: 'Professional', price: '€49', note: 'Most popular', featured: true, features: ['Unlimited menus', 'Menu hub', 'Brand styles', 'Priority support'] },
  { name: 'Business', price: '€99', note: 'For growing teams', features: ['Multi-location', 'Custom domain', 'Team access', 'API options'] },
];

function MenuKitsSymbol({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="10" y="12" width="34" height="42" rx="8" fill="#FFD400" stroke="#151526" strokeWidth="4" />
      <path d="M23 24h13M23 34h13M23 44h8" stroke="#151526" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 18v32" stroke="#151526" strokeWidth="4" strokeLinecap="round" />
      <path d="M54 18v8c0 5-6 5-6 0v-8" stroke="#151526" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M58 18v32" stroke="#151526" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function BrandIcon({
  icon: Icon,
  tone = 'yellow',
  size = 'md',
  label,
}: {
  icon: LucideIcon;
  tone?: 'yellow' | 'green' | 'white' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const wrap = {
    xs: 'h-7 w-7 rounded-lg',
    sm: 'h-9 w-9 rounded-xl',
    md: 'h-11 w-11 rounded-2xl',
    lg: 'h-14 w-14 rounded-2xl',
  }[size];
  const iconSize = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }[size];
  const tones = {
    yellow: 'border-[#E8C51C] bg-[#FFD400] text-[#151526] shadow-[0_8px_20px_rgba(255,212,0,0.26)]',
    green: 'border-green-200 bg-green-100 text-green-700',
    white: 'border-[#eeeaf7] bg-white text-[#151526]',
    dark: 'border-[#151526] bg-[#151526] text-[#FFD400]',
  }[tone];

  return (
    <span className={`inline-flex shrink-0 items-center justify-center border ${wrap} ${tones}`} aria-label={label}>
      <Icon className={iconSize} strokeWidth={2.65} />
    </span>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <MenuKitsSymbol className="h-7 w-7" />
      <span className="text-[18px] font-black tracking-tight text-[#151526]">Menu<span className="text-[#F2B900]">Kits</span></span>
    </Link>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = ['Features', 'For Restaurants', 'Use Cases', 'Pricing', 'Resources'];
  return (
    <header className="sticky top-0 z-50 border-b border-[#eceaf8] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[13px] font-bold text-slate-500 md:flex">
          {links.map((link) => <a key={link} href={`#${link.toLowerCase().replaceAll(' ', '-')}`} className="transition-colors hover:text-[#151526]">{link}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/register">
            <Button size="sm" className="h-10 rounded-xl bg-[#FFD400] px-6 text-[13px] font-black text-[#151526] shadow-[0_12px_24px_rgba(255,212,0,0.25)] hover:bg-[#F2B900]">
              Get started
            </Button>
          </Link>
          <button className="rounded-xl border border-slate-200 p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[#eceaf8] bg-white px-4 py-3 md:hidden">
          {links.map((link) => <a key={link} href={`#${link.toLowerCase().replaceAll(' ', '-')}`} className="block py-2 text-sm font-bold text-slate-600">{link}</a>)}
        </div>
      )}
    </header>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#F5DD72] bg-[#FFF6C7] px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#9A7400]">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: ReactNode; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-[760px] text-center">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-[clamp(2.3rem,4.6vw,4.25rem)] font-black leading-[0.98] tracking-[-0.045em] text-[#151526]">{title}</h2>
      {subtitle && <p className="mx-auto mt-5 max-w-[620px] text-[16px] font-medium leading-7 text-slate-500">{subtitle}</p>}
    </div>
  );
}

function PersonPhoto({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`absolute bottom-0 ${side === 'left' ? 'left-0 rounded-br-[48px]' : 'right-0 rounded-bl-[48px]'} hidden h-[330px] w-[260px] overflow-hidden md:block`}>
      <div className={`h-full w-full bg-[radial-gradient(circle_at_50%_20%,#fff_0_16%,transparent_17%),linear-gradient(135deg,#F4C17A,#FFF4D0_48%,#31271F)] ${side === 'right' ? 'scale-x-[-1]' : ''}`}>
        <div className="absolute bottom-0 left-1/2 h-44 w-36 -translate-x-1/2 rounded-t-[72px] bg-[#222]" />
        <div className="absolute bottom-28 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-[#D69A68]" />
        <div className="absolute bottom-[190px] left-1/2 h-16 w-32 -translate-x-1/2 rounded-t-full bg-[#2B211B]" />
      </div>
    </div>
  );
}

function MenuCard({ tone }: { tone: 'diner' | 'restaurant' }) {
  const isDiner = tone === 'diner';
  return (
    <div className={`mk-hover-lift relative min-h-[500px] overflow-hidden rounded-[36px] border p-7 mk-glass-border ${isDiner ? 'border-[#eee9ff] bg-[#fbfaff]' : 'border-[#dcefd8] bg-[#f8fff5]'}`}>
      <div className="mk-float relative z-10 mx-auto max-w-[340px] rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_rgba(21,21,38,0.14)]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandIcon icon={isDiner ? Heart : Store} tone={isDiner ? 'yellow' : 'green'} size="sm" />
            <div>
              <p className="text-[15px] font-black text-[#151526]">{isDiner ? 'For Diners' : 'For Restaurants'}</p>
              <p className="text-[12px] font-semibold text-slate-400">{isDiner ? 'Clear choices' : 'Live control'}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-black ${isDiner ? 'bg-[#FFF6C7] text-[#9A7400]' : 'bg-green-100 text-green-700'}`}>Live</span>
        </div>
        <div className="space-y-3">
          {menuItems.map(([name, price, tag]) => (
            <div key={`${tone}-${name}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-[#FFFDF0]">
              <div className={`h-12 w-12 rounded-2xl ${isDiner ? 'bg-[#FFD400]' : 'bg-green-200'}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-black text-[#151526]">{name}</p>
                <p className="truncate text-[12px] font-semibold text-slate-400">{tag}</p>
              </div>
              <span className="text-[14px] font-black text-[#151526]">{price}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[Leaf, ShieldCheck, Globe2, CircleHelp].map((Icon, index) => (
            <BrandIcon key={index} icon={Icon} tone="white" size="sm" />
          ))}
        </div>
      </div>
      <div className="relative z-10 mx-auto mt-7 w-fit rounded-full bg-white px-5 py-3 text-[12px] font-black text-slate-500 shadow-[0_12px_28px_rgba(21,21,38,0.1)]">
        {isDiner ? 'Understand every dish before ordering' : 'Update menus and allergens instantly'}
      </div>
      <PersonPhoto side={isDiner ? 'left' : 'right'} />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_18%,#FFF7C4_0%,#FFFFFF_38%,#fbfaff_100%)] px-5 pb-20 pt-16 sm:pb-28">
      <div className="absolute left-1/2 top-[190px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#FFD400]/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1180px]">
        <div className="mk-rise text-center">
          <h1 className="text-[clamp(3.4rem,7.6vw,6.8rem)] font-black leading-[0.9] tracking-[-0.065em] text-[#151526]">
            Order with confidence.
          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-[18px] font-semibold leading-8 text-slate-500">
            Smart menus for every diner. Powerful tools for every restaurant.
          </p>
        </div>
        <div className="mt-12 grid items-center gap-8 md:grid-cols-[1fr_112px_1fr]">
          <MenuCard tone="diner" />
          <div className="hidden items-center justify-center md:flex">
            <div className="mk-float flex h-24 w-24 items-center justify-center rounded-[30px] border border-[#f1dfa0] bg-white shadow-[0_24px_46px_rgba(31,28,72,0.16)]">
              <QrCode className="h-12 w-12 text-[#F2B900]" strokeWidth={2.7} />
            </div>
          </div>
          <MenuCard tone="restaurant" />
        </div>
        <div className="mx-auto mt-9 flex max-w-[720px] flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[14px] font-bold text-slate-500">
          {[
            [Globe2, 'Multi-language'],
            [ShieldCheck, 'Allergen clarity'],
            [FileText, 'Paper menus'],
            [BarChart3, 'Real data'],
          ].map(([Icon, text]) => {
            const TypedIcon = Icon as typeof Globe2;
            return (
              <span key={String(text)} className="flex items-center gap-1.5">
                <TypedIcon className="h-4 w-4 text-[#F2B900]" strokeWidth={2.7} />
                {String(text)}
              </span>
            );
          })}
        </div>
        <div className="mt-5 flex justify-center">
          <Link to="/register">
            <Button className="h-14 rounded-2xl bg-[#FFD400] px-8 text-[18px] font-black text-[#151526] shadow-[0_18px_32px_rgba(255,212,0,0.32)] transition-transform hover:-translate-y-0.5 hover:bg-[#F2B900]">
              Start free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ConfusingSection() {
  const dinerProblems = [
    ['No translations', 'Guests cannot understand dishes.'],
    ['Hidden allergens', 'Risks are hard to spot quickly.'],
    ['Paper-only menus', 'Outdated items cause confusion.'],
    ['No confidence', 'Guests hesitate before ordering.'],
  ];
  const restaurantProblems = [
    ['Manual updates', 'Every print change takes time.'],
    ['Hard to explain', 'Staff answer the same questions.'],
    ['No digital hub', 'Menus are scattered everywhere.'],
    ['No insights', 'Owners cannot see what works.'],
  ];
  return (
    <section id="features" className="bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionTitle
          eyebrow="The confusion problem"
          title={<>Ordering food shouldn&apos;t be <span className="text-[#F2B900]">this confusing.</span></>}
          subtitle="Millions of diners face uncertainty every day. Restaurants struggle to keep menus clear, updated, and accessible."
        />
        <div className="mt-12 space-y-7">
          <ProblemPanel title="For Diners" subtitle="Unclear menus create hesitation, anxiety, and bad choices." items={dinerProblems} side="left" />
          <ProblemPanel title="For Restaurants" subtitle="Menu operations create repetitive questions and wasted time." items={restaurantProblems} side="right" />
        </div>
        <div className="mx-auto mt-7 flex max-w-[880px] flex-col gap-4 rounded-[24px] border border-[#efe9c8] bg-[#FFFDF0] p-5 text-center text-[14px] font-black text-[#8A6500] shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span>Unclear menus create uncertainty for diners and extra work for restaurants.</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">It&apos;s time for a smarter, simpler solution.</span>
        </div>
      </div>
    </section>
  );
}

function ProblemPanel({ title, subtitle, items, side }: { title: string; subtitle: string; items: string[][]; side: 'left' | 'right' }) {
  return (
    <div className="mk-hover-lift relative rounded-[32px] border border-[#eeeaf7] bg-white p-7 shadow-[0_18px_46px_rgba(31,28,72,0.08)]">
      <div className={`absolute top-7 hidden h-48 w-56 rounded-[24px] bg-[linear-gradient(135deg,#FFD400,#fff,#E9C28C)] md:block ${side === 'left' ? 'left-7' : 'right-7'}`} />
      <div className={`${side === 'left' ? 'md:ml-[260px]' : 'md:mr-[260px]'}`}>
        <p className="flex items-center gap-2 text-[16px] font-black text-[#D88300]">
          <TriangleAlert className="h-4 w-4" strokeWidth={2.7} />
          {title}
        </p>
        <p className="mt-2 text-[14px] font-semibold text-slate-400">{subtitle}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {items.map(([head, desc]) => (
            <div key={head} className="rounded-[22px] border border-[#eeeaf7] bg-[#fbfaff] p-5 transition-transform hover:-translate-y-1">
              <BrandIcon icon={CircleHelp} tone="yellow" size="sm" />
              <h3 className="mt-4 text-[15px] font-black text-[#151526]">{head}</h3>
              <p className="mt-2 text-[13px] font-medium leading-5 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SolutionSection() {
  return (
    <section id="for-restaurants" className="bg-[#fbfaff] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionTitle
          eyebrow="The solution"
          title={<>One Tap. Two Powerful <span className="text-[#F2B900]">Solutions.</span></>}
          subtitle="MenuKits connects diners and restaurants through one clear, scan-ready system."
        />
        <div className="mt-12 grid gap-7 md:grid-cols-2">
          <SolutionCard title="For Diners" accent="bg-[#FFF6C7]" icon={Heart} />
          <SolutionCard title="For Restaurants" accent="bg-green-100" icon={Store} />
        </div>
        <div className="mt-7 grid gap-4 rounded-[26px] border border-[#eeeaf7] bg-white p-5 shadow-sm sm:grid-cols-5">
          {[
            ['Allergen filter', ShieldCheck],
            ['30+ languages', Globe2],
            ['Table ordering', QrCode],
            ['Automatic PDF', FileText],
            ['Real analytics', BarChart3],
          ].map(([label, Icon]) => {
            const TypedIcon = Icon as typeof ShieldCheck;
            return (
              <div key={String(label)} className="rounded-2xl px-3 py-4 text-center transition-colors hover:bg-[#FFFDF0]">
                <BrandIcon icon={TypedIcon} tone="yellow" size="sm" />
                <p className="mt-3 text-[13px] font-black text-slate-600">{String(label)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SolutionCard({ title, accent, icon: Icon }: { title: string; accent: string; icon: typeof Heart }) {
  return (
    <div className="mk-hover-lift rounded-[32px] border border-[#eeeaf7] bg-white p-7 shadow-[0_18px_46px_rgba(31,28,72,0.08)]">
      <div className="mb-6 flex items-center gap-4">
        <BrandIcon icon={Icon} tone={accent.includes('green') ? 'green' : 'yellow'} size="sm" />
        <div>
          <h3 className="text-[22px] font-black text-[#151526]">{title}</h3>
          <p className="text-[14px] font-semibold text-slate-400">{title === 'For Diners' ? 'Order with clarity' : 'Manage with confidence'}</p>
        </div>
      </div>
      <div className="rounded-[26px] bg-[#f7f7fb] p-6">
        <div className="mx-auto max-w-[330px] rounded-[26px] bg-white p-5 shadow-lg">
          <div className="mb-4 flex justify-between">
            <span className="rounded-full bg-[#FFF6C7] px-3 py-1 text-[10px] font-black text-[#8A6500]">Live menu</span>
            <QrCode className="h-5 w-5 text-[#151526]" strokeWidth={2.7} />
          </div>
          <div className="space-y-2">
            {menuItems.slice(0, 3).map(([name, price, tag]) => (
              <div key={`${title}-${name}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                <div className="h-11 w-11 rounded-xl bg-[#FFD400]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-black text-[#151526]">{name}</p>
                  <p className="truncate text-[11px] font-semibold text-slate-400">{tag}</p>
                </div>
                <span className="text-[13px] font-black">{price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 rounded-2xl bg-[#FFFDF0] px-4 py-3 text-[13px] font-black text-[#8A6500]">
        {title === 'For Diners' ? 'Understand every dish before ordering.' : 'Everything in one platform.'}
      </p>
    </div>
  );
}

function ValuesSection() {
  return (
    <section id="use-cases" className="bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionTitle
          eyebrow="Our brand values"
          title={<>Built on values. <br /><span className="text-[#F2B900]">Focused on people.</span></>}
          subtitle="At MenuKits, every feature is designed to reduce uncertainty and create a better dining moment."
        />
        <div className="relative mx-auto mt-14 min-h-[540px] max-w-[900px]">
          <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#eeeaf7]" />
          <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#eeeaf7]" />
          <div className="mk-float absolute left-1/2 top-1/2 flex h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[radial-gradient(circle,#FFD400_0%,#F2B900_68%,#C89800_100%)] text-center text-[#151526] shadow-[0_24px_60px_rgba(255,212,0,0.35)]">
            <ShieldCheck className="h-9 w-9" strokeWidth={2.7} />
            <h3 className="mt-2 text-2xl font-black leading-none">Order with confidence.</h3>
            <p className="mt-2 max-w-[130px] text-[10px] font-bold leading-4">Clear menus. Safer choices. Better experiences.</p>
          </div>
          <ValueBubble className="left-1/2 top-0 -translate-x-1/2" icon={ShieldCheck} title="Accessibility" />
          <ValueBubble className="bottom-8 left-10" icon={Leaf} title="Inclusivity" />
          <ValueBubble className="bottom-8 right-10" icon={Zap} title="Simplicity" />
          <ValueNote className="left-0 top-[170px]" title="Dining experiences should work for everyone." />
          <ValueNote className="right-0 top-[170px]" title="Restaurants should manage menus with confidence." />
          <div className="absolute bottom-0 left-1/2 flex w-full max-w-[720px] -translate-x-1/2 items-center justify-center gap-10 rounded-[24px] border border-[#eeeaf7] bg-white p-5 shadow-sm">
            {[ShieldCheck, Leaf, Globe2, Heart].map((Icon, index) => (
              <BrandIcon key={index} icon={Icon} tone="white" size="sm" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueBubble({ className, icon: Icon, title }: { className: string; icon: typeof ShieldCheck; title: string }) {
  return (
    <div className={`absolute flex flex-col items-center ${className}`}>
      <BrandIcon icon={Icon} tone="yellow" size="lg" />
      <span className="mt-2 text-[11px] font-black text-slate-600">{title}</span>
    </div>
  );
}

function ValueNote({ className, title }: { className: string; title: string }) {
  return (
    <div className={`absolute hidden max-w-[170px] rounded-2xl border border-[#eeeaf7] bg-white p-4 text-[10px] font-bold leading-4 text-slate-500 shadow-md sm:block ${className}`}>
      {title}
    </div>
  );
}

function PromiseSection() {
  const items = [
    ['We make menus clear and readable.', Languages],
    ['We make menus accessible to all.', Globe2],
    ['We keep guests safe and informed.', ShieldCheck],
    ['We help restaurants save time.', Store],
    ['We are with you every step.', Heart],
  ];
  return (
    <section className="bg-[#fbfaff] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionTitle
          eyebrow="Our customer promise"
          title={<>We promise a better <br /> menu experience <span className="text-[#F2B900]">for everyone.</span></>}
          subtitle="MenuKits is committed to help diners order with confidence and help restaurants grow with ease."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-5">
          {items.map(([label, Icon], index) => {
            const TypedIcon = Icon as typeof Languages;
            return (
              <div key={String(label)} className="mk-hover-lift rounded-[24px] border border-[#eeeaf7] bg-white p-5 text-center shadow-sm">
                <BrandIcon icon={TypedIcon} tone="yellow" size="md" />
                <h3 className="mt-4 text-[15px] font-black leading-tight text-[#151526]">{String(label)}</h3>
                <div className="mt-5 h-32 rounded-2xl bg-[linear-gradient(135deg,#FFD400,#fff,#f3f0ff)]" />
                {index === 2 && <span className="mt-3 inline-block rounded-full bg-[#FFF6C7] px-2 py-1 text-[9px] font-black text-[#8A6500]">Recommended</span>}
              </div>
            );
          })}
        </div>
        <div className="mt-7 grid gap-4 rounded-[24px] border border-[#eeeaf7] bg-white p-5 shadow-sm sm:grid-cols-5">
          {['Reliable clarity', 'Privacy', 'Simple setup', 'Trusted', 'Consistent'].map((item) => (
            <div key={item} className="text-center text-[13px] font-black text-slate-600">
              <BrandIcon icon={Heart} tone="white" size="sm" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  return (
    <section className="bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionTitle eyebrow="Social proof" title={<>Trusted by restaurants. <br /><span className="text-[#F2B900]">Loved by diners.</span></>} subtitle="Real stories from people using MenuKits every day." />
        <div className="mt-12 grid gap-5 rounded-[34px] bg-[#151526] p-5 text-white shadow-[0_28px_70px_rgba(21,21,38,0.20)] md:grid-cols-[1.15fr_0.85fr]">
          <VideoCard large />
          <div className="grid gap-4">
            <VideoCard />
            <VideoCard />
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] font-bold text-slate-400">Join thousands of restaurants and millions of happy diners.</p>
      </div>
    </section>
  );
}

function VideoCard({ large = false }: { large?: boolean }) {
  return (
    <div className={`mk-hover-lift relative overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#2a241f,#151526_58%,#3c2d10)] ${large ? 'min-h-[350px]' : 'min-h-[170px]'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_26%,rgba(255,212,0,0.45),transparent_24%)]" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFD400]">
          <Play className="ml-0.5 h-5 w-5 fill-[#151526] text-[#151526]" strokeWidth={2.7} />
        </div>
        <p className={`${large ? 'text-3xl' : 'text-lg'} max-w-[460px] font-black leading-tight`}>
          “MenuKits has transformed the way we present our menu.”
        </p>
        <div className="mt-2 flex gap-0.5">
          {Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-[#FFD400] text-[#FFD400]" />)}
        </div>
      </div>
    </div>
  );
}

function DemoSection() {
  return (
    <section className="bg-[#fbfaff] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[920px] text-center">
        <Eyebrow>For restaurant owners</Eyebrow>
        <h2 className="text-[clamp(3rem,6vw,5.5rem)] font-black leading-[0.92] tracking-[-0.06em] text-[#151526]">
          Ready to grow your restaurant? <span className="text-[#F2B900]">Book a demo today.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[640px] text-[17px] font-semibold leading-8 text-slate-500">
          See how MenuKits can transform your menu and bring more happy diners to your restaurant.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            ['See it in Action', 'Live demo tailored to your restaurant.'],
            ['Better Menus. More Orders.', 'Improve clarity and confidence.'],
            ['Loved by Restaurants', 'Join thousands of successful venues.'],
          ].map(([title, desc], index) => (
            <div key={title} className="mk-hover-lift rounded-[24px] bg-white p-6 shadow-sm">
              {[CalendarDays, BarChart3, ThumbsUp][index] && (() => {
                const Icon = [CalendarDays, BarChart3, ThumbsUp][index];
                return <BrandIcon icon={Icon} tone="yellow" size="lg" />;
              })()}
              <h3 className="mt-4 text-[16px] font-black text-[#151526]">{title}</h3>
              <p className="mt-2 text-[13px] font-medium leading-5 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
        <Link to="/register">
          <Button size="lg" className="mt-7 h-14 rounded-xl bg-[#FFD400] px-10 text-base font-black text-[#151526] shadow-[0_16px_30px_rgba(255,212,0,0.35)] hover:bg-[#F2B900]">
            <CalendarDays className="mr-2 h-5 w-5" />
            Book a Demo Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <p className="mt-3 text-[11px] font-black italic text-[#9A7400]">Takes less than 1 minute!</p>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section id="resources" className="bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Eyebrow>Our mission</Eyebrow>
            <h2 className="text-[clamp(2.6rem,5vw,4.8rem)] font-black leading-[0.95] tracking-[-0.055em] text-[#151526]">
              We&apos;re on a mission to simplify dining for everyone.
            </h2>
            <p className="mt-6 text-[16px] font-semibold leading-8 text-slate-500">
              MenuKits helps restaurants create smart, multilingual menus that reduce uncertainty and improve service.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['International clarity', 'Inclusive menu design', 'Public trust labels', 'Easy management'].map((item) => (
                <div key={item} className="mk-hover-lift rounded-[24px] border border-[#eeeaf7] p-5">
                  <BrandIcon icon={Check} tone="yellow" size="sm" />
                  <h3 className="mt-3 text-[15px] font-black text-[#151526]">{item}</h3>
                  <p className="mt-2 text-[13px] font-medium leading-5 text-slate-500">Designed for real restaurant workflows.</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-[220px] rounded-[24px] bg-[linear-gradient(135deg,#F6E6B8,#fff,#C8E0F4)] shadow-sm" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#eeeaf7] bg-[#fbfaff] p-5">
                <p className="text-[11px] font-black text-[#151526]">International ready</p>
                <div className="mt-4 flex h-20 items-center justify-center rounded-full bg-white text-2xl font-black text-[#F2B900]">70%</div>
                <p className="mt-3 text-[10px] font-medium leading-4 text-slate-500">of guests say clarity improves their choice.</p>
              </div>
              <div className="rounded-2xl border border-[#eeeaf7] bg-white p-5">
                <p className="text-[11px] font-black text-[#151526]">Trusted by teams</p>
                <div className="mt-4 h-20 rounded-xl bg-[linear-gradient(135deg,#FFD400,#fff)]" />
                <p className="mt-3 text-[10px] font-medium leading-4 text-slate-500">Managers can update menus faster.</p>
              </div>
            </div>
          </div>
        </div>
        <h3 className="mt-10 text-center text-[20px] font-black text-[#151526]">We take care of everything.</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {['Menu migration', 'Multilingual translation', 'QR code generation', 'EU-ready support'].map((item) => (
            <div key={item} className="rounded-2xl bg-[#fbfaff] p-4 text-center text-[11px] font-black text-slate-600">
              <BrandIcon icon={Sparkles} tone="white" size="sm" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-[#fbfaff] px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <SectionTitle eyebrow="Simple pricing" title={<>Simple, Transparent Pricing</>} subtitle="Everything you need to create, manage, and grow your digital menu." />
        <div className="mt-8 overflow-hidden rounded-[24px] border border-[#eeeaf7] bg-white shadow-sm">
          <div className="grid grid-cols-[1.15fr_repeat(4,1fr)] border-b border-[#eeeaf7] text-center text-[11px] font-black text-[#151526]">
            <div className="bg-[#fbfaff] p-4 text-left">Features</div>
            {pricingPlans.map((plan) => <div key={plan.name} className={`p-4 ${plan.featured ? 'bg-[#FFF6C7]' : ''}`}>{plan.name}</div>)}
          </div>
          <div className="grid grid-cols-[1.15fr_repeat(4,1fr)] text-center text-[11px]">
            <div className="space-y-4 bg-[#fbfaff] p-4 text-left font-bold text-slate-500">
              {['Price', 'Menu management', 'Translations', 'QR codes', 'PDF menus', 'Analytics', 'Support'].map((row) => <p key={row}>{row}</p>)}
            </div>
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`space-y-4 p-4 ${plan.featured ? 'bg-[#FFFDF0]' : ''}`}>
                <p className="text-xl font-black text-[#151526]">{plan.price}</p>
                {plan.features.slice(0, 5).map((feature) => (
                  <p key={feature} className="font-bold text-slate-500">{feature}</p>
                ))}
                <BrandIcon icon={Check} tone="white" size="xs" />
                <Link to="/register">
                  <Button className={`mt-1 h-8 rounded-lg px-3 text-[10px] font-black ${plan.featured ? 'bg-[#FFD400] text-[#151526] hover:bg-[#F2B900]' : 'bg-white text-[#151526] hover:bg-[#FFF6C7]'} border border-[#eeeaf7]`}>
                    Choose plan
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-7 rounded-[24px] bg-[#151526] p-6 text-center text-white">
          <p className="text-xl font-black">Ready to modernize your restaurant menu?</p>
          <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button className="rounded-xl bg-[#FFD400] font-black text-[#151526] hover:bg-[#F2B900]">Start free</Button>
            </Link>
            <a href="#for-restaurants">
              <Button variant="outline" className="rounded-xl border-white/20 bg-transparent font-black text-white hover:bg-white/10">Book a demo</Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQFooter() {
  const [open, setOpen] = useState(0);
  const faqs = [
    ['Can I replace photos or videos later?', 'Yes. The blocks are ready for future uploads or embeds.'],
    ['Is this deployed?', 'No. This version is local preview only until you approve it.'],
  ];
  return (
    <>
      <section className="bg-white px-4 py-10">
        <div className="mx-auto max-w-[760px]">
          {faqs.map(([q, a], index) => (
            <div key={q} className="mb-3 rounded-2xl border border-[#eeeaf7] bg-white">
              <button className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-black text-[#151526]" onClick={() => setOpen(open === index ? -1 : index)}>
                {q}
                <ChevronDown className={`h-4 w-4 transition ${open === index ? 'rotate-180' : ''}`} />
              </button>
              {open === index && <p className="px-5 pb-4 text-xs font-medium leading-5 text-slate-500">{a}</p>}
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-[#eeeaf7] bg-white px-4 py-7">
        <div className="mx-auto flex max-w-[980px] flex-col items-center justify-between gap-3 text-[11px] font-bold text-slate-400 sm:flex-row">
          <Logo />
          <p>© 2026 MenuKits. Order with confidence.</p>
          <div className="flex gap-4">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/imprint">Imprint</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const isPreview = new URLSearchParams(location.search).get('preview') === 'landing';

  if (!isLoading && isAuthenticated && !isPreview) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#151526]" style={{ ['--mk-yellow' as string]: yellow, ['--mk-amber' as string]: amber, ['--mk-ink' as string]: ink, ['--mk-soft' as string]: soft }}>
      <Navbar />
      <main>
        <Hero />
        <ConfusingSection />
        <SolutionSection />
        <ValuesSection />
        <PromiseSection />
        <SocialProofSection />
        <DemoSection />
        <MissionSection />
        <PricingSection />
        <FAQFooter />
      </main>
    </div>
  );
}
