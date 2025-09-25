const { executeQuery } = require('../config/database');

// Validar que el cliente existe
const validateCliente = async (req, res, next) => {
  try {
    const clienteId = req.user.id; // Del token JWT
    
    const query = 'SELECT id FROM clientes WHERE id = ?';
    const results = await executeQuery(query, [clienteId]);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error validando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Validar que el producto existe
const validateProducto = async (req, res, next) => {
  try {
    const { productoId } = req.body;
    
    if (!productoId) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto requerido'
      });
    }
    
    const query = 'SELECT id, nombre FROM productos WHERE id = ?';
    const results = await executeQuery(query, [productoId]);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    req.producto = results[0];
    next();
  } catch (error) {
    console.error('Error validando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Validar datos de pre-pedido
const validatePrepedido = (req, res, next) => {
  const { observaciones, items } = req.body;
  
  // Validar items
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Debe incluir al menos un item en el pre-pedido'
    });
  }
  
  // Validar cada item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item.productoId || !item.cantidad || !item.descripcion) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: productoId, cantidad y descripción son requeridos`
      });
    }
    
    if (item.cantidad <= 0) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: la cantidad debe ser mayor a 0`
      });
    }
  }
  
  next();
};

module.exports = {
  validateCliente,
  validateProducto,
  validatePrepedido
};