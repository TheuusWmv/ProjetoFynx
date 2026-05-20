import { Router } from 'express';
import { authenticateWhatsappService } from './whatsapp-auth.middleware.js';
import { WhatsappIntegrationController } from './whatsapp-integration.controller.js';

const router = Router();

router.use(authenticateWhatsappService);

router.post('/resolve', WhatsappIntegrationController.resolve);
router.post('/actions/dashboard', WhatsappIntegrationController.dashboard);
router.post('/actions/ranking', WhatsappIntegrationController.ranking);
router.post('/actions/transactions/create', WhatsappIntegrationController.createTransaction);
router.post('/actions/transactions/search', WhatsappIntegrationController.searchTransactions);
router.post('/actions/goals', WhatsappIntegrationController.goals);
router.post('/actions/goals/create', WhatsappIntegrationController.createGoal);
router.post('/actions/budgets', WhatsappIntegrationController.budgets);
router.post('/actions/budgets/create', WhatsappIntegrationController.createBudget);
router.post('/actions/categories', WhatsappIntegrationController.categories);

export default router;
