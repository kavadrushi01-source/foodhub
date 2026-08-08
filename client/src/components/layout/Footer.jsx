import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Instagram, Twitter, Send, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Please enter a valid email'); return; }
    toast.success('Subscribed! Fresh deals coming your way 🎉');
    setEmail('');
  };

  return (
    <footer className="bg-ink-900 dark:bg-ink-950 text-ink-300 mt-16 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="container-app py-14 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <span className="h-9 w-9 rounded-xl bg-brand-gradient flex items-center justify-center text-xl">🍔</span>
            <span className="font-display font-extrabold text-xl text-white">Food<span className="text-gradient">Hub</span></span>
          </Link>
          <p className="text-sm text-ink-400 max-w-xs leading-relaxed">Fresh, delicious meals delivered to your door. Quality food, fast service, great prices.</p>
          <div className="flex items-center gap-2.5 mt-5">
            <SocialBtn label="Instagram"><Instagram size={17} /></SocialBtn>
            <SocialBtn label="Twitter"><Twitter size={17} /></SocialBtn>
          </div>
        </div>

        {/* Newsletter */}
        <div className="col-span-2 md:col-span-1 md:col-start-4 lg:col-span-1 lg:col-start-5">
          <h4 className="font-semibold text-white mb-3">Get 20% off</h4>
          <p className="text-sm text-ink-400 mb-3 leading-relaxed">Join our newsletter for exclusive deals & new dishes.</p>
          <form onSubmit={handleNewsletter} className="flex gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your email" className="w-full rounded-xl bg-ink-800 dark:bg-ink-900 border border-ink-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 transition-all" />
            <button type="submit" aria-label="Subscribe" className="shrink-0 h-11 w-11 rounded-xl bg-brand-gradient text-white grid place-items-center hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
              <Send size={17} />
            </button>
          </form>
        </div>

        <FooterCol title="Company" links={[['About Us', '/about'], ['Menu', '/menu'], ['Categories', '/categories'], ['Contact', '/contact']]} />
        <FooterCol title="Account" links={[['My Orders', '/orders'], ['Wishlist', '/wishlist'], ['Profile', '/profile'], ['Cart', '/cart']]} />
      </div>

      <div className="border-t border-ink-800">
        <div className="container-app py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-ink-400">
          <p>© {new Date().getFullYear()} FoodHub. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/about" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-0.5">Privacy</Link>
            <Link to="/about" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-0.5">Terms</Link>
            <Link to="/about" className="hover:text-white hover:underline underline-offset-4 transition-colors flex items-center gap-0.5">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialBtn({ label, children }) {
  return (
    <a href="#" aria-label={label} className="p-2.5 rounded-xl bg-ink-800 hover:bg-brand-gradient hover:shadow-glow hover:-translate-y-0.5 transition-all"><span className="grid place-items-center">{children}</span></a>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="font-semibold text-white mb-3.5">{title}</h4>
      <ul className="space-y-2.5 text-sm">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="group flex items-center gap-1 text-ink-400 hover:text-brand-400 transition-colors">
              <ChevronRight size={13} className="-ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}