const { executeQuery } = require('../config/database');

// Obtener todos los productos con paginación
const getProductos = async (req, res) => {
  try {
    const { limite = 1000, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;
    
    // Obtener ID del cliente autenticado desde el token JWT
    const clienteId = req.user?.id;
    
    console.log('🔍 DEBUG getProductos - clienteId:', clienteId);
    console.log('🔍 DEBUG getProductos - req.user:', req.user);
    
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, 
        p.precioVenta as precioBase,
        ROUND(p.precioVenta * (1 + COALESCE(c.porcentaje1, 0) / 100), 2) as precio1,
        ROUND(p.precioVenta * (1 + COALESCE(c.porcentaje2, 0) / 100), 2) as precio2,
        ROUND(p.precioVenta * (1 + COALESCE(c.porcentaje3, 0) / 100), 2) as precio3,
        m.nombre as marca,
        e.nombre as envase, e.litros,
        te.nombre as tipo_envase,
        CASE 
          WHEN p.foto IS NOT NULL THEN CONCAT('data:image/jpeg;base64,', TO_BASE64(p.foto))
          ELSE NULL 
        END as foto,
        o.precio_oferta,
        o.precio_original,
        CASE 
          WHEN o.id IS NOT NULL THEN 1
          ELSE 0
        END as en_oferta,
        c.porcentaje1,
        c.porcentaje2,
        c.porcentaje3
      FROM productos p
      LEFT JOIN marcas m ON p.marca = m.id
      LEFT JOIN envases e ON p.envase = e.id
      LEFT JOIN tipoEnvase te ON e.tipoenvaseid = te.id
      LEFT JOIN ofertas o ON p.id = o.id_producto 
        AND o.activa = 1 
        AND o.fecha_inicio <= CURDATE() 
        AND o.fecha_fin >= CURDATE()
      LEFT JOIN clientes c ON c.id = ?
      WHERE p.stockActual > 0 AND p.precioVenta > 0
      ORDER BY p.nombre
    `;
    
    console.log('🔍 DEBUG getProductos - Ejecutando query con parámetros:', [clienteId]);
    
    const productos = await executeQuery(query, [clienteId]);
    
    console.log('🔍 DEBUG getProductos - Productos encontrados:', productos.length);
    if (productos.length > 0) {
      console.log('🔍 DEBUG getProductos - Primer producto:', JSON.stringify(productos[0], null, 2));
    }
    
    res.json({
      success: true,
      data: productos,
      pagination: {
        pagina: 1,
        limite: productos.length,
        total: productos.length
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Buscar productos con filtros
const searchProductos = async (req, res) => {
  try {
    const { 
      q = '', 
      marca = '', 
      envase = '', 
      limite = 1000, 
      pagina = 1 
    } = req.query;
    
    // Obtener ID del cliente autenticado desde el token JWT
    const clienteId = req.user?.id;
    
    let whereClause = 'WHERE p.stockActual > 0 AND p.precioVenta > 0';
    let params = [clienteId]; // Agregar clienteId como primer parámetro
    
    if (q) {
      whereClause += ' AND (p.nombre LIKE ? OR p.codigo LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    
    if (marca) {
      whereClause += ' AND m.nombre LIKE ?';
      params.push(`%${marca}%`);
    }
    
    if (envase) {
      whereClause += ' AND e.nombre LIKE ?';
      params.push(`%${envase}%`);
    }
    
    const offset = (pagina - 1) * limite;
    
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, 
        p.precioVenta as precioBase,
        ROUND(p.precioVenta * (1 + COALESCE(c.porcentaje1, 0) / 100), 2) as precio1,
        ROUND(p.precioVenta * (1 + COALESCE(c.porcentaje2, 0) / 100), 2) as precio2,
        ROUND(p.precioVenta * (1 + COALESCE(c.porcentaje3, 0) / 100), 2) as precio3,
        m.nombre as marca,
        e.nombre as envase, e.litros,
        te.nombre as tipo_envase,
        CASE 
          WHEN p.foto IS NOT NULL THEN CONCAT('data:image/jpeg;base64,', TO_BASE64(p.foto))
          ELSE NULL 
        END as foto,
        o.precio_oferta,
        o.precio_original,
        CASE 
          WHEN o.id IS NOT NULL THEN 1
          ELSE 0
        END as en_oferta,
        c.porcentaje1,
        c.porcentaje2,
        c.porcentaje3
      FROM productos p
      LEFT JOIN marcas m ON p.marca = m.id
      LEFT JOIN envases e ON p.envase = e.id
      LEFT JOIN tipoEnvase te ON e.tipoenvaseid = te.id
      LEFT JOIN ofertas o ON p.id = o.id_producto 
        AND o.activa = 1 
        AND o.fecha_inicio <= CURDATE() 
        AND o.fecha_fin >= CURDATE()
      LEFT JOIN clientes c ON c.id = ?
      ${whereClause}
      ORDER BY p.nombre
    `;
    
    const productos = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: productos,
      pagination: {
        pagina: 1,
        limite: productos.length,
        total: productos.length
      }
    });
    
  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener producto específico
const getProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.precioVenta as precio,
        m.nombre as marca,
        e.nombre as envase, e.litros,
        te.nombre as tipo_envase,
        CASE 
          WHEN p.foto IS NOT NULL THEN CONCAT('data:image/jpeg;base64,', TO_BASE64(p.foto))
          ELSE NULL 
        END as foto,
        o.precio_oferta,
        o.precio_original,
        CASE 
          WHEN o.id IS NOT NULL THEN 1
          ELSE 0
        END as en_oferta
      FROM productos p
      LEFT JOIN marcas m ON p.marca = m.id
      LEFT JOIN envases e ON p.envase = e.id
      LEFT JOIN tipoEnvase te ON e.tipoenvaseid = te.id
      LEFT JOIN ofertas o ON p.id = o.id_producto 
        AND o.activa = 1 
        AND o.fecha_inicio <= CURDATE() 
        AND o.fecha_fin >= CURDATE()
      WHERE p.id = ? AND p.stockActual > 0 AND p.precioVenta > 0
    `;
    
    const productos = await executeQuery(query, [id]);
    
    if (productos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: productos[0]
    });
    
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener marcas disponibles
const getMarcas = async (req, res) => {
  try {
    const query = 'SELECT id, nombre FROM marcas ORDER BY nombre';
    const marcas = await executeQuery(query);
    
    res.json({
      success: true,
      data: marcas
    });
    
  } catch (error) {
    console.error('Error obteniendo marcas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener envases disponibles
const getEnvases = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id, e.nombre, e.litros,
        te.nombre as tipo_envase
      FROM envases e
      LEFT JOIN tipoEnvase te ON e.tipoenvaseid = te.id
      ORDER BY e.nombre
    `;
    
    const envases = await executeQuery(query);
    
    res.json({
      success: true,
      data: envases
    });
    
  } catch (error) {
    console.error('Error obteniendo envases:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getProductos,
  searchProductos,
  getProducto,
  getMarcas,
  getEnvases
};