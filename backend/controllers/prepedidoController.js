const { executeQuery } = require('../config/database');

// Crear nuevo pre-pedido
const createPrepedido = async (req, res) => {
  const connection = await require('../config/database').pool.getConnection();
  
  try {
    const clienteId = req.user.id;
    const { observaciones, items } = req.body;
    
    // 🔍 DEBUG ULTRA-DETALLADO: Verificar datos recibidos
    console.log('🚀 === INICIO createPrepedido ===');
    console.log('🔍 Cliente ID:', clienteId);
    console.log('🔍 Observaciones:', observaciones);
    console.log('🔍 Items recibidos (RAW):', JSON.stringify(items, null, 2));
    console.log('🔍 Cantidad de items:', items?.length || 0);
    
    // Verificar cada item individualmente
    items?.forEach((item, index) => {
      console.log(`🎯 ITEM ${index + 1}:`, {
        productoId: item.productoId,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        ofertaid: item.ofertaid,
        ofertaid_type: typeof item.ofertaid,
        ofertaid_is_null: item.ofertaid === null,
        ofertaid_is_undefined: item.ofertaid === undefined
      });
    });

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
    }

    await connection.beginTransaction();

    // Crear el prepedido
    const prepedidoQuery = `
      INSERT INTO prepedidos_cabecera (cliente_id, observaciones, estado, fecha_creacion)
      VALUES (?, ?, 'borrador', NOW())
    `;
    
    const [prepedidoResult] = await connection.execute(prepedidoQuery, [
      clienteId,
      observaciones || null
    ]);
    
    const prepedidoId = prepedidoResult.insertId;
    console.log('✅ Prepedido creado con ID:', prepedidoId);

    // Insertar items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      console.log(`🔄 PROCESANDO ITEM ${i + 1}/${items.length}:`);
      console.log('📦 Item RAW del frontend:', JSON.stringify(item, null, 2));
      console.log('🎯 OFERTAID RAW:', item.ofertaid, 'Tipo:', typeof item.ofertaid);
      
      // Validar producto
      const productoQuery = 'SELECT id, nombre FROM productos WHERE id = ? AND stockActual > 0';
      const [productos] = await connection.execute(productoQuery, [item.productoId]);
      
      if (productos.length === 0) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
      
      // Preparar valores para INSERT
      const valores = {
        prepedidoId: prepedidoId,
        productoId: item.productoId,
        descripcion: productos[0].nombre,
        cantidad: item.cantidad || 1,
        unidad: item.unidad || 'unidad',
        precioEstimado: item.precioEstimado || 0,
        observaciones: item.observaciones || null,
        ofertaid: item.ofertaid !== undefined && item.ofertaid !== null ? item.ofertaid : null
      };
      
      console.log('💾 VALORES PARA INSERT:', JSON.stringify(valores, null, 2));
      console.log('🎯 OFERTAID FINAL:', valores.ofertaid, 'Tipo:', typeof valores.ofertaid);
      
      const itemQuery = `
        INSERT INTO prepedidos_items 
        (prepedido_id, producto_id, descripcion, cantidad, unidad, precio_estimado, observaciones, ofertaid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      console.log('📝 QUERY SQL:', itemQuery);
      console.log('📝 PARÁMETROS:', [
        valores.prepedidoId,
        valores.productoId,
        valores.descripcion,
        valores.cantidad,
        valores.unidad,
        valores.precioEstimado,
        valores.observaciones,
        valores.ofertaid
      ]);
      
      const insertResult = await connection.execute(itemQuery, [
        valores.prepedidoId,
        valores.productoId,
        valores.descripcion,
        valores.cantidad,
        valores.unidad,
        valores.precioEstimado,
        valores.observaciones,
        valores.ofertaid
      ]);
      
      // 🔍 DIAGNÓSTICO COMPLETO del insertResult
      console.log('🔍 DIAGNÓSTICO insertResult completo:', JSON.stringify(insertResult, null, 2));
      console.log('🔍 insertResult.insertId:', insertResult.insertId);
      console.log('🔍 insertResult[0]:', insertResult[0]);
      console.log('🔍 Tipo de insertResult:', typeof insertResult);
      console.log('🔍 Es array insertResult:', Array.isArray(insertResult));
      
      // ✅ CORREGIR: Destructuring correcto para mysql2
      const insertId = insertResult.insertId;
      console.log('✅ Item insertado con ID:', insertId);
      
      // VERIFICACIÓN INMEDIATA: Leer el registro recién insertado (solo si insertId existe)
      if (insertId) {
        const verificacionQuery = 'SELECT * FROM prepedidos_items WHERE id = ?';
        const [registroInsertado] = await connection.execute(verificacionQuery, [insertId]);
        console.log('🔍 VERIFICACIÓN - Registro insertado:', JSON.stringify(registroInsertado[0], null, 2));
      } else {
        console.log('⚠️ ADVERTENCIA: insertId es undefined, no se puede verificar el registro');
      }
    }

    await connection.commit();
    console.log('🎉 === TRANSACCIÓN CREATE COMPLETADA ===');

    res.status(201).json({
      success: true,
      message: 'Pre-pedido creado exitosamente',
      prepedidoId: prepedidoId
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ ERROR EN createPrepedido:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Obtener pre-pedidos del usuario
const getPrepedidos = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { estado, limite = 10, pagina = 1 } = req.query;
    
    console.log('🔍 getPrepedidos - Parámetros recibidos:', { clienteId, estado, limite, pagina });
    
    let whereClause = 'WHERE pc.cliente_id = ?';
    let params = [clienteId];
    
    if (estado) {
      whereClause += ' AND pc.estado = ?';
      params.push(estado);
    }
    
    const offset = (pagina - 1) * limite;
    
    const query = `
      SELECT 
        pc.id,
        pc.observaciones,
        pc.estado,
        pc.fecha_creacion,
        c.nombre as cliente,
        COUNT(pi.id) as total_items,
        COALESCE(SUM(pi.precio_estimado * pi.cantidad), 0) as total_estimado
      FROM prepedidos_cabecera pc
      LEFT JOIN prepedidos_items pi ON pc.id = pi.prepedido_id
      LEFT JOIN clientes c ON pc.cliente_id = c.id
      ${whereClause}
      GROUP BY pc.id, c.nombre
      ORDER BY pc.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(parseInt(limite), parseInt(offset));
    
    console.log('🔍 getPrepedidos - Query SQL:', query);
    console.log('🔍 getPrepedidos - Parámetros SQL:', params);
    
    const prepedidos = await executeQuery(query, params);
    
    console.log('🔍 getPrepedidos - Resultado de la consulta:', prepedidos);
    console.log('🔍 getPrepedidos - Número de filas:', prepedidos.length);
    
    const responseData = {
      success: true,
      data: prepedidos,
      pagination: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: prepedidos.length
      }
    };
    
    console.log('🔍 getPrepedidos - Respuesta final:', JSON.stringify(responseData, null, 2));
    
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Error obteniendo pre-pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener pre-pedido específico
const getPrepedido = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteId = req.user.id;
    
    // Obtener cabecera
    const cabeceraQuery = `
      SELECT * FROM prepedidos_cabecera 
      WHERE id = ? AND cliente_id = ?
    `;
    
    const cabeceras = await executeQuery(cabeceraQuery, [id, clienteId]);
    
    if (cabeceras.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-pedido no encontrado'
      });
    }
    
    // Obtener items
    const itemsQuery = `
      SELECT 
        pi.id,
        pi.producto_id,
        pi.descripcion,
        pi.cantidad,
        pi.unidad,
        pi.precio_estimado,
        pi.observaciones,
        pi.ofertaid,
        p.nombre as producto_nombre,
        p.codigo as producto_codigo
      FROM prepedidos_items pi
      JOIN productos p ON pi.producto_id = p.id
      WHERE pi.prepedido_id = ?
    `;
    
    const items = await executeQuery(itemsQuery, [id]);
    
    // Calcular total estimado
    const totalEstimado = items.reduce((total, item) => {
      return total + (parseFloat(item.precio_estimado) * parseInt(item.cantidad));
    }, 0);
    
    const prepedido = {
      ...cabeceras[0],
      items,
      total_estimado: totalEstimado,
      total_items: items.length
    };
    
    res.json({
      success: true,
      data: prepedido
    });
    
  } catch (error) {
    console.error('Error obteniendo pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar pre-pedido (solo en estado borrador)
const updatePrepedido = async (req, res) => {
  const connection = await require('../config/database').pool.getConnection();
  
  try {
    const { id } = req.params;
    const { observaciones, items } = req.body;
    const clienteId = req.user.id;
    
    // 🔍 DEBUG: Log completo del payload recibido
    console.log('🚀🚀🚀 UPDATE PREPEDIDO - PAYLOAD RECIBIDO 🚀🚀🚀');
    console.log('📋 Prepedido ID:', id);
    console.log('👤 Cliente ID:', clienteId);
    console.log('📝 Observaciones:', observaciones);
    console.log('📦 Items recibidos:', JSON.stringify(items, null, 2));
    console.log('🎯 Items con ofertaid:', items.filter(item => item.ofertaid));
    
    await connection.beginTransaction();
    
    // Verificar que el pre-pedido existe y está en estado borrador
    const checkQuery = `
      SELECT estado FROM prepedidos_cabecera 
      WHERE id = ? AND cliente_id = ?
    `;
    
    const [prepedidos] = await connection.execute(checkQuery, [id, clienteId]);
    
    if (prepedidos.length === 0) {
      throw new Error('Pre-pedido no encontrado');
    }
    
    if (prepedidos[0].estado !== 'borrador') {
      throw new Error('Solo se pueden editar pre-pedidos en estado borrador');
    }
    
    // Actualizar cabecera
    const updateCabeceraQuery = `
      UPDATE prepedidos_cabecera 
      SET observaciones = ?
      WHERE id = ?
    `;
    
    await connection.execute(updateCabeceraQuery, [observaciones || '', id]);
    
    // Eliminar items existentes
    await connection.execute('DELETE FROM prepedidos_items WHERE prepedido_id = ?', [id]);
    
    // Insertar nuevos items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      console.log(`🔄 PROCESANDO ITEM ${i + 1}/${items.length}:`);
      console.log('📦 Item RAW del frontend:', JSON.stringify(item, null, 2));
      console.log('🎯 OFERTAID RAW:', item.ofertaid, 'Tipo:', typeof item.ofertaid);
      
      // Validar producto
      const productoQuery = 'SELECT id, nombre FROM productos WHERE id = ? AND stockActual > 0';
      const [productos] = await connection.execute(productoQuery, [item.productoId]);
      
      if (productos.length === 0) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
      
      // Preparar valores para INSERT
      const valores = {
        prepedidoId: id,
        productoId: item.productoId,
        descripcion: productos[0].nombre,
        cantidad: item.cantidad || 1,
        unidad: item.unidad || 'unidad',
        precioEstimado: item.precioEstimado || 0,
        observaciones: item.observaciones || null,
        ofertaid: item.ofertaid !== undefined && item.ofertaid !== null ? item.ofertaid : null
      };
      
      console.log('💾 VALORES PARA INSERT:', JSON.stringify(valores, null, 2));
      console.log('🎯 OFERTAID FINAL:', valores.ofertaid, 'Tipo:', typeof valores.ofertaid);
      
      const itemQuery = `
        INSERT INTO prepedidos_items 
        (prepedido_id, producto_id, descripcion, cantidad, unidad, precio_estimado, observaciones, ofertaid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      console.log('📝 QUERY SQL:', itemQuery);
      console.log('📝 PARÁMETROS:', [
        valores.prepedidoId,
        valores.productoId,
        valores.descripcion,
        valores.cantidad,
        valores.unidad,
        valores.precioEstimado,
        valores.observaciones,
        valores.ofertaid
      ]);
      
      const insertResult = await connection.execute(itemQuery, [
        valores.prepedidoId,
        valores.productoId,
        valores.descripcion,
        valores.cantidad,
        valores.unidad,
        valores.precioEstimado,
        valores.observaciones,
        valores.ofertaid
      ]);
      
      // 🔍 DIAGNÓSTICO: Estructura completa de insertResult
      console.log('🔍 DIAGNÓSTICO insertResult completo:', JSON.stringify(insertResult, null, 2));
      console.log('🔍 DIAGNÓSTICO insertResult[0]:', insertResult[0]);
      console.log('🔍 DIAGNÓSTICO insertResult[1]:', insertResult[1]);
      console.log('🔍 DIAGNÓSTICO insertResult.insertId:', insertResult.insertId);
      
      // ✅ CORREGIR: Acceso correcto al insertId según estructura mysql2
      const insertId = insertResult[0]?.insertId || insertResult.insertId;
      console.log('✅ Item insertado con ID:', insertId);
      
      // VERIFICACIÓN INMEDIATA: Leer el registro recién insertado (solo si insertId existe)
      if (insertId) {
        const verificacionQuery = 'SELECT * FROM prepedidos_items WHERE id = ?';
        const [registroInsertado] = await connection.execute(verificacionQuery, [insertId]);
        console.log('🔍 VERIFICACIÓN - Registro insertado:', JSON.stringify(registroInsertado[0], null, 2));
      } else {
        console.log('⚠️ ADVERTENCIA: insertId es undefined, no se puede verificar el registro');
      }
    }
    
    await connection.commit();
    console.log('🎉 === TRANSACCIÓN UPDATE COMPLETADA ===');
    
    res.json({
      success: true,
      message: 'Pre-pedido actualizado exitosamente'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error actualizando pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  } finally {
    connection.release();
  }
};

// Enviar pre-pedido (cambiar estado a enviado)
const enviarPrepedido = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteId = req.user.id;
    
    // Verificar que el pre-pedido existe y está en estado borrador
    const checkQuery = `
      SELECT estado FROM prepedidos_cabecera 
      WHERE id = ? AND cliente_id = ?
    `;
    
    const prepedidos = await executeQuery(checkQuery, [id, clienteId]);
    
    if (prepedidos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-pedido no encontrado'
      });
    }
    
    if (prepedidos[0].estado !== 'borrador') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden enviar pre-pedidos en estado borrador'
      });
    }
    
    // Actualizar estado
    const updateQuery = `
      UPDATE prepedidos_cabecera 
      SET estado = 'enviado'
      WHERE id = ?
    `;
    
    await executeQuery(updateQuery, [id]);
    
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

// Eliminar pre-pedido (solo en estado borrador)
const deletePrepedido = async (req, res) => {
  const connection = await require('../config/database').pool.getConnection();
  
  try {
    const { id } = req.params;
    const clienteId = req.user.id;
    
    await connection.beginTransaction();
    
    // Verificar que el pre-pedido existe y está en estado borrador
    const checkQuery = `
      SELECT estado FROM prepedidos_cabecera 
      WHERE id = ? AND cliente_id = ?
    `;
    
    const [prepedidos] = await connection.execute(checkQuery, [id, clienteId]);
    
    if (prepedidos.length === 0) {
      throw new Error('Pre-pedido no encontrado');
    }
    
    if (prepedidos[0].estado !== 'borrador') {
      throw new Error('Solo se pueden eliminar pre-pedidos en estado borrador');
    }
    
    // Eliminar items primero
    await connection.execute('DELETE FROM prepedidos_items WHERE prepedido_id = ?', [id]);
    
    // Eliminar cabecera
    await connection.execute('DELETE FROM prepedidos_cabecera WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Pre-pedido eliminado exitosamente'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error eliminando pre-pedido:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  } finally {
    connection.release();
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