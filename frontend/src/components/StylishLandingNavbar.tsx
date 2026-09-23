import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CreditCard,
  Zap,
  RefreshCw,
  Link as LinkIcon,
  ShieldCheck,
  Terminal,
  BookOpen,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Search,
  Menu,
  X,
  ShoppingBag,
  Building2,
  TrendingUp,
  Coins,
  Laptop
} from 'lucide-react';
import { PaycoreLogo } from './PaycoreLogo';

interface StylishLandingNavbarProps {
  onOpenSearch?: () => void;
}

export const StylishLandingNavbar: React.FC<StylishLandingNavbarProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'products' | 'solutions' | 'developers' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (menu: 'products' | 'solutions' | 'developers') => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const products = [
    {
      icon: <CreditCard className="w-5 h-5 text-[#0066FF]" />,
      title: 'Payment Gateway',
      desc: '120+ payment modes, UPI QR, Cards, EMI, and Netbanking with 99.99% uptime.',
      badge: 'Popular',
      tagColor: 'bg-blue-50 text-[#0066FF] border-blue-200',
      action: () => {
        if (location.pathname !== '/') navigate('/#products');
        else document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      icon: <Zap className="w-5 h-5 text-emerald-600" />,
      title: 'Instant Payouts',
      desc: '24x7 IMPS/UPI disbursals with sub-2s latency and instant UTR tracking.',
      badge: 'Fastest in India',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => {
        if (location.pathname !== '/') navigate('/#products');
        else document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      icon: <RefreshCw className="w-5 h-5 text-purple-600" />,
      title: 'UPI AutoPay 2.0',
      desc: 'Automated recurring billing, pre-debit alerts, and RBI e-mandate framework.',
      badge: 'RBI Ready',
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => {
        if (location.pathname !== '/') navigate('/#products');
        else document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      icon: <LinkIcon className="w-5 h-5 text-amber-600" />,
      title: 'Payment Links & QR',
      desc: 'Shareable dynamic payment links with auto-SMS, WhatsApp, and email alerts.',
      badge: 'No Code',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => {
        if (location.pathname !== '/') navigate('/#products');
        else document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  const solutions = [
    {
      icon: <ShoppingBag className="w-5 h-5 text-[#0066FF]" />,
      title: 'E-Commerce & D2C',
      desc: 'High-volume checkout with 1-click OTP verification and flash sale handling.'
    },
    {
      icon: <Laptop className="w-5 h-5 text-purple-600" />,
      title: 'SaaS & Subscriptions',
      desc: 'Automated customer dunning, multi-tier billing cycles, and invoice generation.'
    },
    {
      icon: <Building2 className="w-5 h-5 text-indigo-600" />,
      title: 'Marketplaces & Platforms',
      desc: 'Multi-vendor split settlements, escrow management, and automated commissions.'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      title: 'NBFCs & Fintechs',
      desc: 'Instant loan disbursal, e-NACH auto-debit collection, and KYC verification.'
    }
  ];

  const devTools = [
    {
      icon: <BookOpen className="w-5 h-5 text-[#0066FF]" />,
      title: 'Interactive API Docs',
      desc: 'Full OpenAPI reference, parameter schemas, and live sandbox request builder.',
      link: '/docs/api'
    },
    {
      icon: <Terminal className="w-5 h-5 text-emerald-600" />,
      title: 'SDK Libraries',
      desc: 'Official SDKs for Node.js, Python, PHP, Go, and Java with full TypeScript types.',
      action: () => {
        if (location.pathname !== '/') navigate('/#developers');
        else document.getElementById('developers')?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
      title: 'Webhook Simulator',
      desc: 'Idempotency testing, HMAC SHA-256 signature verification, and event replay.',
      link: '/login'
    },
    {
      icon: <Coins className="w-5 h-5 text-amber-600" />,
      title: 'Fee Calculator & ROI',
      desc: 'Simulate monthly processing volume and compare transaction fee savings.',
      action: () => {
        if (location.pathname !== '/') navigate('/#calculator');
        else document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  ];

  return (
    <>
      {/* Top Notification Announcement Bar */}
      <div className="bg-gradient-to-r from-[#0052cc] via-[#0066FF] to-[#6851FF] text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 relative z-50">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="hidden sm:inline">
          <strong className="font-extrabold text-blue-100">PAYCORE 2.0 Released:</strong> Zero-drop UPI AutoPay, Sub-2s IMPS Disbursals & Smart Routing
        </span>
        <span className="sm:hidden">
          <strong>PAYCORE 2.0:</strong> Next-Gen Fintech Stack Live
        </span>
        <button
          onClick={() => navigate('/register')}
          className="underline font-bold text-white hover:text-blue-100 ml-1.5 cursor-pointer flex items-center gap-0.5"
        >
          <span>Claim Sandbox Keys</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Glassmorphism Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 w-full ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-[0_4px_25px_-4px_rgba(0,102,255,0.06)] py-3'
            : 'bg-white border-b border-slate-100 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo & Navigation Links */}
          <div className="flex items-center gap-8">
            <div
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={() => navigate('/')}
            >
              <PaycoreLogo size="md" subtitle="CASHFREE STACK" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-slate-700">
              {/* Products Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('products')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeDropdown === 'products'
                      ? 'bg-blue-50 text-[#0066FF]'
                      : 'text-slate-700 hover:text-[#0066FF] hover:bg-slate-50'
                  }`}
                >
                  <span>Products</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'products' ? 'rotate-180 text-[#0066FF]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Products Mega Menu */}
                {activeDropdown === 'products' && (
                  <div className="absolute top-full left-0 mt-1 w-[560px] bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl shadow-blue-900/10 animate-fade-in z-50">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        PAYCORE PRODUCT SUITE
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        99.99% SLA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {products.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveDropdown(null);
                            item.action();
                          }}
                          className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group flex items-start gap-3"
                        >
                          <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-200 group-hover:shadow-sm transition-all shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors">
                                {item.title}
                              </span>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border ${item.tagColor}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-blue-50/60 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#0066FF]" />
                        <span className="text-xs font-bold text-slate-800">
                          Need custom enterprise volume?
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          navigate('/register');
                        }}
                        className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Talk to Sales</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('solutions')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeDropdown === 'solutions'
                      ? 'bg-blue-50 text-[#0066FF]'
                      : 'text-slate-700 hover:text-[#0066FF] hover:bg-slate-50'
                  }`}
                >
                  <span>Solutions</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'solutions' ? 'rotate-180 text-[#0066FF]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Solutions Mega Menu */}
                {activeDropdown === 'solutions' && (
                  <div className="absolute top-full left-0 mt-1 w-[520px] bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl shadow-blue-900/10 animate-fade-in z-50">
                    <div className="pb-3 mb-3 border-b border-slate-100">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        INDUSTRY ARCHITECTURES
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {solutions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveDropdown(null);
                            if (location.pathname !== '/') navigate('/#comparison');
                            else document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group flex items-start gap-3"
                        >
                          <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-200 group-hover:shadow-sm transition-all shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors mb-0.5">
                              {item.title}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Developers Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('developers')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeDropdown === 'developers'
                      ? 'bg-blue-50 text-[#0066FF]'
                      : 'text-slate-700 hover:text-[#0066FF] hover:bg-slate-50'
                  }`}
                >
                  <span>Developers</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'developers' ? 'rotate-180 text-[#0066FF]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Developers Mega Menu */}
                {activeDropdown === 'developers' && (
                  <div className="absolute top-full left-0 mt-1 w-[520px] bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl shadow-blue-900/10 animate-fade-in z-50">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                        DEVELOPER TOOLKIT & APIS
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        v1.4 REST
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {devTools.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveDropdown(null);
                            if (item.link) navigate(item.link);
                            else if (item.action) item.action();
                          }}
                          className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group flex items-start gap-3"
                        >
                          <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-white border border-slate-200 group-hover:shadow-sm transition-all shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-[#0066FF] transition-colors mb-0.5">
                              {item.title}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Links */}
              <button
                onClick={() => {
                  if (location.pathname !== '/') navigate('/#calculator');
                  else document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:bg-slate-50 transition-all cursor-pointer"
              >
                Pricing & ROI
              </button>

              <button
                onClick={() => {
                  if (location.pathname !== '/') navigate('/#faq');
                  else document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:bg-slate-50 transition-all cursor-pointer"
              >
                FAQ
              </button>

              <button
                onClick={() => navigate('/docs/api')}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0066FF] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>API Docs</span>
              </button>
            </nav>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Uptime Pill (Desktop) */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>99.99% Uptime</span>
            </div>

            {/* Quick Search Trigger */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-2xs"
                title="Search Docs (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="font-medium">Search</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[9px] font-mono text-slate-400">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Sign In Button */}
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#0066FF] hover:bg-slate-100 transition-all cursor-pointer"
            >
              Sign In
            </button>

            {/* Create Account / Get Started Free CTA */}
            <button
              onClick={() => navigate('/register')}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#0066FF] via-blue-600 to-[#6851FF] hover:from-[#0052cc] hover:to-[#5841e6] active:scale-95 shadow-md shadow-blue-600/25 transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover-lift"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden transition cursor-pointer border border-slate-200"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 sm:px-6 py-5 space-y-4 animate-fade-in-up shadow-xl">
            {/* Products Group */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                PRODUCTS
              </div>
              <div className="grid grid-cols-1 gap-2">
                {products.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      p.action();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-800"
                  >
                    {p.icon}
                    <span>{p.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (location.pathname !== '/') navigate('/#calculator');
                  else document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Pricing & ROI Calculator
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (location.pathname !== '/') navigate('/#comparison');
                  else document.getElementById('comparison')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Why PAYCORE Matrix
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/docs/api');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#0066FF] hover:bg-blue-50 flex items-center justify-between"
              >
                <span>Interactive API Reference</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  v1.4
                </span>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
              >
                Sign In to Dashboard
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] shadow-md transition flex items-center justify-center gap-1.5"
              >
                <span>Create Free Merchant Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
