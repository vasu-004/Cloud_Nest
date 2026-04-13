const express = require('express');
const router = express.Router();
const { getMembers, updateMemberRole, deleteMember } = require('../controllers/memberController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMembers)
  .post(authorizeRoles('admin'), require('../controllers/memberController').createMember);

router.route('/:id')
  .patch(authorizeRoles('admin'), updateMemberRole)
  .delete(authorizeRoles('admin'), deleteMember);

module.exports = router;
