/**
 * Utilidades para formateo de moneda en pesos argentinos
 */

/**
 * Formatea un número como pesos argentinos con separadores
 * @param {number|string} amount - El monto a formatear
 * @returns {string} - Monto formateado como $1.234,56
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '$0,00'
  }
  
  const numAmount = parseFloat(amount)
  if (isNaN(numAmount)) {
    return '$0,00'
  }
  
  // Formatear con separador de miles (punto) y decimales (coma)
  const formatted = numAmount.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  return `$${formatted}`
}

/**
 * Formatea un valor para inputs de formulario
 * @param {number|string} value - El valor a formatear
 * @returns {string} - Valor formateado sin símbolo de peso
 */
export function formatCurrencyInput(value) {
  if (value === null || value === undefined || value === '') {
    return '0,00'
  }
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) {
    return '0,00'
  }
  
  return numValue.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Convierte un string formateado de vuelta a número
 * @param {string} formattedValue - Valor formateado (ej: "1.234,56")
 * @returns {number} - Número decimal
 */
export function parseCurrency(formattedValue) {
  if (!formattedValue || typeof formattedValue !== 'string') {
    return 0
  }
  
  // Remover símbolo de peso si existe
  let cleanValue = formattedValue.replace('$', '')
  
  // Reemplazar separadores argentinos por formato estándar
  // Punto como separador de miles -> nada
  // Coma como separador decimal -> punto
  cleanValue = cleanValue.replace(/\./g, '').replace(',', '.')
  
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formatea un monto para mostrar en tablas (más compacto)
 * @param {number|string} amount - El monto a formatear
 * @returns {string} - Monto formateado compacto
 */
export function formatCurrencyCompact(amount) {
  const formatted = formatCurrency(amount)
  return formatted
}

// Exportar como default también
export default {
  formatCurrency,
  formatCurrencyInput,
  parseCurrency,
  formatCurrencyCompact
}