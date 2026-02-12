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
          console.log('🎁 Validando oferta ID:', item.ofertaid);
          
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
              activa: true,
              fecha_inicio: true,
              fecha_fin: true,
              titulo: true
            }
          });
          
          if (oferta) {
            // ✅ VALIDAR VIGENCIA DE LA OFERTA
            const hoy = new Date();
            const vigente = oferta.activa && 
                           oferta.fecha_inicio <= hoy && 
                           oferta.fecha_fin >= hoy;
            
            if (!vigente) {
              console.log(`⚠️  Oferta ${item.ofertaid} ("${oferta.titulo}") ya no está vigente - usando precio normal`);
              // No aplicar precio de oferta, usar precio normal
              precioFinal = item.precioEstimado || producto.precioVenta;
            } else {
              // Oferta vigente, aplicar precio
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
                console.log('💰 Precio con oferta vigente:', precioFinal);
              }
            }
          } else {
            console.log(`⚠️  Oferta ${item.ofertaid} no encontrada o inactiva - usando precio normal`);
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
          console.log('🎁 Validando oferta ID:', item.ofertaid);
          
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
              activa: true,
              fecha_inicio: true,
              fecha_fin: true,
              titulo: true
            }
          });
          
          if (oferta) {
            // ✅ VALIDAR VIGENCIA DE LA OFERTA
            const hoy = new Date();
            const vigente = oferta.activa && 
                           oferta.fecha_inicio <= hoy && 
                           oferta.fecha_fin >= hoy;
            
            if (!vigente) {
              console.log(`⚠️  Oferta ${item.ofertaid} ("${oferta.titulo}") ya no está vigente - usando precio normal`);
              // No aplicar precio de oferta, usar precio normal
              precioFinal = item.precioEstimado || producto.precioVenta;
            } else {
              // Oferta vigente, aplicar precio
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
                console.log('💰 Precio con oferta vigente:', precioFinal);
              }
            }
          } else {
            console.log(`⚠️  Oferta ${item.ofertaid} no encontrada o inactiva - usando precio normal`);
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
    
    console.log('🚀 === VALIDANDO ENVÍO DE PREPEDIDO ===');
    console.log('📋 Prepedido ID:', id);
    console.log('👤 Cliente ID:', clienteId);
    
    // Verificar que el pre-pedido existe y está en estado borrador
    const prepedido = await prisma.prepedidos_cabecera.findFirst({
      where: {
        id: parseInt(id),
        cliente_id: clienteId
      },
      include: {
        prepedidos_items: {
          where: {
            ofertaid: { not: null }
          },
          select: {
            id: true,
            ofertaid: true,
            descripcion: true,
            producto_id: true
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
    
    if (prepedido.estado !== 'borrador') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden enviar pre-pedidos en estado borrador'
      });
    }
    
    // ✅ VALIDAR OFERTAS VIGENTES
    if (prepedido.prepedidos_items.length > 0) {
      console.log(`🎁 Validando ${prepedido.prepedidos_items.length} items con ofertas`);
      
      const hoy = new Date();
      const ofertasIds = [...new Set(prepedido.prepedidos_items.map(item => item.ofertaid))];
      
      console.log('🔍 IDs de ofertas a validar:', ofertasIds);
      
      // Obtener todas las ofertas referenciadas
      const ofertas = await prisma.ofertas.findMany({
        where: {
          id: { in: ofertasIds }
        },
        select: {
          id: true,
          titulo: true,
          activa: true,
          fecha_inicio: true,
          fecha_fin: true
        }
      });
      
      // Verificar vigencia de cada oferta
      const ofertasExpiradas = [];
      const ofertasInactivas = [];
      
      for (const oferta of ofertas) {
        const vigente = oferta.activa && 
                       oferta.fecha_inicio <= hoy && 
                       oferta.fecha_fin >= hoy;
        
        if (!vigente) {
          const itemsAfectados = prepedido.prepedidos_items.filter(
            item => item.ofertaid === oferta.id
          );
          
          if (!oferta.activa) {
            ofertasInactivas.push({
              id: oferta.id,
              titulo: oferta.titulo,
              items: itemsAfectados.map(i => i.descripcion)
            });
          } else if (oferta.fecha_fin < hoy) {
            ofertasExpiradas.push({
              id: oferta.id,
              titulo: oferta.titulo,
              fecha_fin: oferta.fecha_fin,
              items: itemsAfectados.map(i => i.descripcion)
            });
          }
        }
      }
      
      // Si hay ofertas expiradas o inactivas, rechazar el envío
      if (ofertasExpiradas.length > 0 || ofertasInactivas.length > 0) {
        console.log('❌ OFERTAS NO VIGENTES DETECTADAS');
        console.log('Expiradas:', ofertasExpiradas);
        console.log('Inactivas:', ofertasInactivas);
        
        let mensajeError = 'No se puede enviar el prepedido porque contiene ofertas que ya no están vigentes:\n\n';
        
        if (ofertasExpiradas.length > 0) {
          mensajeError += '🗓️ Ofertas expiradas:\n';
          ofertasExpiradas.forEach(oferta => {
            const fechaFin = new Date(oferta.fecha_fin).toLocaleDateString('es-AR');
            mensajeError += `  • "${oferta.titulo}" (venció el ${fechaFin})\n`;
            mensajeError += `    Productos afectados: ${oferta.items.join(', ')}\n`;
          });
        }
        
        if (ofertasInactivas.length > 0) {
          mensajeError += '\n❌ Ofertas inactivas:\n';
          ofertasInactivas.forEach(oferta => {
            mensajeError += `  • "${oferta.titulo}"\n`;
            mensajeError += `    Productos afectados: ${oferta.items.join(', ')}\n`;
          });
        }
        
        mensajeError += '\n👉 Por favor, edita tu prepedido y elimina o reemplaza estos productos.';
        
        return res.status(400).json({
          success: false,
          message: mensajeError,
          ofertas_expiradas: ofertasExpiradas.map(o => ({ 
            id: o.id, 
            titulo: o.titulo,
            fecha_fin: o.fecha_fin
          })),
          ofertas_inactivas: ofertasInactivas.map(o => ({ 
            id: o.id, 
            titulo: o.titulo 
          }))
        });
      }
      
      console.log('✅ Todas las ofertas están vigentes');
    }
    
    // Actualizar estado
    await prisma.prepedidos_cabecera.update({
      where: { id: parseInt(id) },
      data: { estado: 'enviado' }
    });
    
    console.log('🎉 Prepedido enviado exitosamente');
    
    res.json({
      success: true,
      message: 'Pre-pedido enviado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error enviando pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
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