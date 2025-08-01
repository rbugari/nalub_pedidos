const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de acceso requerido' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar que el usuario aún existe en la base de datos
    const query = 'SELECT id, nombre, email FROM clientes WHERE id = ?'; // Removido: AND activo = 1
    const users = await executeQuery(query, [decoded.userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no válido' 
      });
    }

    req.user = {
      id: decoded.userId,
      nombre: users[0].nombre,
      email: users[0].email
    };
    
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

module.exports = {
  authenticateToken
};