const { executeQuery } = require('../config/database');

// Obtener todas las ofertas con paginación
const getOfertas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id, titulo, fecha_inicio, fecha_fin,
        precio_original, precio_oferta, id_producto,
        activa, created_at
      FROM ofertas 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM ofertas';
    
    const [ofertas, countResult] = await Promise.all([
      executeQuery(query, [limit, offset]),
      executeQuery(countQuery)
    ]);
    
    // Formatear ofertas con precios directos
    const ofertasFormateadas = ofertas.map(oferta => ({
      ...oferta,
      id_producto: oferta.id_producto || null,
      precio_original: oferta.precio_original || 0,
      precio_oferta: oferta.precio_oferta || 0
    }));
    
    res.json({
      success: true,
      data: ofertasFormateadas,
      total: countResult[0].total,
      page,
      limit
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ofertas vigentes del mes actual
const getOfertasVigentesMes = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id, o.titulo, o.fecha_inicio, o.fecha_fin,
        o.precio_original, o.precio_oferta, o.id_producto,
        o.created_at,
        p.id as producto_id,
        p.codigo as producto_codigo,
        p.nombre as producto_nombre,
        p.precioVenta as producto_precio,
        m.nombre as producto_marca,
        e.nombre as producto_envase,
        e.litros as producto_litros,
        CASE 
          WHEN p.foto IS NOT NULL THEN CONCAT('data:image/jpeg;base64,', TO_BASE64(p.foto))
          ELSE NULL 
        END as producto_foto
      FROM ofertas o
      LEFT JOIN productos p ON o.id_producto = p.id
      LEFT JOIN marcas m ON p.marca = m.id
      LEFT JOIN envases e ON p.envase = e.id
      WHERE o.activa = 1 
        AND o.fecha_inicio <= CURDATE() 
        AND o.fecha_fin >= CURDATE()
        AND MONTH(o.fecha_inicio) = MONTH(CURDATE())
        AND YEAR(o.fecha_inicio) = YEAR(CURDATE())
        AND (p.id IS NULL OR p.stockActual > 0)
      ORDER BY o.created_at DESC
    `;
    
    const ofertas = await executeQuery(query);
    
    // Formatear ofertas con precios directos
    const ofertasFormateadas = ofertas.map(oferta => {
      return {
        ...oferta,
        id_producto: oferta.id_producto || null,
        producto_id: oferta.producto_id || null,
        producto_codigo: oferta.producto_codigo || '',
        producto_nombre: oferta.producto_nombre || '',
        producto_precio: oferta.producto_precio || 0,
        producto_precio_original: oferta.precio_original || 0,
        producto_precio_oferta: oferta.precio_oferta || 0,
        producto_marca: oferta.producto_marca || '',
        producto_envase: oferta.producto_envase || '',
        producto_litros: oferta.producto_litros || 0,
        producto_foto: oferta.producto_foto || null
      };
    });
    
    console.log('Ofertas vigentes encontradas:', ofertasFormateadas.length);
    if (ofertasFormateadas.length > 0) {
      console.log('Primera oferta:', JSON.stringify(ofertasFormateadas[0], null, 2));
    }
    
    res.json({
      success: true,
      data: ofertasFormateadas,
      total: ofertasFormateadas.length
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas vigentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener oferta específica
const getOferta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id, titulo, fecha_inicio, fecha_fin,
        precio_original, precio_oferta, id_producto,
        created_at
      FROM ofertas 
      WHERE id = ? AND activa = 1
    `;
    
    const ofertas = await executeQuery(query, [id]);
    
    if (ofertas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }
    
    const oferta = ofertas[0];
    
    // Formatear oferta con precios directos
    oferta.id_producto = oferta.id_producto || null;
    oferta.precio_original = oferta.precio_original || 0;
    oferta.precio_oferta = oferta.precio_oferta || 0;
    
    res.json({
      success: true,
      data: oferta
    });
    
  } catch (error) {
    console.error('Error obteniendo oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ofertas aplicables a un producto específico
const getOfertasPorProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;
    
    const query = `
      SELECT 
        id, titulo, fecha_inicio, fecha_fin,
        precio_original, precio_oferta, id_producto,
        created_at
      FROM ofertas 
      WHERE activa = 1 
        AND fecha_inicio <= CURDATE() 
        AND fecha_fin >= CURDATE()
        AND (id_producto IS NULL OR id_producto = ?)
      ORDER BY created_at DESC
    `;
    
    const ofertas = await executeQuery(query, [producto_id]);
    
    // Formatear ofertas con precios directos
    const ofertasFormateadas = ofertas.map(oferta => ({
      ...oferta,
      id_producto: oferta.id_producto || null,
      precio_original: oferta.precio_original || 0,
      precio_oferta: oferta.precio_oferta || 0
    }));
    
    res.json({
      success: true,
      data: ofertasFormateadas,
      total: ofertasFormateadas.length
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas por producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener ofertas destacadas para dashboard (top 3)
const getOfertasDestacadas = async (req, res) => {
  try {
    const query = `
      SELECT 
        o.id, o.titulo, o.fecha_inicio, o.fecha_fin,
        o.precio_original, o.precio_oferta, o.id_producto,
        p.nombre as producto_nombre, p.precioVenta as producto_precio, p.foto as producto_foto
      FROM ofertas o
      LEFT JOIN productos p ON o.id_producto = p.id
      WHERE o.activa = 1 
        AND o.fecha_inicio <= CURDATE() 
        AND o.fecha_fin >= CURDATE()
        AND MONTH(o.fecha_inicio) = MONTH(CURDATE())
        AND YEAR(o.fecha_inicio) = YEAR(CURDATE())
        AND (p.id IS NULL OR p.stockActual > 0)
      ORDER BY 
        CASE 
          WHEN o.precio_original > 0 AND o.precio_oferta > 0 
          THEN ((o.precio_original - o.precio_oferta) / o.precio_original) * 100
          ELSE 0 
        END DESC,
        o.created_at DESC
      LIMIT 3
    `;
    
    const ofertas = await executeQuery(query);
    
    // Formatear ofertas con precios directos
    const ofertasFormateadas = ofertas.map(oferta => ({
      ...oferta,
      precio_original: oferta.precio_original || 0,
      precio_oferta: oferta.precio_oferta || 0,
      producto_precio: oferta.producto_precio || 0
    }));
    
    res.json({
      success: true,
      data: ofertasFormateadas
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas destacadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getOfertas,
  getOfertasVigentesMes,
  getOferta,
  getOfertasPorProducto,
  getOfertasDestacadas
};