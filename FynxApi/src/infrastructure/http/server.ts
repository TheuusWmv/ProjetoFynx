import { app } from './app.js';
import { logger } from '../../shared/utils/logger.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    try {
        logger.info(`⚡️ Servidor FYNX rodando na porta ${PORT}`);
        logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 URL: http://localhost:${PORT}`);
        logger.info(`📊 API Base: http://localhost:${PORT}/api/v1`);
    } catch (error) {
        logger.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
});