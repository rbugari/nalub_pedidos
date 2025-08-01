const { executeQuery } = require('../config/database');

// Get dashboard data for authenticated user - VERSION SIMPLIFICADA
const getDashboardData = async (req, res) => {
    try {
        console.log('🔍 Dashboard endpoint called for user:', req.user?.id);
        
        // Respuesta simple para probar
        res.json({
            message: 'Dashboard endpoint working',
            user_id: req.user?.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Get featured offers for dashboard - VERSION SIMPLIFICADA
const getOfertasDestacadas = async (req, res) => {
    try {
        console.log('🔍 Ofertas destacadas endpoint called');
        
        // Respuesta simple para probar
        res.json({
            message: 'Ofertas destacadas endpoint working',
            ofertas: [],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting featured offers:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    getDashboardData,
    getOfertasDestacadas
};