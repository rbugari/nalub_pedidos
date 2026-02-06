const { z } = require('zod')

// Schema para crear prepedido
const createPrepedidoSchema = z.object({
  observaciones: z.string().optional().nullable(),
  items: z.array(z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive().min(1, "La cantidad debe ser al menos 1"),
    precioEstimado: z.number().positive().optional(),
    unidad: z.string().optional(),
    observaciones: z.string().optional().nullable(),
    ofertaid: z.number().int().positive().optional().nullable()
  })).min(1, "Debe haber al menos un item en el prepedido")
})

// Schema para actualizar prepedido
const updatePrepedidoSchema = z.object({
  observaciones: z.string().optional().nullable(),
  items: z.array(z.object({
    productoId: z.number().int().positive(),
    cantidad: z.number().int().positive().min(1),
    precioEstimado: z.number().positive().optional(),
    unidad: z.string().optional(),
    observaciones: z.string().optional().nullable(),
    ofertaid: z.number().int().positive().optional().nullable()
  })).min(1, "Debe haber al menos un item")
})

// Schema para login
const loginSchema = z.object({
  usuario: z.string().min(1, "Usuario es requerido"),
  password: z.string().min(1, "Contraseña es requerida")
})

// Schema para cambiar contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres")
})

// Schema para producto
const productSearchSchema = z.object({
  search: z.string().optional(),
  marca: z.string().optional(),
  envase: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional()
})

// Schema para actualizar estado de pedido
const updatePedidoStatusSchema = z.object({
  estado: z.enum(['pendiente', 'en_proceso', 'completado', 'cancelado'], {
    errorMap: () => ({ message: "Estado debe ser: pendiente, en_proceso, completado o cancelado" })
  })
})

// Schema para calcular precio con oferta
const calcularPrecioOfertaSchema = z.object({
  oferta_id: z.number().int().positive("ID de oferta debe ser un número positivo"),
  producto_id: z.number().int().positive("ID de producto debe ser un número positivo"),
  cantidad: z.number().int().positive().min(1, "La cantidad debe ser al menos 1")
})

module.exports = {
  createPrepedidoSchema,
  updatePrepedidoSchema,
  loginSchema,
  changePasswordSchema,
  productSearchSchema,
  updatePedidoStatusSchema,
  calcularPrecioOfertaSchema
}
