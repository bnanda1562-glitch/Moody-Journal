const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Make sure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (images and audio)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|mp3|wav|ogg|m4a|webm/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images and Audio files only!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary configuration loaded successfully.');
} else {
  console.warn('Cloudinary keys not set. Uploads will be saved locally in backend/uploads/.');
}

// Upload file to Cloudinary helper or fallback to local path URL
const handleUpload = async (file) => {
  if (!file) return '';

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'mood-journal-ai',
        resource_type: 'auto'
      });
      // Delete temporary file from local storage
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload failed, falling back to local server URL:', error.message);
      // Fallback: return local relative URL
      return `/uploads/${file.filename}`;
    }
  } else {
    // If not using Cloudinary, return the local asset URL route
    return `/uploads/${file.filename}`;
  }
};

module.exports = {
  upload,
  handleUpload
};
