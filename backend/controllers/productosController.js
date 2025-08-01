const { executeQuery } = require('../config/database');

// Obtener todos los productos con paginación
const getProductos = async (req, res) => {
  try {
    const { limite = 50, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;
    
    const query = `
      SELECT 
        p.id, p.codigo, p.nombre, p.precioVenta as precio,
        m.nombre as marca,
        e.nombre as envase, e.litros,
        te.nombre as tipo_envase
      FROM productos p
      LEFT JOIN marcas m ON p.marca = m.id
      LEFT JOIN envases e ON p.envase = e.id
      LEFT JOIN tipoenvase te ON e.tipoenvaseid = te.id
      ORDER BY p.nombre
      LIMIT ? OFFSET ?
    `;
    
    const productos = await executeQuery(query, [parseInt(limite), parseInt(offset)]);
    
    res.json({
      success: true,
      data: productos,
      pagination: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
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
      limite = 20, 
      pagina = 1 
    } = req.query;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    
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
        p.id, p.codigo, p.nombre, p.precioVenta as precio,
        m.nombre as marca,
        e.nombre as envase, e.litros,
        te.nombre as tipo_envase
      FROM productos p
      LEFT JOIN marcas m ON p.marca = m.id
      LEFT JOIN envases e ON p.envase = e.id
      LEFT JOIN tipoenvase te ON e.tipoenvaseid = te.id
      ${whereClause}
      ORDER BY p.nombre
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limite), parseInt(offset));
    
    const productos = await executeQuery(query, params);
    
    res.json({
      success: true,
      data: productos,
      pagination: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
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
        te.nombre as tipo_envase
      FROM productos p
      LEFT JOIN marcas m ON p.marca = m.id
      LEFT JOIN envases e ON p.envase = e.id
      LEFT JOIN tipoenvase te ON e.tipoenvaseid = te.id
      WHERE p.id = ?
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
      LEFT JOIN tipoenvase te ON e.tipoenvaseid = te.id
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