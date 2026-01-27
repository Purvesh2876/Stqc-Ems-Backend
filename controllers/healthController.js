const health = require('../models/cameraHealth');


// get all health data
exports.getHealth = async (req, res) => {
    try {
        const deviceId = req.query.deviceId;

        const healthData = await health.findOne({ deviceId: deviceId });

        if (!healthData || healthData.length === 0) {
            return res.status(404).json({
                message: 'Health data not found'
            });
        }

        // Process each health record to get the last 15 entries for each array
        const processedData = {
            deviceId: healthData.deviceId,
            hourlyTemperature_C: healthData.hourlyTemperature_C.slice(-24),
            hourlySD_Card: healthData.hourlySD_Card.slice(-24),
            hourlyCPU: healthData.hourlyCPU.slice(-24),
            hourlyp2pStatus: healthData.hourlyp2pStatus.slice(-24),
            outBandWidthAvg: healthData.outBandWidthAvg.slice(-24),
            signalAvg: healthData.signalAvg.slice(-24)
        };

        return res.status(200).json({
            success: true,
            data: processedData
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
