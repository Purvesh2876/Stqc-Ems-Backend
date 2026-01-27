const axios = require('axios');
const releaseVmsModel = require('../models/releseVms');
const releaseFirmwareModel = require('../models/releseFirmware');
const BaseFirmwareVersion = require('../models/releaseBaseFirmware');
const AppVersion = require('../models/releaseApplicationModel');
const releaseEmsModel = require('../models/releseEms');
const path = require("path");
const fs = require('fs');
const FormData = require('form-data');
const mime = require("mime-types");
const { BASE_PDFS_DIR } = require("../middleware/uploadFile");
const archiver = require("archiver");
const nodemailer = require("nodemailer");

// Function to create or update VMS release
exports.createOrUpdateVmsRelease = async (req, res) => {
    try {
        const { versionNo, versionName, updates } = req.body;

        if (!versionNo || !versionName) {
            return res.status(400).json({ message: 'Version number, name, and release date are required.' });
        }

        const releaseData = {
            versionNo,
            versionName,
            releaseDate: new Date().toISOString(),
            updates: updates || []
        };

        const existingRelease = await releaseVmsModel.findOne({ versionNo });

        if (existingRelease) {
            // Update existing release
            await releaseVmsModel.updateOne({ versionNo }, releaseData);
            return res.status(200).json({ message: 'VMS release updated successfully.' });
        } else {
            // Create new release
            const newRelease = new releaseVmsModel(releaseData);
            await newRelease.save();
            return res.status(201).json({ message: 'VMS release created successfully.' });
        }
    } catch (error) {
        console.error('Error creating or updating VMS release:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

exports.createOrUpdateFirmwareRelease = async (req, res) => {
    try {
        const { productType, versionNo, versionName, updates, ltsVersion } = req.body;
        console.log('lalalu', req.body);
        const file = req.file; // multer handles upload for us

        if (!versionNo || !versionName || !file || !productType) {
            return res.status(400).json({
                message: 'Version number, name, file, and product type are required.'
            });
        }

        // Prepare release data
        const releaseData = {
            productType,
            versionNo,
            versionName,
            releaseDate: new Date().toISOString(),
            updates: updates || [],
            ltsVersion: ltsVersion || false
        };

        // Check if release already exists
        let release = await releaseFirmwareModel.findOne({ versionNo });

        // Upload to external server
        const form = new FormData();
        // Add folder BEFORE file to avoid undefined issue in multer destination
        form.append('folder', productType);
        form.append('file', fs.createReadStream(file.path), file.originalname);

        const uploadResponse = await axios.post(
            'http://prong.arcisai.io:6000/upload',
            form,
            { headers: form.getHeaders() }
        );

        if (uploadResponse.status !== 200) {
            return res.status(500).json({
                message: 'File uploaded locally, but remote upload failed.'
            });
        }

        if (release) {
            // Push file if not already there
            if (!release.files.includes(file.filename)) {
                release.files.push(file.filename);
            }
            release.productType = productType;
            release.versionName = versionName;
            release.updates = updates || [];
            release.ltsVersion = ltsVersion || false;
            release.releaseDate = new Date().toISOString();

            await release.save();
        } else {
            // New release with file
            release = new releaseFirmwareModel({
                ...releaseData,
                files: [file.filename]
            });
            await release.save();
        }

        return res.status(200).json({
            message: `Firmware release ${release ? 'updated' : 'created'} successfully.`,
            release
        });
    } catch (error) {
        console.error('Error creating or updating firmware release:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.downloadVersionReleaseFile = async (req, res) => {
    try {
        const { versionNo, filename } = req.params;
        console.log(req.params)

        // File path inside versionRelease/<versionNo>
        const filePath = path.join(BASE_PDFS_DIR, "versionRelease", versionNo, filename);
        console.log('10', filePath)
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found" });
        }

        // Detect content type
        const contentType = mime.lookup(filename) || "application/octet-stream";
        res.setHeader("Content-Type", contentType);

        // Use ?disposition=inline to preview, otherwise download
        const disposition = req.query.disposition === "inline" ? "inline" : "attachment";
        res.setHeader(
            "Content-Disposition",
            `${disposition}; filename="${encodeURIComponent(filename)}"`
        );

        // Stream the file
        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        console.error("Download error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Function to create or update EMS release
exports.createOrUpdateEmsRelease = async (req, res) => {
    try {
        const { versionNo, versionName, updates } = req.body;

        if (!versionNo || !versionName) {
            return res.status(400).json({ message: 'Version number, name, and release date are required.' });
        }

        const releaseData = {
            versionNo,
            versionName,
            releaseDate: new Date().toISOString(),
            updates: updates || []
        };

        const existingRelease = await releaseEmsModel.findOne({ versionNo });

        if (existingRelease) {
            // Update existing release
            await releaseEmsModel.updateOne({ versionNo }, releaseData);
            return res.status(200).json({ message: 'EMS release updated successfully.' });
        } else {
            // Create new release
            const newRelease = new releaseEmsModel(releaseData);
            await newRelease.save();
            return res.status(201).json({ message: 'EMS release created successfully.' });
        }
    } catch (error) {
        console.error('Error creating or updating EMS release:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Function to get all VMS releases
exports.getAllVmsReleases = async (req, res) => {
    try {
        const releases = await releaseVmsModel.find().sort({ releaseDate: -1 });
        res.status(200).json(releases);
    } catch (error) {
        console.error('Error fetching VMS releases:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Function to get all firmware releases
exports.getAllFirmwareReleases = async (req, res) => {
    try {
        const releases = await releaseFirmwareModel.find().sort({ releaseDate: -1 });
        res.status(200).json(releases);
    } catch (error) {
        console.error('Error fetching firmware releases:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Function to get all EMS releases
exports.getAllEmsReleases = async (req, res) => {
    try {
        const releases = await releaseEmsModel.find().sort({ releaseDate: -1 });
        res.status(200).json(releases);
    } catch (error) {
        console.error('Error fetching EMS releases:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


// Base Firmware Controller Code

// Get API

// ✅ Get all firmware versions
exports.getAllFirmware = async (req, res) => {
    try {
        const data = await BaseFirmwareVersion.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("Error fetching firmware data:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};



// SMTP Transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for others
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Email Send Function
async function sendFirmwareEmail(cameraName, versionName) {
    console.log('123')
    const mailOptions = {
        from: process.env.FROM_EMAIL,
        to: "purvesh@adiance.com", // can make dynamic later
        subject: `New Firmware Update: ${cameraName} - ${versionName}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Firmware Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin:0; padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin-top: 30px; margin-bottom: 30px; border-radius: 8px; overflow: hidden; box-shadow: 0 0 5px rgba(0,0,0,0.1);">
                  
                  <tr>
                    <td align="center" style="background-color: #007bff; color: #ffffff; padding: 20px; font-size: 20px; font-weight: bold;">
                      Adiance Camera Firmware Update
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 30px; color: #333333; font-size: 16px; line-height: 1.5;">
                      <p>A new firmware version for your <b>${cameraName}</b> is now available!</p>
                      <p>You can find all available versions, along with their release notes, on our dedicated <b>Firmware Updates</b> page:</p>
                      <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FIRMWARE_PAGE_LINK}" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 5px; display: inline-block; font-weight: bold;">
                          View All Firmware Versions →
                        </a>
                      </p>
                      <p>Simply select your camera model and the desired version to download the firmware and release notes.</p>
                      <p>We recommend keeping your camera up to date for optimal performance and the latest features.</p>
                      <p>If you have any questions or need help, please reach out to our support team at <b>support@adiance.com</b>.</p>
                      <p>Thank you for choosing <b>Adiance</b>.</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td align="center" style="background-color: #f4f4f4; color: #777777; padding: 15px; font-size: 12px;">
                      Adiance Support Team
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log("Firmware update email sent.");
}


// CreateAPI
exports.createBaseFirmware = async (req, res) => {
    try {
        const { cameraName, versionName } = req.params;
        console.log("cameraName:", req.params);
        // Extract uploaded files
        const firmwareFiles = (req.files['firmwareFiles'] || []).map(f => f.filename);  // .bin & .rom files
        const releaseNotesFile = req.files['releaseNotes']?.[0]?.filename || null;      // .txt file

        if (!firmwareFiles.length) {
            return res.status(400).json({ error: "At least one firmware file (.bin or .rom) is required" });
        }

        // If releaseNotes.txt exists, read its content
        let releaseNotesText = null;
        if (releaseNotesFile) {
            const releaseNotesPath = path.join(
                process.cwd(),
                'pdfs',
                'firmwareVersion',
                cameraName,
                versionName,
                releaseNotesFile
            );
            if (fs.existsSync(releaseNotesPath)) {
                releaseNotesText = fs.readFileSync(releaseNotesPath, 'utf-8');
            }
        }

        // Check if this cameraName + versionName already exists
        let existingFirmware = await BaseFirmwareVersion.findOne({ cameraName, versionName });

        if (existingFirmware) {
            // Update existing record (replace files & release notes)
            existingFirmware.files = firmwareFiles;
            existingFirmware.releaseNotesFile = releaseNotesFile;
            existingFirmware.releaseNotesText = releaseNotesText;
            await existingFirmware.save();

            return res.json({
                success: true,
                message: "Firmware updated successfully",
                data: existingFirmware
            });
        }

        // Create new record if doesn't exist
        const newFirmware = new BaseFirmwareVersion({
            cameraName,
            versionName,
            files: firmwareFiles,
            releaseNotesFile,
            releaseNotesText
        });

        await newFirmware.save();

        // Send email after new firmware
        // const check = await sendFirmwareEmail(cameraName, versionName);
        // console.log("Firmware email sent.", check);

        res.json({
            success: true,
            message: "Firmware uploaded successfully",
            data: newFirmware
        });

    } catch (error) {
        console.error("Firmware upload error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Download API
// Download either release notes or firmware files
// Download firmware or release notes by document ID
// Helper to sanitize folder names (keep this or your existing sanitize)
function sanitize(name = '') {
    return String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

exports.downloadFirmwareById = async (req, res) => {
    try {
        const { id } = req.params;     // MongoDB document ID
        const { type } = req.query;    // 'releaseNotes' or 'firmware'

        if (!id || !type) {
            console.warn('[downloadFirmwareById] Missing id or type', { id, type });
            return res.status(400).json({ success: false, message: "Missing required parameters (id,type)" });
        }
        console.log('[downloadFirmwareById] params:', { id, type });

        // Fetch firmware document (lean for performance)
        const firmware = await BaseFirmwareVersion.findById(id).lean();
        if (!firmware) {
            console.warn('[downloadFirmwareById] Firmware not found for id:', id);
            return res.status(404).json({ success: false, message: "Firmware version not found" });
        }

        console.log('[downloadFirmwareById] firmware doc:', {
            cameraName: firmware.cameraName,
            versionName: firmware.versionName,
            filesCount: Array.isArray(firmware.files) ? firmware.files.length : 0,
            releaseNotesFile: firmware.releaseNotesFile || null
        });

        // Build folder path (sanitized)
        const safeCamera = sanitize(firmware.cameraName || '');
        const safeVersion = sanitize(firmware.versionName || '');
        const versionPath = path.join(process.cwd(), 'pdfs', 'firmwareVersion', safeCamera, safeVersion);
        console.log('[downloadFirmwareById] versionPath:', versionPath);

        if (!fs.existsSync(versionPath)) {
            console.warn('[downloadFirmwareById] firmware directory not found:', versionPath);
            return res.status(404).json({ success: false, message: "Firmware files directory not found" });
        }

        // ----------------- Release Notes -----------------
        if (type === 'releaseNotes') {
            if (!firmware.releaseNotesFile) {
                console.warn('[downloadFirmwareById] releaseNotesFile missing in DB for id:', id);
                return res.status(404).json({ success: false, message: "No release notes available for this version" });
            }

            const releaseFileName = path.basename(firmware.releaseNotesFile);
            const releaseFilePath = path.join(versionPath, releaseFileName);
            console.log('[downloadFirmwareById] releaseFilePath:', releaseFilePath);

            if (!fs.existsSync(releaseFilePath)) {
                console.warn('[downloadFirmwareById] Release notes file not found on disk:', releaseFilePath);
                return res.status(404).json({ success: false, message: "Release notes file not found" });
            }

            return res.download(releaseFilePath, releaseFileName, err => {
                if (err) {
                    console.error('[downloadFirmwareById] Error sending release notes:', err);
                    if (!res.headersSent) res.status(500).json({ success: false, message: "Failed to send release notes" });
                } else {
                    console.log('[downloadFirmwareById] Release notes sent successfully:', releaseFileName);
                }
            });
        }

        // ----------------- Firmware files -----------------
        if (type === 'firmware') {
            const files = Array.isArray(firmware.files) ? firmware.files : [];

            if (files.length === 0) {
                console.warn('[downloadFirmwareById] No firmware files listed in DB for id:', id);
                return res.status(404).json({ success: false, message: "No firmware files available for this version" });
            }

            // Build absolute paths, sanitize each filename and check existence
            const filesToDownload = files.map(f => {
                const name = path.basename(String(f)); // prevent traversal
                const filePath = path.join(versionPath, name);
                return { name, path: filePath };
            });

            for (const f of filesToDownload) {
                if (!fs.existsSync(f.path)) {
                    console.warn('[downloadFirmwareById] Firmware file missing:', f.path);
                    return res.status(404).json({ success: false, message: `File not found: ${f.name}` });
                }
            }

            // If multiple files -> stream as zip
            if (filesToDownload.length > 1) {
                const zipName = `${safeCamera}_${safeVersion}_firmware.zip`;
                console.log('[downloadFirmwareById] Streaming zip:', zipName, 'files:', filesToDownload.map(x => x.name));

                res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
                res.setHeader('Content-Type', 'application/zip');

                const archive = archiver('zip', { zlib: { level: 9 } });

                // If archiver errors, log and end response if possible
                let errored = false;
                archive.on('error', err => {
                    console.error('[downloadFirmwareById] archive error:', err);
                    errored = true;
                    try {
                        if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to create zip' });
                        else res.end();
                    } catch (e) {
                        console.error('[downloadFirmwareById] error sending archive failure response:', e);
                    }
                });

                // Pipe archive to response
                archive.pipe(res);

                // Append files
                for (const f of filesToDownload) {
                    console.log('[downloadFirmwareById] Adding file to zip:', f.path);
                    archive.file(f.path, { name: f.name });
                }

                // Finalize and return (do not continue after piping)
                archive.finalize().catch(err => {
                    console.error('[downloadFirmwareById] archive.finalize() failed:', err);
                    if (!errored && !res.headersSent) res.status(500).json({ success: false, message: 'Failed to finalize zip' });
                });

                return; // streaming response; function ends here
            }

            // Single file -> send directly
            const single = filesToDownload[0];
            console.log('[downloadFirmwareById] Sending single firmware file:', single.path);
            return res.download(single.path, single.name, err => {
                if (err) {
                    console.error('[downloadFirmwareById] Error sending firmware file:', err);
                    if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to send firmware file' });
                } else {
                    console.log('[downloadFirmwareById] Firmware file sent successfully:', single.name);
                }
            });
        }

        // Invalid type
        console.warn('[downloadFirmwareById] Invalid type param:', type);
        return res.status(400).json({ success: false, message: "Invalid type parameter (must be 'releaseNotes' or 'firmware')" });

    } catch (err) {
        console.error('[downloadFirmwareById] Unexpected server error:', err);
        if (!res.headersSent) res.status(500).json({ success: false, message: "Server Error" });
    }
};


// App Version Related Code

exports.getAllAppVersion = async (req, res) => {
    try {
        const data = await AppVersion.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data });
    } catch (err) {
        console.error("Error fetching firmware data:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// CreateAPI
exports.createAppVersion = async (req, res) => {
    console.log("appName:");
    try {
        const { appName, versionName } = req.params;
        // Extract uploaded files
        const appFiles = (req.files['applicationFiles'] || []).map(f => f.filename);  // .bin & .rom files
        const releaseNotesFile = req.files['releaseNotes']?.[0]?.filename || null;      // .txt file

        if (!appFiles.length) {
            return res.status(400).json({ error: "At least one application file (.bin or .rom) is required" });
        }

        // If releaseNotes.txt exists, read its content
        let releaseNotesText = null;
        if (releaseNotesFile) {
            const releaseNotesPath = path.join(
                process.cwd(),
                'pdfs',
                'applications',
                appName,
                versionName,
                releaseNotesFile
            );
            if (fs.existsSync(releaseNotesPath)) {
                releaseNotesText = fs.readFileSync(releaseNotesPath, 'utf-8');
            }
        }

        // Check if this appName + versionName already exists
        let existingFirmware = await AppVersion.findOne({ appName, versionName });

        if (existingFirmware) {
            // Update existing record (replace files & release notes)
            existingFirmware.files = appFiles;
            existingFirmware.releaseNotesFile = releaseNotesFile;
            existingFirmware.releaseNotesText = releaseNotesText;
            await existingFirmware.save();

            return res.json({
                success: true,
                message: "Application updated successfully",
                data: existingFirmware
            });
        }

        // Create new record if doesn't exist
        const newFirmware = new AppVersion({
            appName,
            versionName,
            files: appFiles,
            releaseNotesFile,
            releaseNotesText
        });

        await newFirmware.save();

        res.json({
            success: true,
            message: "Firmware uploaded successfully",
            data: newFirmware
        });

    } catch (error) {
        console.error("Firmware upload error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Download API
// Download either release notes or firmware files
// Download firmware or release notes by document ID
exports.downloadAppById = async (req, res) => {
    try {
        const { id } = req.params;     // MongoDB document ID
        const { type } = req.query;    // 'releaseNotes' or 'app'

        if (!id || !type) {
            return res.status(400).json({ success: false, message: "Missing required parameters" });
        }

        // Fetch app version document
        const appVersion = await AppVersion.findById(id);
        if (!appVersion) {
            return res.status(404).json({ success: false, message: "App version not found" });
        }

        // Build folder path
        const versionPath = path.join(
            process.cwd(),
            "pdfs",
            "applications",
            sanitize(appVersion.appName),
            sanitize(appVersion.versionName)
        );

        // ----------------- Download Release Notes -----------------
        if (type === "releaseNotes") {
            const releaseNotesFile = path.join(versionPath, appVersion.releaseNotesFile);
            if (!fs.existsSync(releaseNotesFile)) {
                return res.status(404).json({ success: false, message: "Release notes file not found" });
            }
            return res.download(releaseNotesFile);
        }

        // ----------------- Download Application File as ZIP -----------------
        if (type === "app") {
            if (!appVersion.files || appVersion.files.length === 0) {
                return res.status(404).json({ success: false, message: "No application files found" });
            }

            // Collect all app files (even if only one)
            const filesToDownload = appVersion.files.map(f => path.join(versionPath, f));

            // Check files exist
            for (const f of filesToDownload) {
                if (!fs.existsSync(f)) {
                    return res.status(404).json({ success: false, message: `File not found: ${f}` });
                }
            }

            // Always zip files
            const zipName = `${appVersion.appName}_${appVersion.versionName}.zip`;
            res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
            res.setHeader("Content-Type", "application/zip");

            const archive = archiver("zip", { zlib: { level: 9 } });
            archive.on("error", err => res.status(500).send({ error: err.message }));
            archive.pipe(res);

            filesToDownload.forEach(f => archive.file(f, { name: path.basename(f) }));
            archive.finalize();
            return;
        }

        return res.status(400).json({ success: false, message: "Invalid type parameter" });

    } catch (err) {
        console.error("Download Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Helper to sanitize folder names
function sanitize(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}