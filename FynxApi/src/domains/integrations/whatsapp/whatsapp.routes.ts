import { Router } from 'express';
import { WhatsappController } from './whatsapp.controller.js';

const router = Router();

router.get('/accounts', WhatsappController.listAccounts);
router.post('/accounts/request-verification', WhatsappController.requestVerification);
router.post('/accounts/confirm-verification', WhatsappController.confirmVerification);
router.delete('/accounts/:accountId', WhatsappController.revokeAccount);

export default router;
