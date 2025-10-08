import 'dotenv/config'; // Carrega as variáveis do .env
console.log('[SERVER] Starting server...');
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares Essenciais
app.use(cors());
app.use(express.json()); // Habilita o Express a ler JSON no corpo das requisições

// Importar e usar as Rotas (Será configurado no próximo passo)
console.log('[SERVER] Loading routes...');
import routes from './routes/index.js';
app.use('/api/v1', routes);

// Rota de teste simples
app.get('/', (req, res) => {
    res.status(200).json({ message: 'BACKEND do FYNX está funcionando!' });
});


app.listen(PORT, () => {
    try {
        console.log(`[SERVER] ⚡️ Servidor rodando na porta ${PORT}`);
        console.log(`[SERVER] Ambiente: ${process.env.NODE_ENV}`);
    } catch (error) {
        console.error('[SERVER] Error starting server:', error);
    }
});