import cloudinary from '../config/cloudinary.js';
import { getCloudinaryConfigIssues } from '../config/env.js';

interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  resourceType: string;
}

function assertCloudinaryConfig() {
  const issues = getCloudinaryConfigIssues();
  if (issues.length > 0) {
    throw new Error(`Cloudinary is not configured correctly: ${issues.join('; ')}`);
  }
}

function configureCloudinary() {
  assertCloudinaryConfig();
}

export async function uploadPdfToCloudinary(filePath: string, filename?: string): Promise<CloudinaryUploadResult> {
  configureCloudinary();

  console.info('[cloudinary] pdf upload start', { filePath, filename });
  const uploaded = await cloudinary.uploader.upload(filePath, {
    folder: 'vedaai/question-papers',
    resource_type: 'raw',
    type: 'upload',
    access_mode: 'public',
    use_filename: false,
    overwrite: true,
  });

  const secureUrl = uploaded.secure_url;
  const publicId = uploaded.public_id;
  const resourceType = uploaded.resource_type;

  console.info('[cloudinary] pdf uploaded', {
    publicId,
    secureUrl,
    resourceType,
    type: uploaded.type,
    originalFilename: uploaded.original_filename,
    format: uploaded.format,
    bytes: uploaded.bytes,
    uploadResponse: uploaded,
  });

  return { secureUrl, publicId, resourceType };
}

export async function uploadProfileImageToCloudinary(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'vedaai/profile-images',
        resource_type: 'image',
        transformation: [
          { width: 480, height: 480, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error('Cloudinary image upload failed'));
          return;
        }

        resolve({
          secureUrl: uploaded.secure_url,
          publicId: uploaded.public_id,
          resourceType: uploaded.resource_type,
        });
      },
    );

    stream.end(file.buffer);
  });
}
