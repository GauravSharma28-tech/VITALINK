import { ConfigurationsModel } from '../model/receiverConfig';

module.exports.get = async (req: any, res: any) => {
  try {
    const configs = await ConfigurationsModel.find();
    res.status(200).json(configs);
  } catch (error: any) {
    res.status(500).json({
      message: 'Error in fetching geo-fence data',
      error: error.message,
    });
  }
};

module.exports.new = async (req: any, res: any) => {
  const { zoneName, zoneId, receiverId } = req.body;
  try {
    const newConfig = new ConfigurationsModel({ zoneName, zoneId, receiverId });
    await newConfig.save();
    res.status(201).json({ message: 'Configuration created successfully' });
  } catch (error: any) {
    res
      .status(500)
      .json({
        message: 'Error in adding new configuration: ',
        error: error.message,
      });
  }
};
