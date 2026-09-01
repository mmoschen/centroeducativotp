const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Permite dígitos, +, espacios, guiones y paréntesis (formato típico de teléfonos argentinos).
const phoneCharactersRegex = /^[0-9+()\s-]+$/;

export function isValidEmail(value: string) {
  return emailRegex.test(value.trim());
}

export function isValidPhone(value: string) {
  const trimmed = value.trim();
  // Se exige entre 7 y 15 dígitos reales para rechazar números claramente inválidos.
  const digitCount = trimmed.replace(/\D/g, '').length;
  return phoneCharactersRegex.test(trimmed) && digitCount >= 7 && digitCount <= 15;
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
