const express = require('express');
const { getVideoEncodeChannelMain, setVideoEncodeChannelMain, getVideoEncodeChannelSub, setVideoEncodeChannelSub, getVideoSettings, setVideoSettings, getNetworkInterfaceSettings, netInfo, getImageInfo, setImageInfo, OSDController, getDeviceInfo, getTimesettings, setTimesettings, getOTA, setOTA, addUser, deleteUser, setConfig62, get_VideoSettings, set_VideoSettings } = require('../controllers/settingsController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
// const { connectedClients } = require('../services/mqttHelper');

const router = express.Router();
// DATABASE INVOLVED
// video 101
router.get('/video-encode-channel-main',  getVideoEncodeChannelMain);
router.post('/video-encode-channel-main',  setVideoEncodeChannelMain);

// video 102
router.get('/video-encode-channel-sub',  getVideoEncodeChannelSub);
router.post('/video-encode-channel-sub',  setVideoEncodeChannelSub);

// video 1
router.get('/video-settings',  getVideoSettings);
router.post('/video-settings',  setVideoSettings);

// network
router.get('/network-interface-settings',  getNetworkInterfaceSettings);
router.get('/network-info',  netInfo);

// image
router.get('/image-info',  getImageInfo);
router.post('/image-info',  setImageInfo);
router.post('/osd-controller',  OSDController);

// camera info
router.get('/device-info',  getDeviceInfo);

// time settings
router.get('/time-settings',  getTimesettings);
router.post('/time-settings',  setTimesettings);

// DATABASE NOT  INVOLVED

router.get('/getota',  getOTA);
router.get('/setota',  setOTA);

router.post('/adduser',  addUser);
router.post('/deleteuser',  deleteUser);
router.post('/setconfig62',  setConfig62);
// router.get('/connected-clients', (req, res) => {
//     res.json({ connectedClients });
// });

router.get('/videoSettings',  get_VideoSettings);
router.post('/videoSettings',  set_VideoSettings);


module.exports = router;