const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  console.log('=== INICIO AUTH MIDDLEWARE ===');
  console.log('🔍 AUTH DEBUG - URL:', req.originalUrl);
  console.log('🔍 AUTH DEBUG - Method:', req.method);
  console.log('🔍 AUTH DEBUG - Headers:', req.headers.authorization);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔍 AUTH DEBUG - Token extraído:', token ? 'Token presente' : 'Token ausente');
  
  if (token) {
    console.log('🔍 AUTH DEBUG - Token (primeros 50 chars):', token.substring(0, 50) + '...');
  }

  if (!token) {
    console.log('🔍 AUTH DEBUG - No token provided');
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 AUTH DEBUG - Token decodificado exitosamente:', decoded);
    console.log('🔍 AUTH DEBUG - userId del token:', decoded.userId);
    
    // Validar que userId existe y es válido
    if (!decoded.userId || typeof decoded.userId !== 'number') {
      console.error('🔍 AUTH DEBUG - ERROR: userId inválido en token:', decoded.userId);
      return res.status(401).json({ 
        success: false, 
        message: 'Token contiene userId inválido' 
      });
    }
    
    // Verificar que el usuario aún existe en la base de datos
    console.log('🔍 AUTH DEBUG - Consultando BD para userId:', decoded.userId);
    const query = 'SELECT id, nombre, email FROM clientes WHERE id = ?';
    const users = await executeQuery(query, [decoded.userId]);
    
    console.log('🔍 AUTH DEBUG - Query ejecutada:', query);
    console.log('🔍 AUTH DEBUG - Parámetros:', [decoded.userId]);
    console.log('🔍 AUTH DEBUG - Usuarios encontrados:', users.length);
    
    if (users.length > 0) {
      console.log('🔍 AUTH DEBUG - Usuario encontrado en BD:', {
        id: users[0].id,
        nombre: users[0].nombre,
        email: users[0].email
      });
    }
    
    if (users.length === 0) {
      console.error('🔍 AUTH DEBUG - ERROR CRÍTICO: Usuario no existe en BD');
      console.error('🔍 AUTH DEBUG - Token userId:', decoded.userId);
      console.error('🔍 AUTH DEBUG - Este token debe ser invalidado');
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no válido - token expirado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Validar que el ID del usuario coincide
    if (users[0].id !== decoded.userId) {
      console.error('🔍 AUTH DEBUG - ERROR: ID mismatch');
      console.error('🔍 AUTH DEBUG - Token userId:', decoded.userId);
      console.error('🔍 AUTH DEBUG - BD userId:', users[0].id);
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido - ID mismatch' 
      });
    }

    req.user = {
      id: decoded.userId,
      nombre: users[0].nombre,
      email: users[0].email
    };
    
    console.log('🔍 AUTH DEBUG - req.user establecido correctamente:', req.user);
    console.log('=== FIN AUTH MIDDLEWARE - SUCCESS ===');
    
    next();
  } catch (error) {
    console.error('=== ERROR EN AUTH MIDDLEWARE ===');
    console.error('🔍 AUTH DEBUG - Error completo:', error);
    console.error('🔍 AUTH DEBUG - Error message:', error.message);
    console.error('🔍 AUTH DEBUG - Error name:', error.name);
    
    if (error.name === 'TokenExpiredError') {
      console.error('🔍 AUTH DEBUG - Token expirado');
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      console.error('🔍 AUTH DEBUG - Token malformado');
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido',
        code: 'TOKEN_INVALID'
      });
    }
    
    console.error('🔍 AUTH DEBUG - Error desconocido en autenticación');
    return res.status(403).json({ 
      success: false, 
      message: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = {
  authenticateToken
};