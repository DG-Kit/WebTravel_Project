import { Router } from 'express';
import * as locationController from '../controllers/location.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', locationController.getLocations);
router.post('/', authenticate, authorize('ADMIN'), locationController.createLocation);
router.get('/:id', locationController.getLocation);
router.put('/:id', authenticate, authorize('ADMIN'), locationController.updateLocation);
router.delete('/:id', authenticate, authorize('ADMIN'), locationController.deleteLocation);

export default router;
