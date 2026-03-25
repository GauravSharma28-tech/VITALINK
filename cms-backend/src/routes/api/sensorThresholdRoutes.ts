import { Router } from 'express';
const sensorThresholdController = require('../../controller/sensorThresholdController');
import exp = require('constants');
const router = Router();

router.get('/', sensorThresholdController.get);
router.put('/update', sensorThresholdController.update);

export { router as sensorThresholdRouter };
