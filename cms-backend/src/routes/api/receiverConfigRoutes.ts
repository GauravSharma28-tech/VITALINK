import router from './authRoutes';
const receiverConfigController = require('../../controller/receiverConfigController');

router.get('/', receiverConfigController.get);
router.post('/new-config', receiverConfigController.new);

export { router as receiverConfigRouter };
