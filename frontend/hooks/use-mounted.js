// No 'use client' needed — hooks are imported by client components and inherit that context.
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * True once the component montó en el cliente.
 *
 * Necesario para todo lo que depende del tema resuelto por next-themes: en el
 * servidor no se conoce, así que renderizar el ícono real en el primer pase
 * produce un mismatch de hidratación.
 *
 * Usa useSyncExternalStore en vez del clásico useEffect(() => setMounted(true)):
 * devuelve false en el snapshot del servidor y true en el del cliente sin
 * disparar un setState dentro de un efecto, que provoca un render en cascada.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
