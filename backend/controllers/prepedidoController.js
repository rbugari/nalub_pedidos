const { executeQuery } = require('../config/database');

// Crear nuevo pre-pedido
const createPrepedido = async (req, res) => {
  const connection = await require('../config/database').pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { observaciones, items } = req.body;
    const clienteId = req.user.id;
    
    // Insertar cabecera del pre-pedido
    const cabeceraQuery = `
      INSERT INTO prepedidos_cabecera 
      (cliente_id, observaciones, estado, fecha_creacion) 
      VALUES (?, ?, 'borrador', NOW())
    `;
    
    const [cabeceraResult] = await connection.execute(cabeceraQuery, [
      clienteId, 
      observaciones || ''
    ]);
    
    const prepedidoId = cabeceraResult.insertId;
    
    // Insertar items del pre-pedido
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Validar que el producto existe
      const productoQuery = 'SELECT id, nombre FROM productos WHERE id = ?';
      const [productos] = await connection.execute(productoQuery, [item.productoId]);
      
      if (productos.length === 0) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
      
      const itemQuery = `
        INSERT INTO prepedidos_items 
        (prepedido_id, producto_id, descripcion, cantidad, unidad, precio_estimado, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(itemQuery, [
        prepedidoId,
        item.productoId,
        productos[0].nombre,
        item.cantidad || 1,
        item.unidad || 'unidad',
        item.precioEstimado || 0,
        item.observaciones || null
      ]);
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Pre-pedido creado exitosamente',
      data: {
        prepedidoId,
        estado: 'borrador'
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creando pre-pedido:', error);
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
      
      // Validar producto
      const productoQuery = 'SELECT id, nombre FROM productos WHERE id = ?';
      const [productos] = await connection.execute(productoQuery, [item.productoId]);
      
      if (productos.length === 0) {
        throw new Error(`Producto con ID ${item.productoId} no encontrado`);
      }
      
      const itemQuery = `
        INSERT INTO prepedidos_items 
        (prepedido_id, producto_id, descripcion, cantidad, unidad, precio_estimado, observaciones)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      await connection.execute(itemQuery, [
        id,
        item.productoId,
        productos[0].nombre,
        item.cantidad || 1,
        item.unidad || 'unidad',
        item.precioEstimado || 0,
        item.observaciones || null
      ]);
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Pre-pedido actualizado exitosamente'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error actualizando pre-pedido:', error);
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