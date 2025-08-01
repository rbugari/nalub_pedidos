const { executeQuery } = require('../config/database');

// Obtener perfil del usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('🔍 getProfile called for user ID:', userId);
    console.log('🔍 req.user object:', req.user);
    
    const query = `
      SELECT id, nombre, email, usuario, deuda, fechaUltimoPago
      FROM clientes 
      WHERE id = ?
    `;
    
    console.log('🔍 Executing query:', query, 'with params:', [userId]);
    
    const users = await executeQuery(query, [userId]);
    
    console.log('🔍 Query results:', users);
    console.log('🔍 Number of users found:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No user found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    console.log('🔍 User data from DB:', user);
    
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
      fechaUltimoPago: user.fechaUltimoPago
    };
    
    console.log('🔍 Response data being sent:', responseData);
    
    // Devolver datos en el formato que espera el frontend (sin wrapper)
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
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
  getDebt
};