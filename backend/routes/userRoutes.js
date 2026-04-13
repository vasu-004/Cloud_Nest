const express = require('express');
const router = express.Router();
const { getMe, updateProfile, setup2FA, verify2FA } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/me', getMe);
router.patch('/profile', updateProfile);
router.post('/2fa/setup', setup2FA);
router.post('/2fa/verify', verify2FA);

module.exports = router;
