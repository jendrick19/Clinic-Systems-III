const CIE10_REGEX = /^[A-Z]\d{2}(\.\d{1,2})?$/;
const isValidCIE10Code = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return CIE10_REGEX.test(code);
};

const validateAndNormalizeCIE10Code = (code) => {
  if (!code || typeof code !== 'string') {
    throw new Error('El código CIE-10 es requerido');
  }
  const normalizedCode = code.trim().toUpperCase();
  if (!CIE10_REGEX.test(normalizedCode)) {
    throw new Error(
      'Código CIE-10 inválido. Formato esperado: Letra + 2 dígitos + opcional (.dígitos). ' +
      'Ejemplos: J06.9, I10, E11.9'
    );
  }
  return normalizedCode;
};

const getCIE10Category = (code) => {
  if (!isValidCIE10Code(code)) {
    throw new Error('Código CIE-10 inválido');
  }
  return code.substring(0, 3);
};

const hasSubcategory = (code) => {
  if (!isValidCIE10Code(code)) {
    return false;
  }
  return code.includes('.');
};

module.exports = {
  CIE10_REGEX,
  isValidCIE10Code,
  validateAndNormalizeCIE10Code,
  getCIE10Category,
  hasSubcategory,
};
