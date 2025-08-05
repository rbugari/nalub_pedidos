const { executeQuery } = require('../config/database');

// Obtener todas las ofertas con paginación
const getOfertas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id, titulo, descripcion, fecha_inicio, fecha_fin,
        descuento_porcentaje, descuento_monto, id_producto,
        imagen_url, activa, created_at
      FROM ofertas 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM ofertas';
    
    const [ofertas, countResult] = await Promise.all([
      executeQuery(query, [limit, offset]),
      executeQuery(countQuery)
    ]);
    
    // Formatear ofertas con el nuevo campo id_producto
    const ofertasFormateadas = ofertas.map(oferta => ({
      ...oferta,
      id_producto: oferta.id_producto || null
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
        id, titulo, descripcion, fecha_inicio, fecha_fin,
        descuento_porcentaje, descuento_monto, id_producto,
        imagen_url, created_at
      FROM ofertas 
      WHERE activa = 1 
        AND fecha_inicio <= CURDATE() 
        AND fecha_fin >= CURDATE()
        AND MONTH(fecha_inicio) = MONTH(CURDATE())
        AND YEAR(fecha_inicio) = YEAR(CURDATE())
      ORDER BY created_at DESC
    `;
    
    const ofertas = await executeQuery(query);
    
    // Formatear ofertas con el nuevo campo id_producto
    const ofertasFormateadas = ofertas.map(oferta => ({
      ...oferta,
      id_producto: oferta.id_producto || null
    }));
    
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
        id, titulo, descripcion, fecha_inicio, fecha_fin,
        descuento_porcentaje, descuento_monto, id_producto,
        imagen_url, created_at
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
    
    // Formatear oferta con el nuevo campo id_producto
    oferta.id_producto = oferta.id_producto || null;
    
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
        id, titulo, descripcion, fecha_inicio, fecha_fin,
        descuento_porcentaje, descuento_monto, id_producto,
        imagen_url, created_at
      FROM ofertas 
      WHERE activa = 1 
        AND fecha_inicio <= CURDATE() 
        AND fecha_fin >= CURDATE()
        AND (id_producto IS NULL OR id_producto = ?)
      ORDER BY created_at DESC
    `;
    
    const ofertas = await executeQuery(query, [producto_id]);
    
    // Formatear ofertas
    const ofertasFormateadas = ofertas.map(oferta => ({
      ...oferta,
      id_producto: oferta.id_producto || null
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
        id, titulo, descripcion, fecha_inicio, fecha_fin,
        descuento_porcentaje, descuento_monto, imagen_url
      FROM ofertas 
      WHERE activa = 1 
        AND fecha_inicio <= CURDATE() 
        AND fecha_fin >= CURDATE()
        AND MONTH(fecha_inicio) = MONTH(CURDATE())
        AND YEAR(fecha_inicio) = YEAR(CURDATE())
      ORDER BY 
        CASE 
          WHEN descuento_porcentaje IS NOT NULL THEN descuento_porcentaje 
          ELSE 0 
        END DESC,
        created_at DESC
      LIMIT 3
    `;
    
    const ofertas = await executeQuery(query);
    
    res.json({
      success: true,
      data: ofertas
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