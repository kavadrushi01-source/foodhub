import { Link } from 'react-router-dom';
import { Truck, Clock, Shield, Star } from 'lucide-react';

const PERKS = [
  { icon: Truck, title: '30-minute delivery', desc: 'Hot, fresh food at your door, fast.' },
  { icon: Clock, title: 'Live order tracking', desc: 'Follow your order from kitchen to doorstep.' },
  { icon: Shield, title: 'Quality guaranteed', desc: 'Hygienic kitchens, 100% quality checked.' },
];

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-[calc(100vh-64px)] grid lg:grid-cols-2 bg-cream dark:bg-ink-950">
      {/* Brand showcase */}
      <div className="hidden lg:flex relative overflow-hidden bg-brand-gradient noise p-12 text-white flex-col justify-between">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-ink-950/20 blur-3xl" aria-hidden />

        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">🍔</span>
          <span className="font-display font-extrabold text-2xl">FoodHub</span>
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium mb-5">
            <Star size={14} className="fill-white" /> Loved by 2.5k+ foodies
          </div>
          <h2 className="font-display font-extrabold text-4xl leading-tight">
            Good food is<br />a click away.
          </h2>
          <div className="mt-10 space-y-6">
            {PERKS.map((p) => (
              <div key={p.title} className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur grid place-items-center shrink-0">
                  <p.icon size={20} />
                </div>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-white/80">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-sm text-white/70">Fresh. Fast. Delicious. — FoodHub</div>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden text-center mb-8">
            <span className="inline-flex h-14 w-14 rounded-2xl bg-brand-gradient items-center justify-center text-3xl shadow-glow">🍔</span>
            <h1 className="mt-4 font-display font-extrabold text-3xl text-ink-900 dark:text-white">Food<span className="text-gradient">Hub</span></h1>
          </div>
          <h1 className="hidden lg:block font-display font-extrabold text-2xl text-ink-900 dark:text-white">{title}</h1>
          <p className="text-ink-500 dark:text-ink-400 mt-1 text-sm">{subtitle}</p>
          {children}
          {footer && <div className="text-center text-sm text-ink-500 dark:text-ink-400 mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  );
}