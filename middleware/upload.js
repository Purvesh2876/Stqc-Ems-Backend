const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload.fields([
    { name: 'cert', maxCount: 1 },
    { name: 'key', maxCount: 1 }
]);
