const { executeQuery } = require('../config/database');

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  console.log('=== INICIO getProfile ===');
  
  try {
    // Validar que req.user existe (debería venir del middleware de auth)
    if (!req.user) {
      console.error('❌ ERROR CRÍTICO: req.user es undefined en getProfile');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    const userId = req.user.id;
    
    console.log('🔍 getProfile called for user ID:', userId);
    console.log('🔍 req.user object completo:', req.user);
    
    // Validar que userId es válido
    if (!userId || typeof userId !== 'number') {
      console.error('❌ ERROR: userId inválido:', userId);
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    const query = `
      SELECT id, nombre, email, usuario, deuda, fechaUltimoPago, cuit, porcentaje1, porcentaje2, porcentaje3
      FROM clientes 
      WHERE id = ?
    `;
    
    console.log('🔍 Executing query:', query, 'with params:', [userId]);
    
    const users = await executeQuery(query, [userId]);
    
    console.log('🔍 Query results:', users);
    console.log('🔍 Number of users found:', users.length);
    
    if (users.length === 0) {
      console.error('❌ ERROR CRÍTICO: No user found with ID:', userId);
      console.error('❌ Esto indica un problema de sincronización entre token JWT y BD');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    console.log('🔍 User data from DB:', user);
    
    // Validar que el ID del usuario de la BD coincide con el del token
    if (user.id !== userId) {
      console.error('❌ ERROR CRÍTICO: ID mismatch en getProfile');
      console.error('❌ Token userId:', userId);
      console.error('❌ BD userId:', user.id);
      return res.status(500).json({
        success: false,
        message: 'Error de consistencia de datos'
      });
    }
    
    // Calcular días de deuda
    let diasDeuda = 0;
    if (user.fechaUltimoPago) {
      const fechaUltimoPago = new Date(user.fechaUltimoPago);
      const hoy = new Date();
      diasDeuda = Math.floor((hoy - fechaUltimoPago) / (1000 * 60 * 60 * 24));
    }
    
    const responseData = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      usuario: user.usuario,
      telefono: '', // Campo vacío ya que no existe en la tabla
      direccion: '', // Campo vacío ya que no existe en la tabla
      deuda: user.deuda || 0,
      diasDeuda,
      fechaUltimoPago: user.fechaUltimoPago,
      cuit: user.cuit || '',
      porcentaje1: user.porcentaje1 || 0,
      porcentaje2: user.porcentaje2 || 0,
      porcentaje3: user.porcentaje3 || 0
    };
    
    console.log('🔍 Response data being sent:', responseData);
    console.log('=== FIN getProfile - SUCCESS ===');
    
    // Devolver datos en el formato que espera el frontend (sin wrapper)
    res.json(responseData);
    
  } catch (error) {
    console.error('=== ERROR EN getProfile ===');
    console.error('❌ Error completo:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('=== FIN ERROR getProfile ===');
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar perfil del usuario
const updateProfile = async (req, res) => {
  console.log('=== INICIO updateProfile ===');
  
  try {
    // Validar que req.user existe
    if (!req.user) {
      console.error('❌ ERROR CRÍTICO: req.user es undefined en updateProfile');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    const userId = req.user.id;
    const { cuit, porcentaje1, porcentaje2, porcentaje3 } = req.body;
    
    console.log('🔍 updateProfile called for user ID:', userId);
    console.log('🔍 Data to update:', { cuit, porcentaje1, porcentaje2, porcentaje3 });
    
    // Validar que userId es válido
    if (!userId || typeof userId !== 'number') {
      console.error('❌ ERROR: userId inválido:', userId);
      return res.status(400).json({
        success: false,
        message: 'ID de usuario inválido'
      });
    }
    
    // Validar porcentajes
    const porcentajes = [porcentaje1, porcentaje2, porcentaje3];
    for (let i = 0; i < porcentajes.length; i++) {
      const porcentaje = porcentajes[i];
      if (porcentaje !== null && porcentaje !== undefined && porcentaje !== '') {
        const num = Number(porcentaje);
        if (isNaN(num) || num < 0 || num > 100) {
          return res.status(400).json({
            success: false,
            message: `Porcentaje ${i + 1} debe ser un número entre 0 y 100`
          });
        }
      }
    }
    
    // Construir query dinámicamente solo con campos que se van a actualizar
    const fieldsToUpdate = [];
    const values = [];
    
    if (cuit !== undefined) {
      fieldsToUpdate.push('cuit = ?');
      values.push(cuit || null);
    }
    
    if (porcentaje1 !== undefined) {
      fieldsToUpdate.push('porcentaje1 = ?');
      values.push(porcentaje1 === '' ? null : Number(porcentaje1));
    }
    
    if (porcentaje2 !== undefined) {
      fieldsToUpdate.push('porcentaje2 = ?');
      values.push(porcentaje2 === '' ? null : Number(porcentaje2));
    }
    
    if (porcentaje3 !== undefined) {
      fieldsToUpdate.push('porcentaje3 = ?');
      values.push(porcentaje3 === '' ? null : Number(porcentaje3));
    }
    
    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }
    
    values.push(userId); // Para el WHERE
    
    const query = `
      UPDATE clientes 
      SET ${fieldsToUpdate.join(', ')}
      WHERE id = ?
    `;
    
    console.log('🔍 Executing update query:', query);
    console.log('🔍 With values:', values);
    
    const result = await executeQuery(query, values);
    
    console.log('🔍 Update result:', result);
    
    if (result.affectedRows === 0) {
      console.error('❌ ERROR: No se actualizó ningún registro');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    console.log('=== FIN updateProfile - SUCCESS ===');
    
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });
    
  } catch (error) {
    console.error('=== ERROR EN updateProfile ===');
    console.error('❌ Error completo:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('=== FIN ERROR updateProfile ===');
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener deuda del usuario
const getDebt = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 getDebt called for user ID:', userId);
    
    const query = `
      SELECT deuda, fechaUltimoPago
      FROM clientes 
      WHERE id = ?
    `;
    
    const users = await executeQuery(query, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    // Calcular días de deuda
    let diasDeuda = 0;
    if (user.fechaUltimoPago) {
      const fechaUltimoPago = new Date(user.fechaUltimoPago);
      const hoy = new Date();
      diasDeuda = Math.floor((hoy - fechaUltimoPago) / (1000 * 60 * 60 * 24));
    }
    
    res.json({
      success: true,
      data: {
        deuda: user.deuda || 0,
        diasDeuda,
        fechaUltimoPago: user.fechaUltimoPago
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo deuda:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDebt
};