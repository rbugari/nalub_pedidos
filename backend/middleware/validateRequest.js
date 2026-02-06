const { ZodError } = require('zod')

/**
 * Middleware para validar requests usando schemas de Zod
 * @param {ZodSchema} schema - Schema de Zod para validar
 * @param {string} source - Fuente de datos a validar ('body', 'query', 'params')
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source]
      const validated = schema.parse(dataToValidate)
      
      // Reemplazar el dato original con el validado
      req[source] = validated
      
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        })
      }
      
      // Error inesperado
      console.error('Error in validation middleware:', error)
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      })
    }
  }
}

/**
 * Middleware para validar IDs numéricos en params
 */
function validateId(paramName = 'id') {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName])
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: `El parámetro ${paramName} debe ser un número positivo`
      })
    }
    
    req.params[paramName] = id
    next()
  }
}

module.exports = {
  validateRequest,
  validateId
}
