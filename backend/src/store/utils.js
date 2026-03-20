/**
 * Valida la fortaleza de una contraseña.
 * Política: mín. 8 caracteres, 1 mayúscula, 1 número, 1 carácter especial.
 * @returns {string|null} Mensaje de error, o null si es válida.
 */
export function validatePassword(password) {
  if (!password || password.length < 8)       return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Z]/.test(password))                return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (!/[0-9]/.test(password))                return 'La contraseña debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(password))         return 'La contraseña debe incluir al menos un carácter especial (ej: !@#$%).';
  return null;
}
