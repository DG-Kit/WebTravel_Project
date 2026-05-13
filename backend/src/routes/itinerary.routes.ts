import { Router } from 'express';
import { saveItinerary, getMyItineraries, deleteItinerary } from '../controllers/itinerary.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/save', saveItinerary);
router.get('/my', getMyItineraries);
router.delete('/:id', deleteItinerary);

export default router;
