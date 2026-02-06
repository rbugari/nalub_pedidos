const prisma = require('../lib/prisma');

// Obtener todos los productos con paginación - Prisma
const getProductos = async (req, res) => {
  try {
    const { limite = 1000, pagina = 1 } = req.query;
    const clienteId = req.user?.id;
    
    console.log('🔍 getProductos - clienteId:', clienteId);
    
    // Obtener cliente para sus porcentajes
    const cliente = await prisma.clientes.findUnique({
      where: { id: clienteId },
      select: {
        porcentaje1: true,
        porcentaje2: true,
        porcentaje3: true
      }
    });
    
    // Obtener productos con relaciones
    const productos = await prisma.productos.findMany({
      where: {
        stockActual: { gt: 0 },
        precioVenta: { gt: 0 }
      },
      include: {
        marcas: {
          select: { nombre: true }
        },
        envases: {
          select: {
            nombre: true,
            litros: true,
            tipoEnvase: {
              select: { nombre: true }
            }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    
    // Transformar datos y calcular precios
    const data = productos.map(p => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precioBase: p.precioVenta,
      precioVenta: p.precioVenta,
      stockActual: p.stockActual,
      precio1: Math.round((p.precioVenta * (1 + (cliente?.porcentaje1 || 0) / 100)) * 100) / 100,
      precio2: Math.round((p.precioVenta * (1 + (cliente?.porcentaje2 || 0) / 100)) * 100) / 100,
      precio3: Math.round((p.precioVenta * (1 + (cliente?.porcentaje3 || 0) / 100)) * 100) / 100,
      marca: p.marcas?.nombre || null,
      envase: p.envases?.nombre || null,
      litros: p.envases?.litros || null,
      tipo_envase: p.envases?.tipoEnvase?.nombre || null,
      foto: p.foto ? `data:image/jpeg;base64,${p.foto.toString('base64')}` : null,
      porcentaje1: cliente?.porcentaje1 || 0,
      porcentaje2: cliente?.porcentaje2 || 0,
      porcentaje3: cliente?.porcentaje3 || 0
    }));
    
    console.log('🔍 getProductos - Productos encontrados:', data.length);
    
    res.json({
      success: true,
      data,
      pagination: {
        pagina: 1,
        limite: data.length,
        total: data.length
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

// Buscar productos con filtros - Prisma
const searchProductos = async (req, res) => {
  try {
    const { 
      q = '', 
      marca = '', 
      envase = '', 
      limite = 1000, 
      pagina = 1 
    } = req.query;
    
    const clienteId = req.user?.id;
    
    // Construir where clause dinámicamente
    const where = {
      AND: [
        { stockActual: { gt: 0 } },
        { precioVenta: { gt: 0 } }
      ]
    };
    
    if (q) {
      where.AND.push({
        OR: [
          { nombre: { contains: q } },
          { codigo: { contains: q } }
        ]
      });
    }
    
    if (marca) {
      where.AND.push({
        marcas: {
          nombre: { contains: marca }
        }
      });
    }
    
    if (envase) {
      where.AND.push({
        envases: {
          nombre: { contains: envase }
        }
      });
    }
    
    // Obtener cliente para sus porcentajes
    const cliente = await prisma.clientes.findUnique({
      where: { id: clienteId },
      select: {
        porcentaje1: true,
        porcentaje2: true,
        porcentaje3: true
      }
    });
    
    // Obtener productos con filtros
    const productos = await prisma.productos.findMany({
      where,
      include: {
        marcas: {
          select: { nombre: true }
        },
        envases: {
          select: {
            nombre: true,
            litros: true,
            tipoEnvase: {
              select: { nombre: true }
            }
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    
    // Transformar datos
    const data = productos.map(p => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precioBase: p.precioVenta,
      precio1: Math.round((p.precioVenta * (1 + (cliente?.porcentaje1 || 0) / 100)) * 100) / 100,
      precio2: Math.round((p.precioVenta * (1 + (cliente?.porcentaje2 || 0) / 100)) * 100) / 100,
      precio3: Math.round((p.precioVenta * (1 + (cliente?.porcentaje3 || 0) / 100)) * 100) / 100,
      marca: p.marcas?.nombre || null,
      envase: p.envases?.nombre || null,
      litros: p.envases?.litros || null,
      tipo_envase: p.envases?.tipoEnvase?.nombre || null,
      foto: p.foto ? `data:image/jpeg;base64,${p.foto.toString('base64')}` : null,
      precio_oferta: null,
      precio_original: null,
      en_oferta: 0,
      porcentaje1: cliente?.porcentaje1 || 0,
      porcentaje2: cliente?.porcentaje2 || 0,
      porcentaje3: cliente?.porcentaje3 || 0
    }));
    
    res.json({
      success: true,
      data,
      pagination: {
        pagina: 1,
        limite: data.length,
        total: data.length
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

// Obtener producto específico - Prisma
const getProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await prisma.productos.findFirst({
      where: {
        id: parseInt(id),
        stockActual: { gt: 0 },
        precioVenta: { gt: 0 }
      },
      include: {
        marcas: {
          select: { nombre: true }
        },
        envases: {
          select: {
            nombre: true,
            litros: true,
            tipoEnvase: {
              select: { nombre: true }
            }
          }
        }
      }
    });
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Transformar datos
    const data = {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: producto.precioVenta,
      marca: producto.marcas?.nombre || null,
      envase: producto.envases?.nombre || null,
      litros: producto.envases?.litros || null,
      tipo_envase: producto.envases?.tipoEnvase?.nombre || null,
      foto: producto.foto ? `data:image/jpeg;base64,${producto.foto.toString('base64')}` : null,
      precio_oferta: null,
      precio_original: null,
      en_oferta: 0
    };
    
    res.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener marcas disponibles - Prisma
const getMarcas = async (req, res) => {
  try {
    const marcas = await prisma.marcas.findMany({
      select: {
        id: true,
        nombre: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
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

// Obtener envases disponibles - Prisma
const getEnvases = async (req, res) => {
  try {
    const envases = await prisma.envases.findMany({
      include: {
        tipoEnvase: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    // Transformar datos
    const data = envases.map(e => ({
      id: e.id,
      nombre: e.nombre,
      litros: e.litros,
      tipo_envase: e.tipoEnvase?.nombre || null
    }));
    
    res.json({
      success: true,
      data
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