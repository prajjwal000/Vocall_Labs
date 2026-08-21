const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/authMiddleware');
const storageController = require('../controllers/storage.controller');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const router = express.Router();

router.use(authenticate);
router.post('/upload', upload.single('file'), storageController.uploadFile);
router.post('/test', storageController.testStorageConnection);

module.exports = router;
