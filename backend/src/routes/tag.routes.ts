import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', tagController.getTags);
router.post('/', authenticate, authorize('ADMIN'), tagController.createTag);
router.get('/:id', tagController.getTag);
router.put('/:id', authenticate, authorize('ADMIN'), tagController.updateTag);
router.delete('/:id', authenticate, authorize('ADMIN'), tagController.deleteTag);

export default router;
