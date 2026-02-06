const prisma = require('../lib/prisma');
const { calcularPrecioConOferta } = require('./ofertasController');

// Crear nuevo pre-pedido con Prisma
const createPrepedido = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { observaciones, items } = req.body;
    
    console.log('🚀 === INICIO createPrepedido ===');
    console.log('🔍 Cliente ID:', clienteId);
    console.log('🔍 Observaciones:', observaciones);
    console.log('🔍 Items recibidos:', items?.length || 0);

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
    }

    // Usar transacción de Prisma
    const result = await prisma.$transaction(async (tx) => {
      // Crear el prepedido
      const prepedido = await tx.prepedidos_cabecera.create({
        data: {
          cliente_id: clienteId,
          observaciones: observaciones || null,
          estado: 'borrador',
          fecha_creacion: new Date()
        }
      });
      
      console.log('✅ Prepedido creado con ID:', prepedido.id);

      // Insertar items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        console.log(`🔄 PROCESANDO ITEM ${i + 1}/${items.length}`);
        
        // Validar producto con Prisma
        const producto = await tx.productos.findFirst({
          where: {
            id: item.productoId,
            stockActual: { gt: 0 }
          },
          select: {
            id: true,
            nombre: true,
            precioVenta: true
          }
        });
        
        if (!producto) {
          throw new Error(`Producto con ID ${item.productoId} no encontrado o sin stock`);
        }
        
        let precioFinal = item.precioEstimado || producto.precioVenta;
        
        // Si hay ofertaid, calcular precio con oferta
        if (item.ofertaid) {
          console.log('🎁 Aplicando oferta ID:', item.ofertaid);
          
          const oferta = await tx.ofertas.findFirst({
            where: {
              id: item.ofertaid,
              activa: true
            },
            select: {
              id: true,
              tipo: true,
              modo_precio: true,
              valor_precio: true,
              min_unidades_total: true,
              unidad_base: true,
              activa: true
            }
          });
          
          if (oferta) {
            // Verificar que el producto esté en la oferta
            const detalle = await tx.ofertas_detalle.findFirst({
              where: {
                oferta_id: item.ofertaid,
                producto_id: item.productoId
              }
            });
            
            if (detalle) {
              const precioInfo = calcularPrecioConOferta(
                oferta,
                producto.precioVenta,
                item.cantidad || 1
              );
              
              precioFinal = precioInfo.precioUnitario;
              console.log('💰 Precio original:', producto.precioVenta);
              console.log('💰 Precio con oferta:', precioFinal);
            }
          }
        }
        
        // Insertar item
        await tx.prepedidos_items.create({
          data: {
            prepedido_id: prepedido.id,
            producto_id: item.productoId,
            descripcion: producto.nombre,
            cantidad: item.cantidad || 1,
            unidad: item.unidad || 'unidad',
            precio_estimado: precioFinal,
            importe_unitario: precioFinal,
            observaciones: item.observaciones || null,
            ofertaid: item.ofertaid || null
          }
        });
        
        console.log('✅ Item insertado');
      }

      return prepedido;
    });

    console.log('🎉 === TRANSACCIÓN CREATE COMPLETADA ===');

    res.status(201).json({
      success: true,
      message: 'Pre-pedido creado exitosamente',
      prepedidoId: result.id
    });

  } catch (error) {
    console.error('❌ ERROR EN createPrepedido:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Obtener pre-pedidos del usuario con Prisma
const getPrepedidos = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { estado, limite = 10, pagina = 1 } = req.query;
    
    console.log('🔍 getPrepedidos - Parámetros:', { clienteId, estado, limite, pagina });
    
    const where = {
      cliente_id: clienteId,
      ...(estado && { estado })
    };
    
    const offset = (pagina - 1) * parseInt(limite);
    
    const prepedidos = await prisma.prepedidos_cabecera.findMany({
      where,
      include: {
        clientes: {
          select: { nombre: true }
        },
        prepedidos_items: {
          select: {
            precio_estimado: true,
            cantidad: true
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      },
      take: parseInt(limite),
      skip: offset
    });
    
    // Transformar datos para el frontend
    const data = prepedidos.map(p => ({
      id: p.id,
      observaciones: p.observaciones,
      estado: p.estado,
      fecha_creacion: p.fecha_creacion,
      cliente: p.clientes.nombre,
      total_items: p.prepedidos_items.length,
      total_estimado: p.prepedidos_items.reduce((sum, item) => 
        sum + (Number(item.precio_estimado) * Number(item.cantidad)), 0
      )
    }));
    
    res.json({
      success: true,
      data,
      pagination: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: data.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo pre-pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener pre-pedido específico con Prisma
const getPrepedido = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteId = req.user.id;
    
    const prepedido = await prisma.prepedidos_cabecera.findFirst({
      where: {
        id: parseInt(id),
        cliente_id: clienteId
      },
      include: {
        prepedidos_items: {
          include: {
            productos: {
              select: {
                nombre: true,
                codigo: true
              }
            }
          }
        }
      }
    });
    
    if (!prepedido) {
      return res.status(404).json({
        success: false,
        message: 'Pre-pedido no encontrado'
      });
    }
    
    // Transformar items para el frontend
    const items = prepedido.prepedidos_items.map(item => ({
      id: item.id,
      producto_id: item.producto_id,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      unidad: item.unidad,
      precio_estimado: item.precio_estimado,
      observaciones: item.observaciones,
      ofertaid: item.ofertaid,
      producto_nombre: item.productos.nombre,
      producto_codigo: item.productos.codigo
    }));
    
    const totalEstimado = items.reduce((total, item) => 
      total + (Number(item.precio_estimado) * Number(item.cantidad)), 0
    );
    
    const data = {
      ...prepedido,
      items,
      total_estimado: totalEstimado,
      total_items: items.length
    };
    
    delete data.prepedidos_items;
    
    res.json({
      success: true,
      data
    });
    
  } catch (error) {
    console.error('Error obteniendo pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar pre-pedido (solo en estado borrador) con Prisma
const updatePrepedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { observaciones, items } = req.body;
    const clienteId = req.user.id;
    
    console.log('🚀 UPDATE PREPEDIDO');
    console.log('📋 Prepedido ID:', id);
    console.log('👤 Cliente ID:', clienteId);
    console.log('📝 Observaciones:', observaciones);
    console.log('📦 Items:', items?.length || 0);
    
    await prisma.$transaction(async (tx) => {
      // Verificar que el pre-pedido existe y está en estado borrador
      const prepedido = await tx.prepedidos_cabecera.findFirst({
        where: {
          id: parseInt(id),
          cliente_id: clienteId
        },
        select: { estado: true }
      });
      
      if (!prepedido) {
        throw new Error('Pre-pedido no encontrado');
      }
      
      if (prepedido.estado !== 'borrador') {
        throw new Error('Solo se pueden editar pre-pedidos en estado borrador');
      }
      
      // Actualizar cabecera
      await tx.prepedidos_cabecera.update({
        where: { id: parseInt(id) },
        data: { observaciones: observaciones || '' }
      });
      
      // Eliminar items existentes
      await tx.prepedidos_items.deleteMany({
        where: { prepedido_id: parseInt(id) }
      });
      
      // Insertar nuevos items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        console.log(`🔄 PROCESANDO ITEM ${i + 1}/${items.length}`);
        
        // Validar producto
        const producto = await tx.productos.findFirst({
          where: {
            id: item.productoId,
            stockActual: { gt: 0 }
          },
          select: {
            id: true,
            nombre: true,
            precioVenta: true
          }
        });
        
        if (!producto) {
          throw new Error(`Producto con ID ${item.productoId} no encontrado o sin stock`);
        }
        
        let precioFinal = item.precioEstimado || producto.precioVenta;
        
        // Si hay ofertaid, calcular precio con oferta
        if (item.ofertaid) {
          console.log('🎁 Aplicando oferta ID:', item.ofertaid);
          
          const oferta = await tx.ofertas.findFirst({
            where: {
              id: item.ofertaid,
              activa: true
            },
            select: {
              id: true,
              tipo: true,
              modo_precio: true,
              valor_precio: true,
              min_unidades_total: true,
              unidad_base: true,
              activa: true
            }
          });
          
          if (oferta) {
            const detalle = await tx.ofertas_detalle.findFirst({
              where: {
                oferta_id: item.ofertaid,
                producto_id: item.productoId
              }
            });
            
            if (detalle) {
              const precioInfo = calcularPrecioConOferta(
                oferta,
                producto.precioVenta,
                item.cantidad || 1
              );
              
              precioFinal = precioInfo.precioUnitario;
              console.log('💰 Precio con oferta:', precioFinal);
            }
          }
        }
        
        // Insertar item
        await tx.prepedidos_items.create({
          data: {
            prepedido_id: parseInt(id),
            producto_id: item.productoId,
            descripcion: producto.nombre,
            cantidad: item.cantidad || 1,
            unidad: item.unidad || 'unidad',
            precio_estimado: precioFinal,
            importe_unitario: precioFinal,
            observaciones: item.observaciones || null,
            ofertaid: item.ofertaid || null
          }
        });
        
        console.log('✅ Item insertado');
      }
    });
    
    console.log('🎉 === TRANSACCIÓN UPDATE COMPLETADA ===');
    
    res.json({
      success: true,
      message: 'Pre-pedido actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error actualizando pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

// Enviar pre-pedido (cambiar estado a enviado) con Prisma
const enviarPrepedido = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteId = req.user.id;
    
    // Verificar que el pre-pedido existe y está en estado borrador
    const prepedido = await prisma.prepedidos_cabecera.findFirst({
      where: {
        id: parseInt(id),
        cliente_id: clienteId
      },
      select: { estado: true }
    });
    
    if (!prepedido) {
      return res.status(404).json({
        success: false,
        message: 'Pre-pedido no encontrado'
      });
    }
    
    if (prepedido.estado !== 'borrador') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden enviar pre-pedidos en estado borrador'
      });
    }
    
    // Actualizar estado
    await prisma.prepedidos_cabecera.update({
      where: { id: parseInt(id) },
      data: { estado: 'enviado' }
    });
    
    res.json({
      success: true,
      message: 'Pre-pedido enviado exitosamente'
    });
    
  } catch (error) {
    console.error('Error enviando pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar pre-pedido (solo en estado borrador) con Prisma
const deletePrepedido = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteId = req.user.id;
    
    await prisma.$transaction(async (tx) => {
      // Verificar que el pre-pedido existe y está en estado borrador
      const prepedido = await tx.prepedidos_cabecera.findFirst({
        where: {
          id: parseInt(id),
          cliente_id: clienteId
        },
        select: { estado: true }
      });
      
      if (!prepedido) {
        throw new Error('Pre-pedido no encontrado');
      }
      
      if (prepedido.estado !== 'borrador') {
        throw new Error('Solo se pueden eliminar pre-pedidos en estado borrador');
      }
      
      // Eliminar items primero (por constraint de FK)
      await tx.prepedidos_items.deleteMany({
        where: { prepedido_id: parseInt(id) }
      });
      
      // Eliminar cabecera
      await tx.prepedidos_cabecera.delete({
        where: { id: parseInt(id) }
      });
    });
    
    res.json({
      success: true,
      message: 'Pre-pedido eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

module.exports = {
  createPrepedido,
  getPrepedidos,
  getPrepedido,
  updatePrepedido,
  enviarPrepedido,
  deletePrepedido
};