'use client'
import ThemeToggle from "@/app/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuLayoutDashboard, LuLogOut, LuMenu, LuUser, LuX } from "react-icons/lu";

const STAFF_ROLES = ['admin', 'agent', 'designer'];
const ROLE_LABELS = { admin: 'Administrador', agent: 'Agente', designer: 'Diseñador', client: 'Cliente' };

const NAV_LINKS = [
  { name: "Destinos", url: "/destinos" },
  { name: "Ofertas", url: "/ofertas" },
  { name: "Sobre nosotros", url: "#" },
  { name: "Contacto", url: "#" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const userMenuRef = useRef(null);
  const router = useRouter();

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

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Barra principal */}
      <div className="bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-sm shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/logo.svg" alt="Joan Luna Viajes" width={150} height={38} priority />
            </Link>

            {/* Nav links — desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className="relative px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 transition-all"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Acciones — desktop */}
            <div className="hidden md:flex items-center gap-2">
              {/* CTA — solo para no-staff */}
              {!authLoading && !isStaff && (
                <Link
                  href="#contacto"
                  className="h-9 px-4 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-semibold hover:from-orange-600 hover:to-orange-500 transition-all shadow-md shadow-orange-500/25 flex items-center"
                >
                  Consultar ahora
                </Link>
              )}

              <ThemeToggle />

              {/* Auth */}
              {!authLoading && (
                user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm cursor-pointer"
                    >
                      <span className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-xs font-bold">
                        {initials}
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
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
                            <LuLayoutDashboard className="w-4 h-4 text-orange-500" />
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
                    className="flex items-center gap-1.5 h-9 px-4 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
                  >
                    <LuUser className="w-3.5 h-3.5" />
                    Iniciar sesión
                  </Link>
                )
              )}
            </div>

            {/* Mobile — right side */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                aria-label="Menú"
              >
                {mobileOpen ? <LuX className="w-5 h-5" /> : <LuMenu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
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

            <div className="pt-2 pb-1 border-t border-slate-100 dark:border-white/5 space-y-1">
              {!authLoading && (
                user ? (
                  <>
                    <div className="px-3 py-2 flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
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
                      <LuLayoutDashboard className="w-4 h-4 text-orange-500" />
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
                        href="#contacto"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-orange-400 text-white"
                      >
                        Consultar ahora
                      </Link>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
