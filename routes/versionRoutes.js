const express = require('express');
const multer = require('multer');
const { getAllEmsReleases, getAllFirmwareReleases, getAllVmsReleases, createOrUpdateEmsRelease, createOrUpdateFirmwareRelease, createOrUpdateVmsRelease, downloadVersionReleaseFile, createBaseFirmware, getAllFirmware, downloadFirmwareById, getAllAppVersion, createAppVersion, downloadAppById } = require('../controllers/versionController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const { uploadVersionReleaseFiles, uploadFirmwareFiles, uploadApplicationFiles } = require('../middleware/uploadFile');
// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
// Configure Multer for file uploads
const upload = multer({ storage });
const router = express.Router();

// Route to get all EMS releases
router.get('/ems-releases', isAuthenticatedUser, getAllEmsReleases);
// Route to get all firmware releases
router.get('/firmware-releases', isAuthenticatedUser, getAllFirmwareReleases);
// Route to get all VMS releases
router.get('/vms-releases', isAuthenticatedUser, getAllVmsReleases);
// Route to create or update EMS release
router.post('/create-or-update-ems-release', isAuthenticatedUser, createOrUpdateEmsRelease);
// Route to create or update firmware release
router.post('/create-or-update-firmware-release/:versionNo', isAuthenticatedUser, uploadVersionReleaseFiles.single('file'), createOrUpdateFirmwareRelease);
// version release API of KITTY(KT)
router.get("/versionRelease/:versionNo/:filename", downloadVersionReleaseFile);
// Route to create or update VMS release
router.post('/create-or-update-vms-release', isAuthenticatedUser, createOrUpdateVmsRelease);

// Base-Firmware-Release
router.get('/firmware/getAllFirmware', getAllFirmware)
// route for creating Base-Firmware version
router.post('/firmware/:cameraName/:versionName', uploadFirmwareFiles, createBaseFirmware);
// Download API
router.get('/firmware/download/:id', downloadFirmwareById);

// App-version release
router.get('/app/getAllApps', getAllAppVersion);
router.post('/app/:appName/:versionName', uploadApplicationFiles, createAppVersion);
router.get('/app/download/:id', downloadAppById);

// EXE API
// router.post('/upload/application/:appName', uploadApplicationFiles.single('exeFile'));

module.exports = router;