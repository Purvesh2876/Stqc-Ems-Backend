
// **************************************************************
// **************************************************************
// **************************************************************

// This code is also perfectly working, best for initial setup 

// **************************************************************
// **************************************************************
// **************************************************************

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const crypto = require('crypto');

// const BASE_PDFS_DIR = path.join(process.cwd(), 'pdfs');
// fs.mkdirSync(BASE_PDFS_DIR, { recursive: true });

// function ensureDir(dir) {
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// }

// function sanitize(name) {
//     return name.replace(/[^a-zA-Z0-9._-]/g, '_');
// }

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const dest = path.join(BASE_PDFS_DIR, req.params.id);
//         ensureDir(dest);
//         cb(null, dest);
//     },
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         const now = new Date();
//         const formatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
//         const original = sanitize(path.basename(file.originalname, ext));
//         cb(null, `${formatted}-${original}${ext}`);
//     }
// });

// // Allowed types
// const ALLOWED_EXTS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.xls', '.xlsx']);
// const ALLOWED_MIME = new Set([
//     'application/pdf',
//     'image/png',
//     'image/jpeg',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
// ]);

// function fileFilter(req, file, cb) {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (ALLOWED_EXTS.has(ext) || ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
//     cb(new Error('Only PDF, PNG, JPG/JPEG, and Excel (xls/xlsx) files are allowed'));
// }

// const uploadFiles = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 20 * 1024 * 1024 } // 20MB
// });

// module.exports = { uploadFiles, BASE_PDFS_DIR };







// **************************************************************
// **************************************************************
// **************************************************************

// Prop drilling like structure : lvl 2

// **************************************************************
// **************************************************************
// **************************************************************





// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const crypto = require('crypto');

// const BASE_PDFS_DIR = path.join(process.cwd(), 'pdfs', 'requirement');
// fs.mkdirSync(BASE_PDFS_DIR, { recursive: true });

// function ensureDir(dir) {
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
// }

// function sanitize(name) {
//     return name.replace(/[^a-zA-Z0-9._-]/g, '_');
// }

// const ALLOWED_EXTS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.xls', '.xlsx']);
// const ALLOWED_MIME = new Set([
//     'application/pdf',
//     'image/png',
//     'image/jpeg',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
// ]);

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const type = req.params.type || 'quotation'; // folder: quotation or PO
//         const id = req.params.id || 'default';

//         // requirement/type/id
//         const dest = path.join(BASE_PDFS_DIR, sanitize(type), sanitize(id));
//         ensureDir(dest);
//         cb(null, dest);
//     },
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         const now = new Date();
//         const formatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
//         const original = sanitize(path.basename(file.originalname, ext));
//         cb(null, `${formatted}-${original}${ext}`);
//     }
// });

// function fileFilter(req, file, cb) {
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (ALLOWED_EXTS.has(ext) || ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
//     cb(new Error('Only PDF, PNG, JPG/JPEG, and Excel (xls/xlsx) files are allowed'));
// }

// const uploadFiles = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 20 * 1024 * 1024 } // 20MB
// });

// module.exports = { uploadFiles, BASE_PDFS_DIR };




// **************************************************************
// **************************************************************
// **************************************************************

// Level 3 : code

// **************************************************************
// **************************************************************
// **************************************************************
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const BASE_PDFS_DIR = path.join(process.cwd(), 'pdfs');
const REQUIREMENT_DIR = path.join(BASE_PDFS_DIR, 'requirement');
const VERSION_RELEASE_DIR = path.join(BASE_PDFS_DIR, 'versionRelease');
const FIRMWARE_VERSION_DIR = path.join(BASE_PDFS_DIR, 'firmwareVersion');
const APPLICATIONS_DIR = path.join(BASE_PDFS_DIR, 'applications');

fs.mkdirSync(REQUIREMENT_DIR, { recursive: true });
fs.mkdirSync(VERSION_RELEASE_DIR, { recursive: true });
fs.mkdirSync(FIRMWARE_VERSION_DIR, { recursive: true });
fs.mkdirSync(APPLICATIONS_DIR, { recursive: true });

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitize(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ✅ Added .tar.gz support
const ALLOWED_EXTS = new Set([
    '.pdf', '.png', '.jpg', '.jpeg', '.xls', '.xlsx', '.tar.gz', '.bin', '.rom', '.txt', '.exe'
]);

const ALLOWED_MIME = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/gzip',
    'application/x-tar',
    'application/x-msdownload', // for .exe
    'application/octet-stream', // for bin/rom
    'text/plain'                // for .txt release notes
]);

// Helper to get correct extension including .tar.gz
function getFileExtension(filename) {
    return filename.toLowerCase().endsWith('.tar.gz')
        ? '.tar.gz'
        : path.extname(filename).toLowerCase();
}

// -------------------- Storage for requirement --------------------
const requirementStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.params.type || 'quotation';
        const id = req.params.id || 'default';
        const dest = path.join(REQUIREMENT_DIR, sanitize(type), sanitize(id));
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = getFileExtension(file.originalname);
        const now = new Date();
        const formatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const original = sanitize(path.basename(file.originalname, ext));
        cb(null, `${formatted}-${original}${ext}`);
    }
});

// -------------------- Storage for versionRelease --------------------
const versionReleaseStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const versionName = req.params.versionNo; // folder name from API
        console.log('filename 0', versionName)
        const dest = path.join(VERSION_RELEASE_DIR, sanitize(versionName));
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = getFileExtension(file.originalname);
        console.log('filename 1', file.originalname)
        const now = new Date();
        const formatted = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
        const original = sanitize(path.basename(file.originalname, ext));
        cb(null, `${original}${ext}`);
    }
});

// -------------------- Storage for FirmwareVersion --------------------
const firmwareVersionStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const cameraName = req.params.cameraName || 'defaultCamera';
        const versionName = req.params.versionName || 'v1';
        const dest = path.join(FIRMWARE_VERSION_DIR, sanitize(cameraName), sanitize(versionName));
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = getFileExtension(file.originalname);
        const original = sanitize(path.basename(file.originalname, ext));
        cb(null, `${original}${ext}`); // overwrite if same file uploaded
    }
});

// -------------------- Storage for Applications (like firmware) --------------------
const applicationsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            console.log("[Applications] Destination started");
            const appName = req.params.appName || 'defaultApp';
            const versionName = req.params.versionName || 'v1';
            const dest = path.join(APPLICATIONS_DIR, sanitize(appName), sanitize(versionName));
            console.log("[Applications] Destination path:", dest);
            ensureDir(dest);
            cb(null, dest);
        } catch (err) {
            console.error("[Applications] Destination Error:", err);
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        try {
            console.log("[Applications] Filename started:", file.originalname);
            const ext = getFileExtension(file.originalname);
            const original = sanitize(path.basename(file.originalname, ext));
            console.log("[Applications] Final Filename:", `${original}${ext}`);
            cb(null, `${original}${ext}`);
        } catch (err) {
            console.error("[Applications] Filename Error:", err);
            cb(err);
        }
    }
});

// -------------------- File Filter with Debug --------------------
function fileFilter(req, file, cb) {
    console.log("[FileFilter] Checking file:", file.originalname, "Mime:", file.mimetype);
    const ext = getFileExtension(file.originalname);
    if (ALLOWED_EXTS.has(ext) || ALLOWED_MIME.has(file.mimetype)) {
        console.log("[FileFilter] Accepted:", file.originalname);
        return cb(null, true);
    }
    console.error("[FileFilter] Rejected file:", file.originalname);
    cb(new Error(`Invalid file type: ${file.originalname}`));
}


const uploadRequirementFiles = multer({
    storage: requirementStorage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // increased to 50MB for tar.gz
});


const uploadVersionReleaseFiles = multer({
    storage: versionReleaseStorage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});


// ✅ New middleware for firmware + release notes
const uploadFirmwareFiles = multer({
    storage: firmwareVersionStorage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
}).fields([
    { name: 'firmwareFiles', maxCount: 5 },
    { name: 'releaseNotes', maxCount: 1 }
]);

// -------------------- Middleware for Applications (like firmware) --------------------
const uploadApplicationFiles = (req, res, next) => {
    const uploader = multer({
        storage: applicationsStorage,
        fileFilter,
        limits: { fileSize: 100 * 1024 * 1024 }
    }).fields([
        { name: 'applicationFiles', maxCount: 5 },
        { name: 'releaseNotes', maxCount: 1 }
    ]);

    uploader(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error("[Multer Error]", err);
            return res.status(400).json({ error: "Multer Error: " + err.message });
        } else if (err) {
            console.error("[Upload Error]", err);
            return res.status(400).json({ error: "Upload Error: " + err.message });
        }
        console.log("[Applications] Upload Successful");
        next();
    });
};


module.exports = { uploadRequirementFiles, uploadVersionReleaseFiles, uploadFirmwareFiles, uploadApplicationFiles, BASE_PDFS_DIR };
