import {
  LuLayoutDashboard,
  LuClipboardList,
  LuGlobe,
  LuMessageSquare,
  LuImage,
  LuUsers,
  LuSparkles,
} from 'react-icons/lu';

export const NAV_GROUPS = [
  {
    label: 'Panel',
    links: [
      { href: '/admin', label: 'Resumen', icon: LuLayoutDashboard },
    ],
  },
  {
    label: 'Contenido',
    links: [
      { href: '/admin/ofertas', label: 'Ofertas', icon: LuClipboardList },
      { href: '/admin/destinos', label: 'Destinos', icon: LuGlobe },
      { href: '/admin/cotizaciones', label: 'Cotizaciones', icon: LuMessageSquare, hideForRoles: ['designer'] },
      { href: '/admin/novedades', label: 'Novedades', icon: LuSparkles },
    ],
  },
  {
    label: 'Administración',
    links: [
      { href: '/admin/apariencia', label: 'Apariencia', icon: LuImage, showForRoles: ['admin', 'designer'] },
      { href: '/admin/usuarios', label: 'Usuarios', icon: LuUsers, showForRoles: ['admin'] },
    ],
  },
];

export const ROLE_LABELS = {
  admin: 'Administrador',
  agent: 'Agente',
  designer: 'Diseñador',
  client: 'Cliente',
};

export const EXTRA_LABELS = {
  '/admin/perfil': 'Mi perfil',
  '/admin/ajustes': 'Ajustes',
};

export function isNavActive(pathname, href) {
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export function visibleGroups(role) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((item) => {
      if (item.hideForRoles?.includes(role)) return false;
      if (item.showForRoles && !item.showForRoles.includes(role)) return false;
      return true;
    }),
  })).filter((group) => group.links.length > 0);
}

export function getPageTitle(pathname) {
  for (const group of NAV_GROUPS) {
    for (const item of group.links) {
      if (isNavActive(pathname, item.href)) return item.label;
    }
  }
  for (const [href, label] of Object.entries(EXTRA_LABELS)) {
    if (pathname.startsWith(href)) return label;
  }
  return 'Panel';
}
