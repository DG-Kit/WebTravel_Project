import { Router } from 'express';
import * as locationController from '../controllers/location.controller';

const router = Router();

router.get('/', locationController.getLocations);
router.post('/', locationController.createLocation);
router.get('/:id', locationController.getLocation);
router.put('/:id', locationController.updateLocation);
router.delete('/:id', locationController.deleteLocation);

export default router;
