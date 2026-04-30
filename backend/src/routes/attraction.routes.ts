import { Router } from 'express';
import * as attractionController from '../controllers/attraction.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', attractionController.getAttractions);
router.post('/', authenticate, authorize('ADMIN'), attractionController.createAttraction);
router.get('/:id', attractionController.getAttraction);
router.put('/:id', authenticate, authorize('ADMIN'), attractionController.updateAttraction);
router.delete('/:id', authenticate, authorize('ADMIN'), attractionController.deleteAttraction);

export default router;
