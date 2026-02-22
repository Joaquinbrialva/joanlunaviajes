'use client'
import ThemeToggle from "@/app/ThemeToggle";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const menu = [
    { name: "Destinos", url: "/destinos" },
    { name: "Ofertas", url: "/ofertas" },
    { name: "Sobre nosotros", url: "#" },
    { name: "Contacto", url: "#" },
  ];

  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-gray-200/60 dark:border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-white">Joanluna Viajes</Link>
          </div>

          {/* Menu (desktop) */}
          <div className="hidden sm:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {menu.map((item) => (
                <Link
                  key={item.name}
                  href={item.url}
                  className="relative px-2 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors group"
                >
                  <span className="relative">
                    {item.name}
                    <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-orange-400 transition-all group-hover:w-full" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <Button className="bg-linear-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 shadow-lg">Consultar ahora</Button>
            </div>
            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(!open)}
              aria-label="Abrir menú"
              className="sm:hidden p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current">
                <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 py-3 flex flex-col gap-2">
            {menu.map((item) => (
              <Link key={item.name} href={item.url} className="block px-2 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">{item.name}</Link>
            ))}
            <div className="pt-2">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white">Consultar ahora</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
