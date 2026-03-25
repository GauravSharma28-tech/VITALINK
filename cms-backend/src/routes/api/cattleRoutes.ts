import express, { Request, Response } from 'express';
import Cattle from '../../model/cattle';
import { cattleInterface, cattleInterface1 } from '../../types/cattleInterface';
import sensorData from '../../model/sensorData';
import { getSocketIOInstance } from '../../socket';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const cattle = await Cattle.find();
    res.status(200).json(cattle);
  } catch (error: any) {
    console.error('Error fetching cattle:', error);
    res
      .status(500)
      .json({ message: 'Error fetching cattle data', error: error.message });
  }
});

router.get('/:cattleId', async (req: any, res: any) => {
  try {
    const cattle = await Cattle.findOne({ cattleId: req.params.cattleId });
    if (!cattle) {
      return res.status(404).json({ message: 'Cattle not found' });
    }
    res.status(200).json(cattle);
  } catch (error: any) {
    console.error('Error fetching cattle:', error);
    res
      .status(500)
      .json({ message: 'Error fetching cattle data', error: error.message });
  }
});

router.post('/', async (req: any, res: any) => {
  const { cattleId, deviceId }: cattleInterface1 = req.body;

  if (!cattleId) {
    return res.status(400).json({ message: 'Missing required field' });
  }

  try {
    const existingCattle = await Cattle.findOne({ cattleId });
    if (existingCattle) {
      return res
        .status(400)
        .json({ message: 'Cattle with this cattle ID already exists' });
    }

    const existingDevice = await Cattle.findOne({ deviceId });
    if (existingDevice) {
      return res
        .status(400)
        .json({ message: 'The device is already connected with a cattle' });
    }

    const newCattle = new Cattle({ cattleId, deviceId });
    await newCattle.save();
    // Notify all connected clients that the cattle list has changed
    const io = getSocketIOInstance();
    if (io) {
      io.emit('cattle_list_updated', { action: 'added', cattle: newCattle });
    }

    res
      .status(201)
      .json({ message: 'Cattle added successfully', cattle: newCattle });
  } catch (error: any) {
    console.error('Error creating cattle:', error);
    res
      .status(500)
      .json({ message: 'Error creating cattle', error: error.message });
  }
});

router.put('/:tagId', async (req: any, res: any) => {
  try {
    const { tagId, name }: cattleInterface = req.body;

    if (!tagId || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingCattle = await Cattle.findOne({ tagId: req.params.tagId });
    if (!existingCattle) {
      return res.status(404).json({ message: 'Cattle not found' });
    }

    const updatedCattle = await Cattle.findOneAndUpdate(
      { tagId: req.params.tagId }, // Find by tagId
      { tagId, name }, // Update values
      { new: true, runValidators: true }
    );

    res
      .status(200)
      .json({ message: 'Cattle updated successfully', cattle: updatedCattle });
  } catch (error: any) {
    console.error('Error updating cattle:', error);
    res
      .status(500)
      .json({ message: 'Error updating cattle', error: error.message });
  }
});

router.delete('/:cattleId', async (req: any, res: any) => {
  try {
    const deletedCattle = await Cattle.findOneAndDelete({
      cattleId: req.params.cattleId,
    });
    if (!deletedCattle) {
      return res.status(404).json({ message: 'Cattle not found' });
    }
    const deletedSensorData = await sensorData.deleteMany({
      deviceId: deletedCattle.deviceId,
    });
    if (deletedSensorData.deletedCount === 0) {
      return res.status(404).json({ message: 'Sensor data not found' });
    }
    console.log('Sensor data deleted:', deletedSensorData.deletedCount);

    // Notify all connected clients that the cattle list has changed
    const io = getSocketIOInstance();
    if (io) {
      io.emit('cattle_list_updated', { action: 'deleted', cattleId: req.params.cattleId });
    }

    res.status(200).json({ message: 'Cattle deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cattle:', error);
    res
      .status(500)
      .json({ message: 'Error deleting cattle', error: error.message });
  }
});

export { router as cattleRouter };
