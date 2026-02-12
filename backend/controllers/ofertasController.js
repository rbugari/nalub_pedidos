const prisma = require('../lib/prisma');

/**
 * Función auxiliar: Calcular precio con oferta
 * @param {Object} oferta - Oferta con tipo, modo_precio, valor_precio, min_unidades_total
 * @param {Number} precioOriginal - Precio de venta del producto
 * @param {Number} cantidad - Cantidad de unidades
 * @returns {Object} { precioUnitario, precioTotal, descuentoPct, ofertaAplicada }
 */
const calcularPrecioConOferta = (oferta, precioOriginal, cantidad = 1) => {
  let precioUnitario = precioOriginal;
  let precioTotal = precioOriginal * cantidad;
  let descuentoPct = 0;
  let ofertaAplicada = false;

  // ✅ VALIDAR CANTIDAD MÍNIMA para ofertas tipo "minima" o "mix"
  if ((oferta.tipo === 'minima' || oferta.tipo === 'mix') && oferta.min_unidades_total) {
    if (cantidad < oferta.min_unidades_total) {
      // No se cumple el mínimo, usar precio normal
      return {
        precioUnitario: Math.round(precioOriginal * 100) / 100,
        precioTotal: Math.round((precioOriginal * cantidad) * 100) / 100,
        descuentoPct: 0,
        ofertaAplicada: false
      };
    }
  }

  // Según el modo de precio
  switch (oferta.modo_precio) {
    case 'precio_unitario':
      // El valor_precio es el precio unitario final
      precioUnitario = oferta.valor_precio || precioOriginal;
      precioTotal = precioUnitario * cantidad;
      descuentoPct = precioOriginal > 0 
        ? ((precioOriginal - precioUnitario) / precioOriginal) * 100 
        : 0;
      ofertaAplicada = true;
      break;

    case 'precio_pack':
      // El valor_precio es el precio total del pack/bundle
      // Para bundles, se divide entre la suma de unidades_fijas
      // Para mínimas, se divide entre min_unidades_total
      if (oferta.tipo === 'bundle' || oferta.tipo === 'minima') {
        const unidadesBase = oferta.unidades_totales || oferta.min_unidades_total || cantidad;
        precioUnitario = unidadesBase > 0 ? oferta.valor_precio / unidadesBase : precioOriginal;
        precioTotal = precioUnitario * cantidad;
        descuentoPct = precioOriginal > 0 
          ? ((precioOriginal - precioUnitario) / precioOriginal) * 100 
          : 0;
      } else {
        precioTotal = oferta.valor_precio || precioTotal;
        precioUnitario = cantidad > 0 ? precioTotal / cantidad : precioOriginal;
        descuentoPct = (precioOriginal * cantidad) > 0
          ? (((precioOriginal * cantidad) - precioTotal) / (precioOriginal * cantidad)) * 100
          : 0;
      }
      ofertaAplicada = true;
      break;

    case 'descuento_pct':
      // El valor_precio es el porcentaje de descuento
      descuentoPct = oferta.valor_precio || 0;
      precioUnitario = precioOriginal * (1 - descuentoPct / 100);
      precioTotal = precioUnitario * cantidad;
      ofertaAplicada = true;
      break;

    default:
      // Sin cambios
      break;
  }

  return {
    precioUnitario: Math.round(precioUnitario * 100) / 100,
    precioTotal: Math.round(precioTotal * 100) / 100,
    descuentoPct: Math.round(descuentoPct * 100) / 100,
    ofertaAplicada
  };
};

/**
 * Obtener todas las ofertas con paginación
 */
const getOfertas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [ofertas, total] = await Promise.all([
      prisma.ofertas.findMany({
        include: {
          ofertas_detalle: {
            include: {
              productos: {
                include: {
                  marcas: true,
                  envases: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: skip
      }),
      prisma.ofertas.count()
    ]);
    
    // Formatear ofertas con productos anidados
    const ofertasFormateadas = ofertas.map(oferta => ({
      id: oferta.id,
      titulo: oferta.titulo,
      descripcion: oferta.descripcion,
      fecha_inicio: oferta.fecha_inicio,
      fecha_fin: oferta.fecha_fin,
      tipo: oferta.tipo,
      modo_precio: oferta.modo_precio,
      valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
      min_unidades_total: oferta.min_unidades_total,
      unidad_base: oferta.unidad_base,
      activa: oferta.activa,
      created_at: oferta.created_at,
      productos: oferta.ofertas_detalle.map(detalle => ({
        detalle_id: detalle.id,
        producto_id: detalle.producto_id,
        unidades_fijas: detalle.unidades_fijas,
        codigo: detalle.productos.codigo,
        nombre: detalle.productos.nombre,
        precioVenta: parseFloat(detalle.productos.precioVenta.toString()),
        marca: detalle.productos.marcas?.nombre || null,
        envase: detalle.productos.envases?.nombre || null,
        litros: detalle.productos.envases?.litros || null
      }))
    }));
    
    res.json({
      success: true,
      data: ofertasFormateadas,
      total,
      page,
      limit
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener ofertas vigentes del mes actual
 */
const getOfertasVigentesMes = async (req, res) => {
  try {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const ofertas = await prisma.ofertas.findMany({
      where: {
        activa: true,
        fecha_inicio: { lte: hoy },
        fecha_fin: { gte: hoy },
        AND: [
          { fecha_inicio: { gte: primerDiaMes } },
          { fecha_inicio: { lte: ultimoDiaMes } }
        ]
      },
      include: {
        ofertas_detalle: {
          include: {
            productos: {
              include: {
                marcas: true,
                envases: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Formatear ofertas con cálculos de precio
    const ofertasFormateadas = ofertas.map(oferta => {
      // Filtrar detalles que tienen productos con stock
      const detallesConStock = oferta.ofertas_detalle.filter(
        detalle => detalle.productos.stockActual > 0
      );
      
      if (detallesConStock.length === 0) {
        return null;
      }
      
      // Calcular unidades totales para bundles
      const unidades_totales = detallesConStock.reduce(
        (sum, d) => sum + (d.unidades_fijas || 0), 
        0
      );
      
      // Preparar datos de la oferta para cálculos
      const ofertaData = {
        tipo: oferta.tipo,
        modo_precio: oferta.modo_precio,
        valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
        min_unidades_total: oferta.min_unidades_total,
        unidades_totales
      };
      
      // Formatear productos con fotos Y precio de oferta calculado
      const productos = detallesConStock.map(detalle => {
        const precioVenta = parseFloat(detalle.productos.precioVenta.toString());
        
        // Calcular precio con oferta para CADA producto
        const precioInfo = calcularPrecioConOferta(
          ofertaData,
          precioVenta,
          detalle.unidades_fijas || oferta.min_unidades_total || 1
        );
        
        return {
          detalle_id: detalle.id,
          producto_id: detalle.producto_id,
          unidades_fijas: detalle.unidades_fijas,
          codigo: detalle.productos.codigo,
          nombre: detalle.productos.nombre,
          precioVenta: precioVenta,
          precioOferta: precioInfo.precioUnitario, // ✅ PRECIO DE LA OFERTA
          descuentoPct: precioInfo.descuentoPct,
          stockActual: detalle.productos.stockActual,
          marca: detalle.productos.marcas?.nombre || null,
          envase: detalle.productos.envases?.nombre || null,
          litros: detalle.productos.envases?.litros || null,
          foto: detalle.productos.foto 
            ? `data:image/jpeg;base64,${detalle.productos.foto.toString('base64')}` 
            : null
        };
      });
      
      // El precio de referencia ahora viene del primer producto ya calculado
      const precioInfo = productos.length > 0 
        ? {
            precioUnitario: productos[0].precioOferta,
            descuentoPct: productos[0].descuentoPct
          }
        : { precioUnitario: 0, descuentoPct: 0 };
      
      return {
        id: oferta.id,
        titulo: oferta.titulo,
        descripcion: oferta.descripcion,
        fecha_inicio: oferta.fecha_inicio,
        fecha_fin: oferta.fecha_fin,
        tipo: oferta.tipo,
        modo_precio: oferta.modo_precio,
        valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
        min_unidades_total: oferta.min_unidades_total,
        unidad_base: oferta.unidad_base,
        activa: oferta.activa,
        created_at: oferta.created_at,
        productos,
        unidades_totales,
        precio_referencia: precioInfo.precioUnitario,
        precio_original: productos[0]?.precioVenta || 0,
        descuento_calculado: precioInfo.descuentoPct
      };
    }).filter(o => o !== null); // Filtrar ofertas sin stock
    
    console.log('Ofertas vigentes encontradas:', ofertasFormateadas.length);
    
    res.json({
      success: true,
      data: ofertasFormateadas,
      total: ofertasFormateadas.length
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas vigentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener oferta específica con detalle completo
 */
const getOferta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ofertaId = parseInt(id);
    if (isNaN(ofertaId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de oferta inválido'
      });
    }
    
    const oferta = await prisma.ofertas.findFirst({
      where: {
        id: ofertaId,
        activa: true
      },
      include: {
        ofertas_detalle: {
          include: {
            productos: {
              include: {
                marcas: true,
                envases: true
              }
            }
          }
        }
      }
    });
    
    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }
    
    // Formatear respuesta
    const ofertaFormateada = {
      id: oferta.id,
      titulo: oferta.titulo,
      descripcion: oferta.descripcion,
      fecha_inicio: oferta.fecha_inicio,
      fecha_fin: oferta.fecha_fin,
      tipo: oferta.tipo,
      modo_precio: oferta.modo_precio,
      valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
      min_unidades_total: oferta.min_unidades_total,
      unidad_base: oferta.unidad_base,
      activa: oferta.activa,
      created_at: oferta.created_at,
      productos: oferta.ofertas_detalle.map(detalle => ({
        detalle_id: detalle.id,
        producto_id: detalle.producto_id,
        unidades_fijas: detalle.unidades_fijas,
        codigo: detalle.productos.codigo,
        nombre: detalle.productos.nombre,
        precioVenta: parseFloat(detalle.productos.precioVenta.toString()),
        stockActual: detalle.productos.stockActual,
        marca: detalle.productos.marcas?.nombre || null,
        envase: detalle.productos.envases?.nombre || null,
        litros: detalle.productos.envases?.litros || null,
        foto: detalle.productos.foto 
          ? `data:image/jpeg;base64,${detalle.productos.foto.toString('base64')}` 
          : null
      }))
    };
    
    res.json({
      success: true,
      data: ofertaFormateada
    });
    
  } catch (error) {
    console.error('Error obteniendo oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener ofertas aplicables a un producto específico
 */
const getOfertasPorProducto = async (req, res) => {
  try {
    const { producto_id } = req.params;
    
    const productoId = parseInt(producto_id);
    if (isNaN(productoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }
    
    const hoy = new Date();
    
    // Buscar ofertas que contengan este producto
    const ofertas = await prisma.ofertas.findMany({
      where: {
        activa: true,
        fecha_inicio: { lte: hoy },
        fecha_fin: { gte: hoy },
        ofertas_detalle: {
          some: {
            producto_id: productoId
          }
        }
      },
      include: {
        ofertas_detalle: {
          where: {
            producto_id: productoId
          },
          include: {
            productos: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Calcular precios con oferta para cada una
    const ofertasConPrecios = ofertas.map(oferta => {
      const producto = oferta.ofertas_detalle[0]?.productos;
      
      if (!producto) {
        return {
          ...oferta,
          precio_con_oferta: 0
        };
      }
      
      const precioOriginal = parseFloat(producto.precioVenta.toString());
      const ofertaData = {
        tipo: oferta.tipo,
        modo_precio: oferta.modo_precio,
        valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
        min_unidades_total: oferta.min_unidades_total
      };
      
      const precioInfo = calcularPrecioConOferta(
        ofertaData,
        precioOriginal,
        oferta.min_unidades_total || 1
      );
      
      return {
        id: oferta.id,
        titulo: oferta.titulo,
        descripcion: oferta.descripcion,
        fecha_inicio: oferta.fecha_inicio,
        fecha_fin: oferta.fecha_fin,
        tipo: oferta.tipo,
        modo_precio: oferta.modo_precio,
        valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
        min_unidades_total: oferta.min_unidades_total,
        unidad_base: oferta.unidad_base,
        activa: oferta.activa,
        created_at: oferta.created_at,
        precio_original: precioOriginal,
        precio_con_oferta: precioInfo.precioUnitario,
        descuento_pct: precioInfo.descuentoPct
      };
    });
    
    res.json({
      success: true,
      data: ofertasConPrecios,
      total: ofertasConPrecios.length
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas por producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener ofertas destacadas para dashboard (top 3 con mayor descuento)
 */
const getOfertasDestacadas = async (req, res) => {
  try {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    const ofertas = await prisma.ofertas.findMany({
      where: {
        activa: true,
        fecha_inicio: { lte: hoy, gte: primerDiaMes },
        fecha_fin: { gte: hoy, lte: ultimoDiaMes }
      },
      include: {
        ofertas_detalle: {
          take: 1,
          include: {
            productos: {
              where: {
                stockActual: { gt: 0 }
              },
              select: {
                id: true,
                nombre: true,
                precioVenta: true,
                stockActual: true,
                foto: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });
    
    // Calcular descuentos y formatear
    const ofertasConDescuentos = ofertas.map(oferta => {
      const detalle = oferta.ofertas_detalle[0];
      const producto = detalle?.productos;
      
      if (!producto || producto.stockActual <= 0) {
        return null;
      }
      
      const precioOriginal = parseFloat(producto.precioVenta.toString());
      const ofertaData = {
        tipo: oferta.tipo,
        modo_precio: oferta.modo_precio,
        valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
        min_unidades_total: oferta.min_unidades_total
      };
      
      const precioInfo = calcularPrecioConOferta(
        ofertaData,
        precioOriginal,
        oferta.min_unidades_total || 1
      );
      
      return {
        id: oferta.id,
        titulo: oferta.titulo,
        descripcion: oferta.descripcion,
        fecha_inicio: oferta.fecha_inicio,
        fecha_fin: oferta.fecha_fin,
        tipo: oferta.tipo,
        modo_precio: oferta.modo_precio,
        valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
        min_unidades_total: oferta.min_unidades_total,
        unidad_base: oferta.unidad_base,
        activa: oferta.activa,
        created_at: oferta.created_at,
        producto_nombre: producto.nombre,
        producto_foto: producto.foto 
          ? `data:image/jpeg;base64,${producto.foto.toString('base64')}` 
          : null,
        precio_original: precioOriginal,
        precio_oferta: precioInfo.precioUnitario,
        descuento_pct: precioInfo.descuentoPct
      };
    }).filter(o => o !== null)
      .sort((a, b) => b.descuento_pct - a.descuento_pct)
      .slice(0, 3);
    
    res.json({
      success: true,
      data: ofertasConDescuentos
    });
    
  } catch (error) {
    console.error('Error obteniendo ofertas destacadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Calcular precio de producto con oferta aplicada
 * (Endpoint auxiliar para el frontend)
 */
const calcularPrecio = async (req, res) => {
  try {
    const { oferta_id, producto_id, cantidad } = req.body;
    
    // Obtener oferta
    const oferta = await prisma.ofertas.findFirst({
      where: {
        id: oferta_id,
        activa: true
      },
      select: {
        id: true,
        tipo: true,
        modo_precio: true,
        valor_precio: true,
        min_unidades_total: true,
        unidad_base: true
      }
    });
    
    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }
    
    // Obtener producto
    const producto = await prisma.productos.findUnique({
      where: { id: producto_id },
      select: {
        id: true,
        nombre: true,
        precioVenta: true
      }
    });
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Validar que el producto esté en la oferta
    const detalle = await prisma.ofertas_detalle.findFirst({
      where: {
        oferta_id: oferta_id,
        producto_id: producto_id
      }
    });
    
    if (!detalle) {
      return res.status(400).json({
        success: false,
        message: 'Este producto no participa en la oferta'
      });
    }
    
    // Validar cantidad mínima si aplica
    if (oferta.tipo === 'minima' && cantidad < oferta.min_unidades_total) {
      return res.status(400).json({
        success: false,
        message: `La oferta requiere un mínimo de ${oferta.min_unidades_total} unidades`,
        min_requerido: oferta.min_unidades_total
      });
    }
    
    // Calcular precio
    const precioOriginal = parseFloat(producto.precioVenta.toString());
    const ofertaData = {
      tipo: oferta.tipo,
      modo_precio: oferta.modo_precio,
      valor_precio: parseFloat(oferta.valor_precio?.toString() || '0'),
      min_unidades_total: oferta.min_unidades_total
    };
    
    const precioInfo = calcularPrecioConOferta(ofertaData, precioOriginal, cantidad);
    
    res.json({
      success: true,
      data: {
        oferta_id: oferta.id,
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        cantidad: cantidad,
        precio_original: precioOriginal,
        ...precioInfo,
        aplica_oferta: true
      }
    });
    
  } catch (error) {
    console.error('Error calculando precio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getOfertas,
  getOfertasVigentesMes,
  getOferta,
  getOfertasPorProducto,
  getOfertasDestacadas,
  calcularPrecio,
  calcularPrecioConOferta // Exportar para uso en otros controllers
};