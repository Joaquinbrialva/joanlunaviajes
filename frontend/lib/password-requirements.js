/**
 * Requisitos de contraseña que muestra la UI.
 *
 * Deben coincidir con `validatePassword` en `backend/src/store/utils.js`: si acá
 * se pide menos, el formulario deja enviar y el backend rechaza con un error que
 * el usuario no vio venir.
 */
export const PASSWORD_REQS = [
  { key: 'len',     label: 'Al menos 8 caracteres',           test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'Una letra mayúscula',             test: (p) => /[A-Z]/.test(p) },
  { key: 'number',  label: 'Un número',                       test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'Un carácter especial (!@#$%...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function meetsPasswordReqs(password) {
  return PASSWORD_REQS.every((r) => r.test(password || ''));
}
