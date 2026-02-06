const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');
const prisma = require('../lib/prisma');

// Login de usuario con Prisma ORM
const login = async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }
    
    // Usar Prisma en lugar de executeQuery
    const user = await prisma.clientes.findFirst({
      where: { usuario },
      select: {
        id: true,
        nombre: true,
        usuario: true,
        email: true,
        pwd: true,
        deuda: true,
        fechaUltimoPago: true
      }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas - Usuario no encontrado'
      });
    }
    
    // Comparación directa de contraseñas (sin bcrypt)
    if (password !== user.pwd) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas - Contraseña incorrecta'
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
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

// Cambiar contraseña con Prisma ORM
const changePassword = async (req, res) => {
  console.log('=== INICIO changePassword ===');
  console.log('req.body:', req.body);
  console.log('req.user:', req.user);
  
  try {
    const { currentPassword, newPassword } = req.body;
    console.log('Parámetros extraídos - currentPassword:', currentPassword ? '[PRESENTE]' : '[AUSENTE]', 'newPassword:', newPassword ? '[PRESENTE]' : '[AUSENTE]');
    
    // Verificar que req.user existe y tiene id
    if (!req.user) {
      console.error('❌ ERROR CRÍTICO: req.user es undefined en changePassword');
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }
    
    const userId = req.user.id;
    console.log('userId extraído:', userId);
    
    // Validación robusta del userId
    if (!userId || typeof userId !== 'number' || userId <= 0) {
      console.error('❌ ERROR CRÍTICO: userId inválido en changePassword:', userId);
      console.error('❌ Tipo de userId:', typeof userId);
      return res.status(401).json({
        success: false,
        message: 'ID de usuario no válido'
      });
    }
    
    if (!currentPassword || !newPassword) {
      console.log('ERROR: Faltan parámetros requeridos');
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }
    
    if (newPassword.length < 6) {
      console.log('ERROR: Nueva contraseña muy corta');
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // Usar Prisma para obtener contraseña actual
    console.log('Buscando usuario con Prisma...');
    const user = await prisma.clientes.findUnique({
      where: { id: userId },
      select: { pwd: true }
    });
    
    console.log('Resultado Prisma:', user ? 'Usuario encontrado' : 'Usuario no encontrado');
    
    if (!user) {
      console.error('❌ ERROR CRÍTICO: Usuario no encontrado en BD para changePassword');
      console.error('❌ userId buscado:', userId);
      console.error('❌ Esto indica un problema de sincronización entre token JWT y BD');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    console.log('Usuario encontrado, pwd en BD:', user.pwd ? '[PRESENTE]' : '[AUSENTE]');
    
    // Verificar contraseña actual (comparación directa, sin bcrypt para mantener consistencia con login)
    if (currentPassword !== user.pwd) {
      console.log('ERROR: Contraseña actual incorrecta');
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    console.log('Contraseña actual verificada correctamente');
    
    // Actualizar contraseña con Prisma
    console.log('Actualizando contraseña con Prisma...');
    await prisma.clientes.update({
      where: { id: userId },
      data: { pwd: newPassword }
    });
    
    console.log('Contraseña actualizada exitosamente');
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('=== ERROR EN changePassword ===');
    console.error('Error completo:', error);
    console.error('Stack trace:', error.stack);
    console.error('Mensaje:', error.message);
    console.error('=== FIN ERROR ===');
    
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