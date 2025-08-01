const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Login de usuario
const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    console.log('🔍 Login attempt:', { usuario, password }); // Log de debugging
    
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }
    
    // Buscar usuario en tabla clientes por campo 'usuario' - Fixed query
    const query = `
      SELECT id, nombre, email, usuario, pwd, deuda, fechaUltimoPago
      FROM clientes 
      WHERE usuario = ?
    `;
    
    console.log('🔍 Executing query:', query, 'with params:', [usuario]); // Log de debugging
    
    const users = await executeQuery(query, [usuario]);
    
    console.log('🔍 Query results:', users); // Log de debugging
    console.log('🔍 Number of users found:', users.length); // Log de debugging
    
    if (users.length === 0) {
      console.log('❌ No user found with usuario:', usuario); // Log de debugging
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas - Usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    console.log('🔍 User found:', {
      id: user.id,
      usuario: user.usuario,
      pwd: user.pwd,
      pwd_length: user.pwd ? user.pwd.length : 'null'
    }); // Log de debugging
    
    // Verificar contraseña directa (sin bcrypt si pwd está en texto plano)
    const isValidPassword = password === user.pwd;
    
    console.log('🔍 Password validation:', {
      provided: password,
      provided_length: password.length,
      stored: user.pwd,
      stored_length: user.pwd ? user.pwd.length : 'null',
      match: isValidPassword
    }); // Log de debugging
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', usuario); // Log de debugging
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas - Contraseña incorrecta'
      });
    }
    
    console.log('✅ Login successful for user:', usuario); // Log de debugging
    
    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        usuario: user.usuario,
        nombre: user.nombre
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    console.log('🔍 Generated JWT token:', token); // Nuevo log
    console.log('🔍 Token type:', typeof token); // Nuevo log
    console.log('🔍 Token length:', token ? token.length : 'N/A'); // Nuevo log
    
    // Calcular días de deuda usando fechaUltimoPago
    let diasDeuda = 0;
    if (user.fechaUltimoPago) {
      const fechaUltimoPago = new Date(user.fechaUltimoPago);
      const hoy = new Date();
      diasDeuda = Math.floor((hoy - fechaUltimoPago) / (1000 * 60 * 60 * 24));
    }
    
    const responseData = {
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          usuario: user.usuario,
          email: user.email,
          saldo: user.deuda || 0,
          diasDeuda,
          fechaUltimoPago: user.fechaUltimoPago
        }
      }
    };
    
    console.log('🔍 Sending response:', JSON.stringify(responseData, null, 2)); // Nuevo log
    
    res.json(responseData);
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Obtener contraseña actual
    const query = 'SELECT password FROM clientes WHERE id = ?';
    const users = await executeQuery(query, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    const updateQuery = 'UPDATE clientes SET password = ? WHERE id = ?';
    await executeQuery(updateQuery, [hashedPassword, userId]);
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  login,
  changePassword
};