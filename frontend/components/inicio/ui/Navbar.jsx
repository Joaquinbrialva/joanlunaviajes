import ThemeToggle from "@/app/ThemeToggle";
import { Button } from "@heroui/react";
import Link from "next/link";

export default function Navbar() {
  const menu = [
    {
      name: 'Destinos',
      url: '/destinos'
    },
    {
      name: 'Ofertas',
      url: '/ofertas'
    },
    {
      name: 'Sobre nosotros',
      url: '#'
    },
    {
      name: 'Contacto',
      url: '#'
    }
  ];

  return (
    <nav className="grid grid-cols-3 items-center px-6 p-4 bg-surface  border-b border-border shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="flex items-center gap-2">
        <p>Joanluna Viajes</p>
      </div>
      <div className="flex justify-center space-x-4">
        {
          menu.map((item) => (
            <Link key={item.name} href={item.url} className="hover:text-muted transition-colors duration-300" >
              {item.name}
            </Link>
          ))
        }
      </div >
      <div>
        <div className="flex justify-end items-center gap-4">
          <Button className='shadow-lg shadow-accent/50'>Consultar ahora</Button>
          <ThemeToggle />
        </div>
      </div>
    </nav >
  )
}