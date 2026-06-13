import { Link, Navigate, useLocation } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Globe2,
  Heart,
  Image,
  Languages,
  Leaf,
  Menu,
  MonitorSmartphone,
  Play,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  UploadCloud,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const plans = [
  {
    name: 'Free',
    price: '€0',
    note: 'Start with one menu',
    features: ['1 digital menu', 'QR menu hub', 'Basic allergens', 'Mobile preview'],
  },
  {
    name: 'Starter',
    price: '€19',
    note: 'For independent restaurants',
    features: ['3 menus', 'Translations', 'PDF export', 'Basic analytics'],
  },
  {
    name: 'Professional',
    price: '€49',
    note: 'Best for growing teams',
    featured: true,
    features: ['Unlimited menus', 'AI menu tools', 'Menu hub branding', 'Priority support'],
  },
  {
    name: 'Business',
    price: '€99',
    note: 'For multi-location brands',
    features: ['Multi-location', 'Custom domain', 'Team access', 'API options'],
  },
];

const dishes = [
  ['Terrine de Foie Gras', '24.90', 'Starter'],
  ["6 escargots au beurre d'ail", '14.95', 'Milk, Molluscs'],
  ['Assiette de saumon fume', '17.95', 'Fish, Gluten'],
  ['Mesclun Mixed Green Salad', '12.90', 'Vegetarian'],
];

function MenuKitsSymbol({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="9" y="9" width="46" height="46" rx="12" fill="#FFD400" />
      <path d="M21 18v28M18 18v10c0 5 6 5 6 0V18M34 19l12 12M46 19 34 31M40 25v21" fill="none" stroke="#151526" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="MenuKits home">
      <MenuKitsSymbol />
      <span className="text-xl font-extrabold text-[#151526]">
        Menu<span className="text-[#F2B900]">Kits</span>
      </span>
    </Link>
  );
}

function IconBadge({ icon: Icon, tone = 'yellow' }: { icon: LucideIcon; tone?: 'yellow' | 'dark' | 'soft' | 'green' }) {
  const tones = {
    yellow: 'bg-[#FFD400] text-[#151526] border-[#EAC100]',
    dark: 'bg-[#151526] text-[#FFD400] border-[#151526]',
    soft: 'bg-[#FFF7CC] text-[#9A7400] border-[#F3DD77]',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${tones[tone]}`}>
      <Icon className="h-5 w-5" strokeWidth={2.5} />
    </span>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    ['Features', '#features'],
    ['Restaurants', '#restaurants'],
    ['Workflow', '#workflow'],
    ['Pricing', '#pricing'],
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="hover:text-[#151526]">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden text-sm font-semibold text-slate-600 hover:text-[#151526] sm:block">
            Sign in
          </Link>
          <Link to="/register">
            <Button className="h-10 rounded-md bg-[#FFD400] px-5 font-bold text-[#151526] hover:bg-[#F2B900]">
              Get started
            </Button>
          </Link>
          <button className="rounded-md border border-slate-200 p-2 md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Open navigation">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {links.map(([label, href]) => (
            <a key={label} href={href} className="block py-2 text-sm font-semibold text-slate-600">
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

function SectionHeader({ label, title, copy }: { label?: string; title: ReactNode; copy?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {label && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-[#F2D65A] bg-[#FFF7CC] px-3 py-2 text-xs font-extrabold uppercase text-[#8A6500]">
          <Sparkles className="h-4 w-4" />
          {label}
        </div>
      )}
      <h2 className="text-4xl font-extrabold leading-tight text-[#151526] md:text-5xl">{title}</h2>
      {copy && <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">{copy}</p>}
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="relative mx-auto w-[286px] rounded-[34px] border-[10px] border-[#171717] bg-white shadow-2xl">
      <div className="absolute left-1/2 top-3 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="overflow-hidden rounded-[24px] pt-12">
        <div className="h-28 bg-[linear-gradient(135deg,#1f1a16,#FFD400)] px-5 pt-8 text-white">
          <p className="text-sm font-bold">My Restaurant</p>
          <p className="mt-1 text-xs text-white/75">Digital menu hub</p>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex gap-2 overflow-hidden">
            {['Starters', 'Mains', 'Desserts'].map((item, index) => (
              <span key={item} className={`rounded-full px-3 py-2 text-xs font-bold ${index === 0 ? 'bg-[#151526] text-white' : 'border border-slate-200 text-slate-600'}`}>
                {item}
              </span>
            ))}
          </div>
          {dishes.slice(0, 3).map(([name, price, tag]) => (
            <div key={name} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex gap-3">
                <div className="h-14 w-14 rounded-md bg-[#FFF4B8]">
                  <div className="flex h-full w-full items-center justify-center text-[#9A7400]">
                    <Image className="h-5 w-5" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-extrabold leading-5 text-[#151526]">{name}</p>
                    <p className="text-sm font-extrabold">{price}</p>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500">{tag}</p>
                </div>
              </div>
              <button className="mt-3 rounded-full bg-[#151526] px-4 py-2 text-xs font-bold text-white">Add</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-lg font-extrabold text-[#151526]">All Dishes</p>
          <p className="text-sm font-medium text-slate-500">Manage content in one workspace</p>
        </div>
        <button className="rounded-md bg-[#FFD400] px-4 py-2 text-sm font-bold text-[#151526]">Save</button>
      </div>
      <div className="grid grid-cols-[110px_1fr_110px_130px] gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-extrabold uppercase text-slate-500">
        <span>Image</span>
        <span>Name</span>
        <span>Allergens</span>
        <span>Dietary</span>
      </div>
      <div className="divide-y divide-slate-100">
        {dishes.map(([name, price, tag], index) => (
          <div key={name} className="grid grid-cols-[110px_1fr_110px_130px] items-center gap-3 px-5 py-4">
            <div className="h-14 w-16 rounded-md bg-[#FFF4B8]" />
            <div>
              <p className="text-sm font-extrabold text-[#151526]">{name}</p>
              <p className="text-xs font-medium text-slate-500">{price}</p>
            </div>
            <span className="w-fit rounded-md bg-[#FFF0B4] px-2 py-1 text-xs font-bold text-[#8A6500]">{index === 0 ? 'None' : tag.split(',')[0]}</span>
            <span className="w-fit rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{index === 3 ? 'Vegetarian' : 'Review'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b border-slate-200 bg-[#FFFEF8] px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-[#F2D65A] bg-white px-3 py-2 text-sm font-bold text-[#8A6500]">
            <ShieldCheck className="h-4 w-4" />
            Order with confidence
          </div>
          <h1 className="max-w-2xl text-5xl font-extrabold leading-tight text-[#151526] md:text-6xl">
            Smart menus for modern restaurants.
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-slate-600">
            MenuKits helps restaurants publish clear multilingual menus with allergen labels, dietary filters, QR links, paper menus, and real menu insights.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register">
              <Button className="h-12 rounded-md bg-[#FFD400] px-6 text-base font-extrabold text-[#151526] hover:bg-[#F2B900]">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#workflow">
              <Button variant="outline" className="h-12 rounded-md border-slate-300 px-6 text-base font-bold">
                See how it works
              </Button>
            </a>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-sm font-bold text-slate-600 sm:grid-cols-4">
            {['Multi-language', 'Allergen clarity', 'QR menu hub', 'Real data'].map((item) => (
              <div key={item} className="rounded-md border border-slate-200 bg-white px-3 py-3">
                <Check className="mb-2 h-4 w-4 text-[#F2B900]" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -right-2 top-8 hidden w-[78%] lg:block">
            <DashboardPreview />
          </div>
          <div className="relative z-10 lg:-ml-4">
            <PhonePreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const groups = [
    {
      title: 'For Diners',
      copy: 'Unclear menus create hesitation, anxiety, and bad choices.',
      items: [
        ['No translations', 'Guests cannot understand dishes.', Languages],
        ['Hidden allergens', 'Risks are hard to spot quickly.', ShieldCheck],
        ['Paper-only menus', 'Outdated items cause confusion.', FileText],
        ['No confidence', 'Guests hesitate before ordering.', CircleHelp],
      ],
    },
    {
      title: 'For Restaurants',
      copy: 'Menu operations create repetitive questions and wasted time.',
      items: [
        ['Manual updates', 'Every print change takes time.', Clock3],
        ['Hard to explain', 'Staff answer the same questions.', Store],
        ['No digital hub', 'Menus are scattered everywhere.', QrCode],
        ['No insights', 'Owners cannot see what works.', BarChart3],
      ],
    },
  ];

  return (
    <section id="features" className="bg-white px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="The problem"
          title={<>Ordering food should not be confusing.</>}
          copy="Millions of diners face uncertainty every day. Restaurants struggle to keep menus clear, updated, and accessible."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <IconBadge icon={group.title === 'For Diners' ? Heart : Store} />
                <div>
                  <h3 className="text-2xl font-extrabold text-[#151526]">{group.title}</h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{group.copy}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {group.items.map(([title, copy, Icon]) => {
                  const TypedIcon = Icon as LucideIcon;
                  return (
                    <div key={String(title)} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <IconBadge icon={TypedIcon} tone="soft" />
                      <h4 className="mt-4 text-base font-extrabold text-[#151526]">{String(title)}</h4>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{String(copy)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-[#F2D65A] bg-[#FFF9D9] p-5 text-center text-base font-extrabold text-[#8A6500]">
          Unclear menus create uncertainty for diners and extra work for restaurants. It is time for a smarter, simpler solution.
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, copy, large = false }: { icon: LucideIcon; title: string; copy: string; large?: boolean }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${large ? 'lg:col-span-2' : ''}`}>
      <IconBadge icon={icon} />
      <h3 className="mt-5 text-xl font-extrabold text-[#151526]">{title}</h3>
      <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{copy}</p>
    </div>
  );
}

function SolutionSection() {
  return (
    <section id="restaurants" className="bg-slate-50 px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="One platform"
          title={<>One tap. Two powerful solutions.</>}
          copy="MenuKits connects diners and restaurants through one clear, scan-ready system."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          <FeatureCard icon={MonitorSmartphone} title="Mobile menu preview" copy="Guests see a clean phone-first menu with categories, dish details, filters, and ordering actions." large />
          <FeatureCard icon={WandSparkles} title="AI menu tools" copy="Generate descriptions, likely allergens, dietary tags, and dish images for faster setup." />
          <FeatureCard icon={QrCode} title="QR menu hub" copy="One restaurant link where guests can browse every visible menu." />
          <FeatureCard icon={Languages} title="Translations" copy="Help international customers understand your menu without staff repeating explanations." />
          <FeatureCard icon={FileText} title="Paper menu" copy="Create printable allergen and menu pages that are clear enough for customers to read." />
          <FeatureCard icon={BarChart3} title="Real data" copy="Track views, popular dishes, sections, and basic menu performance." />
          <FeatureCard icon={ShieldCheck} title="Allergen clarity" copy="Mark EU allergens and make safer choices easier to understand." />
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const steps = [
    ['Upload menu', 'PDF, image, or manual dishes.', UploadCloud],
    ['Review with AI tools', 'Add translations, allergens, dietary labels, and images.', WandSparkles],
    ['Publish everywhere', 'Share QR links, paper menus, and mobile ordering previews.', QrCode],
  ];
  return (
    <section id="workflow" className="bg-white px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeader
              label="Workflow"
              title={<>From menu file to guest-ready experience.</>}
              copy="Build, preview, and publish your smart menu without redesigning your whole restaurant operation."
            />
          </div>
          <div className="grid gap-4">
            {steps.map(([title, copy, Icon], index) => {
              const TypedIcon = Icon as LucideIcon;
              return (
                <div key={String(title)} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#151526] text-sm font-extrabold text-[#FFD400]">{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <TypedIcon className="h-5 w-5 text-[#F2B900]" />
                        <h3 className="text-xl font-extrabold text-[#151526]">{String(title)}</h3>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{String(copy)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValuesSection() {
  const values = [
    ['Accessibility', 'Dining experiences should work for everyone.', ShieldCheck],
    ['Inclusivity', 'Menus should be understandable across languages, diets, and needs.', Leaf],
    ['Confidence', 'Guests should know what they are ordering before they order.', Heart],
    ['Simplicity', 'Restaurants should manage menus without extra friction.', Zap],
  ];
  return (
    <section className="bg-[#FFFEF8] px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="Brand values"
          title={<>Built on values. Focused on people.</>}
          copy="Every feature is designed to reduce uncertainty and create a better dining moment."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {values.map(([title, copy, Icon]) => {
            const TypedIcon = Icon as LucideIcon;
            return (
              <div key={String(title)} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <IconBadge icon={TypedIcon} />
                <h3 className="mt-5 text-xl font-extrabold text-[#151526]">{String(title)}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{String(copy)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="Social proof"
          title={<>Trusted by restaurants. Loved by diners.</>}
          copy="Video and customer story areas are ready for future uploads."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-[#151526] p-8 text-white">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD400] text-[#151526]" aria-label="Play video">
              <Play className="ml-1 h-6 w-6 fill-current" />
            </button>
            <p className="mt-14 max-w-xl text-3xl font-extrabold leading-tight">
              "MenuKits has transformed the way we present our menu."
            </p>
            <div className="mt-5 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-5 w-5 fill-[#FFD400] text-[#FFD400]" />
              ))}
            </div>
          </div>
          <div className="grid gap-5">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-4xl font-extrabold text-[#151526]">70%</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">of guests say menu clarity improves their choice.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-4xl font-extrabold text-[#151526]">1 link</p>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">for menus, QR codes, ordering preview, and updates.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-slate-50 px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="Pricing"
          title={<>Simple, transparent pricing.</>}
          copy="Everything you need to create, manage, and grow your digital menu."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-lg border p-6 shadow-sm ${plan.featured ? 'border-[#F2D65A] bg-[#FFF7CC] shadow-lg' : 'border-slate-200 bg-white'}`}>
              {plan.featured && <span className="rounded-md bg-[#151526] px-3 py-1 text-xs font-extrabold text-[#FFD400]">Most popular</span>}
              <h3 className="mt-5 text-2xl font-extrabold text-[#151526]">{plan.name}</h3>
              <p className="mt-2 text-sm font-medium text-slate-600">{plan.note}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-[#151526]">{plan.price}</span>
                <span className="pb-2 text-sm font-bold text-slate-500">/mo</span>
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <Check className="h-4 w-4 text-[#F2B900]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button className={`mt-7 h-11 w-full rounded-md font-extrabold ${plan.featured ? 'bg-[#151526] text-[#FFD400] hover:bg-black' : 'bg-[#FFD400] text-[#151526] hover:bg-[#F2B900]'}`}>
                  Choose plan
                </Button>
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg bg-[#151526] p-8 text-center text-white">
          <h3 className="text-3xl font-extrabold">Ready to modernize your restaurant menu?</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-white/70">Start with a free menu, preview the guest experience, and publish when you are ready.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button className="h-11 rounded-md bg-[#FFD400] px-6 font-extrabold text-[#151526] hover:bg-[#F2B900]">Start free</Button>
            </Link>
            <a href="#workflow">
              <Button variant="outline" className="h-11 rounded-md border-white/25 bg-transparent px-6 font-extrabold text-white hover:bg-white/10">Book a demo</Button>
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
    ['Can I update photos or videos later?', 'Yes. The homepage now includes clean product and video areas that can be connected to real uploads later.'],
    ['Can restaurants publish without design work?', 'Yes. Upload or create dishes, review the suggestions, then publish the menu hub and QR code.'],
  ];
  return (
    <>
      <section className="bg-white px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {faqs.map(([question, answer], index) => (
            <div key={question} className="mb-3 rounded-lg border border-slate-200 bg-white">
              <button className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-extrabold text-[#151526]" onClick={() => setOpen(open === index ? -1 : index)}>
                {question}
                <ChevronDown className={`h-5 w-5 transition ${open === index ? 'rotate-180' : ''}`} />
              </button>
              {open === index && <p className="px-5 pb-5 text-sm font-medium leading-6 text-slate-600">{answer}</p>}
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white px-4 py-7 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm font-semibold text-slate-500 sm:flex-row">
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
    <div className="min-h-screen overflow-x-hidden bg-white text-[#151526]">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <WorkflowSection />
        <ValuesSection />
        <ProofSection />
        <PricingSection />
        <FAQFooter />
      </main>
    </div>
  );
}
