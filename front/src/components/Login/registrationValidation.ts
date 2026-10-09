// Matches the existing StoreUser password policy. Never trim passwords.
export const PASSWORD_PATTERN = String.raw`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-]).{8,}$`;
export const passwordRegex = new RegExp(PASSWORD_PATTERN);
// HTML pattern uses Unicode sets (v flag), which requires escaping a literal hyphen.
export const HTML_PASSWORD_PATTERN = PASSWORD_PATTERN.replace('._-', '._\\-');
export const PASSWORD_HELP = 'Usá al menos 8 caracteres, una mayúscula, una minúscula, un número y uno de estos símbolos: @ $ ! % * ? & . _ -';
export const passwordRules = (value: string) => [
  { label: '8 caracteres o más', ok: value.length >= 8 },
  { label: 'Una mayúscula y una minúscula', ok: /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'Un número', ok: /\d/.test(value) },
  { label: 'Un símbolo: @ $ ! % * ? & . _ -', ok: /[@$!%*?&._-]/.test(value) },
];
export function getRegistrationErrors(data: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};
  const email = data.email.trim();
  // Same email format as the current backend model.
  if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) errors.email = 'Revisá el email: el sistema necesita una dirección válida.';
  if (!/^\d{8}$/.test(data.dni.trim())) errors.dni = 'Ingresá tu DNI de 8 dígitos, sin puntos ni espacios.';
  if (!passwordRegex.test(data.password)) errors.password = PASSWORD_HELP;
  if (!data.confirmPassword || data.password !== data.confirmPassword) errors.confirmPassword = 'Las contraseñas deben coincidir.';
  for (const [field, label] of [['firstName', 'nombre'], ['lastName', 'apellido']]) {
    const value = data[field].trim();
    if (value.length < 2 || value.length > 50) errors[field] = `Ingresá tu ${label} (entre 2 y 50 caracteres).`;
  }
  if (!/^\d{8,15}$/.test(data.phone.trim())) errors.phone = 'Ingresá un teléfono de entre 8 y 15 dígitos.';
  const address = data.address.trim();
  if (address.length < 5 || address.length > 200) errors.address = 'Ingresá la dirección completa, con calle, número y localidad (entre 5 y 200 caracteres).';
  return errors;
}

export function getRegisterErrorMessage(error: unknown): string {
  const err = (error && typeof error === 'object' ? error : {}) as Record<string, unknown>;
  const rawData = err.data;
  const data = (rawData && typeof rawData === 'object' ? rawData : {}) as Record<string, unknown>;
  const text = [typeof rawData === 'string' ? rawData : '', data?.message, data?.error, JSON.stringify(data?.errors ?? ''), JSON.stringify(data?.details ?? ''), ...(Array.isArray(data?.duplicateFields) ? data.duplicateFields : [])].join(' ').toLowerCase();
  const duplicate = err?.status === 409 || /duplicate|duplicad|unique|already exists|ya existe|ya (?:est[aá] )?registrad|p2002/.test(text) || (Array.isArray(data?.duplicateFields) && data.duplicateFields.length > 0);
  if (duplicate) {
    if (/\bdni\b/.test(text)) return 'Ese DNI ya tiene una cuenta. Iniciá sesión o recuperá tu contraseña; no uses otro DNI.';
    if (/email|correo/.test(text)) return 'Ese email ya tiene una cuenta. Iniciá sesión o recuperá tu contraseña.';
    return 'Ya existe una cuenta con esos datos. Iniciá sesión o recuperá tu contraseña. Si no la reconocés, contactanos.';
  }
  if (/password|contrase[ñn]a/.test(text)) return PASSWORD_HELP;
  if (/\bdni\b/.test(text)) return 'Revisá el DNI: ingresalo sin puntos ni espacios.';
  if (/email|correo/.test(text)) return 'Revisá el email ingresado.';
  if (/phone|tel[eé]fono/.test(text)) return 'Revisá el teléfono: usá entre 8 y 15 dígitos.';
  if (/address|direcci[oó]n/.test(text)) return 'Revisá la dirección: incluí calle, número y localidad.';
  if (err?.status === 'FETCH_ERROR' || err?.status === 'TIMEOUT_ERROR') return 'No pudimos conectar. Tus datos siguen en el formulario; comprobá tu conexión y volvé a intentar.';
  if (err?.status === 429) return 'Hubo varios intentos seguidos. Esperá unos minutos antes de volver a intentar.';
  return 'No pudimos completar el registro. Tus datos siguen en el formulario. Volvé a intentar o contactanos si el problema continúa.';
}
