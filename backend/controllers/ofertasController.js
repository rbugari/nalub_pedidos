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
        o.id, o.titulo, o.descripcion, o.fecha_inicio, o.fecha_fin,
        o.descuento_porcentaje, o.descuento_monto, o.imagen_url, o.id_producto,
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
      ORDER BY o.created_at DESC
    `;
    
    const ofertas = await executeQuery(query);
    
    // Formatear ofertas con todos los campos del producto
    const ofertasFormateadas = ofertas.map(oferta => {
      // Calcular precio con descuento
      let precioOferta = oferta.producto_precio || 0;
      if (oferta.descuento_porcentaje) {
        precioOferta = precioOferta * (1 - oferta.descuento_porcentaje / 100);
      } else if (oferta.descuento_monto) {
        precioOferta = Math.max(0, precioOferta - oferta.descuento_monto);
      }
      
      return {
        ...oferta,
        id_producto: oferta.id_producto || null,
        producto_id: oferta.producto_id || null,
        producto_codigo: oferta.producto_codigo || '',
        producto_nombre: oferta.producto_nombre || '',
        producto_precio: oferta.producto_precio || 0,
        producto_precio_oferta: Math.round(precioOferta * 100) / 100,
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
        o.id, o.titulo, o.descripcion, o.fecha_inicio, o.fecha_fin,
        o.descuento_porcentaje, o.descuento_monto, o.imagen_url, o.id_producto,
        p.nombre as producto_nombre, p.precio as producto_precio, p.foto as producto_foto
      FROM ofertas o
      LEFT JOIN productos p ON o.id_producto = p.id
      WHERE o.activa = 1 
        AND o.fecha_inicio <= CURDATE() 
        AND o.fecha_fin >= CURDATE()
        AND MONTH(o.fecha_inicio) = MONTH(CURDATE())
        AND YEAR(o.fecha_inicio) = YEAR(CURDATE())
      ORDER BY 
        CASE 
          WHEN o.descuento_porcentaje IS NOT NULL THEN o.descuento_porcentaje 
          ELSE 0 
        END DESC,
        o.created_at DESC
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