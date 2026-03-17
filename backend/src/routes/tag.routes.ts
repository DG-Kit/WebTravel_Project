import { Router } from 'express';
import * as tagController from '../controllers/tag.controller';

const router = Router();

router.get('/', tagController.getTags);
router.post('/', tagController.createTag);
router.get('/:id', tagController.getTag);
router.put('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

export default router;
