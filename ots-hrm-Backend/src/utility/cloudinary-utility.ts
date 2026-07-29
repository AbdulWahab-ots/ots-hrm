import { v2 as cloudinary, ConfigOptions } from 'cloudinary'
import { MultipartFile } from "@fastify/multipart";
import { writeFile, unlink, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

const cloudinaryConfig: ConfigOptions = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};

// Upload options interface
interface UploadOptions {
    folderName: string;
    width?: number;
    height?: number;
    crop?: string;
    gravity?: string;
    format?: string;
    quality?: string | number;
    publicIdPrefix?: string;
}

// Validate file type
const isValidImageType = (filename: string): boolean => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return allowedTypes.some(type => filename.toLowerCase().endsWith(type));
};

// Validate file size (max 5MB)
const isValidFileSize = (buffer: Buffer): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return buffer.length <= maxSize;
};

export const upload = async (file: MultipartFile, userId: string, options: UploadOptions): Promise<string> => {
    try {
        // Validate environment variables
        if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
            throw new Error('Cloudinary configuration is missing. Please check environment variables.');
        }

        cloudinary.config(cloudinaryConfig);

        // Validate file
        if (!file.filename) {
            throw new Error('File name is required');
        }

        if (!isValidImageType(file.filename)) {
            throw new Error('Invalid file type. Only images are allowed.');
        }

        const fileBuffer = await file.toBuffer();
        
        if (!isValidFileSize(fileBuffer)) {
            throw new Error('File size too large. Maximum size is 5MB.');
        }

        // Setup temporary file
        const tempDirectory = join(__dirname, '../tempfiles');
        const tempFilePath = join(tempDirectory, `${userId}_${Date.now()}`);

        if (!existsSync(tempDirectory)) {
            mkdirSync(tempDirectory, { recursive: true });
        }

        // Write file to temp location
        await writeFileAsync(tempFilePath, fileBuffer);

        try {
            // Upload to Cloudinary with dynamic options
            const uploadConfig: any = {
                public_id: `${options.publicIdPrefix || userId}-${options.folderName}-${Date.now()}`,
                folder: `${process.env.CLOUDINARY_FOLDER}/${options.folderName}/`,
            };

            // Add optional transformation parameters
            if (options.width) uploadConfig.width = options.width;
            if (options.height) uploadConfig.height = options.height;
            if (options.crop) uploadConfig.crop = options.crop;
            if (options.gravity) uploadConfig.gravity = options.gravity;
            if (options.format) uploadConfig.format = options.format;
            if (options.quality) uploadConfig.quality = options.quality;

            const result = await cloudinary.uploader.upload(tempFilePath, uploadConfig);

            // Clean up temp file
            await unlinkAsync(tempFilePath).catch(err => 
                console.warn(`Warning: Could not delete temp file ${tempFilePath}:`, err.message)
            );

            return result.secure_url;
        } catch (uploadError) {
            // Clean up temp file on upload error
            await unlinkAsync(tempFilePath).catch(() => {});
            throw uploadError;
        }
    } catch (error) {
        console.error('Upload error:', error);
        throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Convenient wrapper for profile pictures
export const uploadProfilePicture = async (file: MultipartFile, userId: string): Promise<string> => {
    return upload(file, userId, {
        folderName: 'profile-pictures',
        width: 200,
        height: 200,
        gravity: 'face',
        crop: 'thumb',
        format: 'webp',
        quality: 'auto',
        publicIdPrefix: userId
    });
};

// Convenient wrapper for documents
export const uploadDocument = async (file: MultipartFile, userId: string, documentType: string): Promise<string> => {
    return upload(file, userId, {
        folderName: `documents/${documentType}`,
        format: 'auto',
        quality: 'auto',
        publicIdPrefix: userId
    });
};

// Convenient wrapper for company assets
export const uploadCompanyAsset = async (file: MultipartFile, companyId: string, assetType: string): Promise<string> => {
    return upload(file, companyId, {
        folderName: `company-assets/${assetType}`,
        width: 400,
        height: 400,
        crop: 'fit',
        format: 'webp',
        quality: 'auto',
        publicIdPrefix: companyId
    });
};