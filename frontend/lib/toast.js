import { toast } from '@heroui/react';

/**
 * Muestra un toast de error. Usar en cualquier parte de la app.
 * @param {string | Error} error — mensaje o instancia de Error
 * @param {string} [title] — título opcional (por defecto: "Error")
 */
export function toastError(error, title = 'Error') {
  const message = error instanceof Error ? error.message : String(error);
  toast.danger(title, { description: message });
}

/**
 * Muestra un toast de éxito.
 * @param {string} message
 * @param {string} [title]
 */
export function toastSuccess(message, title) {
  if (title) {
    toast.success(title, { description: message });
  } else {
    toast.success(message);
  }
}

/**
 * Muestra un toast informativo.
 * @param {string} message
 */
export function toastInfo(message) {
  toast.info(message);
}
