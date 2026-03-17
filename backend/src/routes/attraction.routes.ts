import { Router } from 'express';
import * as attractionController from '../controllers/attraction.controller';

const router = Router();

router.get('/', attractionController.getAttractions);
router.post('/', attractionController.createAttraction);
router.get('/:id', attractionController.getAttraction);
router.put('/:id', attractionController.updateAttraction);
router.delete('/:id', attractionController.deleteAttraction);

export default router;
