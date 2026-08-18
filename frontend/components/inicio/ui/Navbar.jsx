'use client'
import ThemeToggle from "@/app/ThemeToggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuLayoutDashboard, LuLogOut, LuMenu, LuUser, LuX } from "react-icons/lu";
import Logo from "@/components/ui/logo";

const STAFF_ROLES = ['admin', 'agent', 'designer'];
const ROLE_LABELS = { admin: 'Administrador', agent: 'Agente', designer: 'Diseñador', client: 'Cliente' };

const NAV_LINKS = [
  { name: "Ofertas", url: "/ofertas" },
  { name: "Nosotros", url: "/nosotros" },
  { name: "Contacto", url: "/contacto" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const isStaff = user && STAFF_ROLES.includes(user.role);
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '';

  // isIsland: forma island (padding + bordes redondeados + max-width) — solo al scrollear.
  // Efecto de scroll independiente del tema claro/oscuro de la barra — se mantiene en toda ruta.
  const isIsland = scrolled;

  const ease = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const dur = '420ms';
  const transition = `padding ${dur} ${ease}, max-width ${dur} ${ease}, border-radius ${dur} ${ease}, background-color ${dur} ${ease}, box-shadow ${dur} ${ease}, border-color ${dur} ${ease}`;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        paddingTop: isIsland ? '14px' : '0px',
        paddingLeft: isIsland ? '14px' : '0px',
        paddingRight: isIsland ? '14px' : '0px',
        transition,
      }}
    >
      {/* Island / full-width container — fondo sólido siempre, en toda ruta */}
      <div
        className="mx-auto backdrop-blur-2xl border bg-white/85 dark:bg-slate-950/85 border-slate-200/70 dark:border-white/[0.08] shadow-lg shadow-black/[0.06] dark:shadow-black/40"
        style={{
          maxWidth: isIsland ? '78rem' : '100vw',
          borderRadius: isIsland ? '1.25rem' : '0rem',
          transition,
        }}
      >

        {/* Main bar — logo a la izquierda, links, acciones a la derecha */}
        <div className="px-5 sm:px-8 flex items-center h-[72px] gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center select-none">
            <Logo className="h-12 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="flex-1 hidden md:flex items-center gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className="relative px-4 py-2 text-[13px] font-semibold tracking-wide rounded-full transition-colors duration-300 text-slate-600 dark:text-slate-300 hover:text-brand-primary hover:bg-brand-primary/[0.06]"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Columna derecha — Actions + ThemeToggle al final */}
          <div className="flex-1 hidden md:flex items-center justify-end gap-2">
            {!authLoading && !isStaff && (
              <Link
                href="/cotizar"
                className="h-9 px-4 rounded-full bg-brand-primary text-brand-primary-foreground text-[13px] font-bold hover:opacity-90 transition-all shadow-md shadow-brand-primary/25 flex items-center"
              >
                Cotizar a medida
              </Link>
            )}

            {!authLoading && (
              user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-full border transition-all shadow-sm cursor-pointer border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10"
                  >
                    <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center text-[10px] font-bold">
                      {initials}
                    </span>
                    <span className="text-[13px] font-semibold transition-colors duration-300 text-slate-700 dark:text-slate-200">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-black/10 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-white/5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[user.role] || user.role}</p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          href={isStaff ? '/admin' : '/cuenta'}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <LuLayoutDashboard className="w-4 h-4 text-brand-primary" />
                          {isStaff ? 'Panel de administración' : 'Mi cuenta'}
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <LuLogOut className="w-4 h-4" />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[13px] font-semibold transition-all shadow-sm border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <LuUser className="w-3.5 h-3.5" />
                  Iniciar sesión
                </Link>
              )
            )}

            <ThemeToggle />
          </div>

          {/* Mobile right */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-xl transition-colors text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
              aria-label="Menú"
            >
              {mobileOpen ? <LuX className="w-5 h-5" /> : <LuMenu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-white/5 px-4 pb-4 pt-3 space-y-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
              {!authLoading && (
                user ? (
                  <>
                    <div className="px-3 py-2 flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
                      </div>
                    </div>
                    <Link
                      href={isStaff ? '/admin' : '/cuenta'}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <LuLayoutDashboard className="w-4 h-4 text-brand-primary" />
                      {isStaff ? 'Panel de administración' : 'Mi cuenta'}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LuLogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      <LuUser className="w-4 h-4" />
                      Iniciar sesión
                    </Link>
                    {!isStaff && (
                      <Link
                        href="/cotizar"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold bg-accent text-white"
                      >
                        Cotizar a medida
                      </Link>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
