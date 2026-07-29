import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { MultipartFile } from "@fastify/multipart";

// Azure Blob Storage configuration
interface AzureBlobConfig {
    connectionString: string;
    containerName: string;
}

// Upload options for Azure Blob
interface AzureBlobUploadOptions {
    folderName: string;
    fileName?: string;
    contentType?: string;
    metadata?: Record<string, string>;
}

// Get Azure configuration from environment
const getAzureConfig = (): AzureBlobConfig => {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_CONTAINER_NAME || 'hrmbucket'; // Default container name if not set
    
    if (!connectionString) {
        throw new Error('Azure Storage connection string is missing. Please check AZURE_STORAGE_CONNECTION_STRING environment variable.');
    }
    
    return { connectionString, containerName };
};

// Validate file type
const isValidFileType = (filename: string): boolean => {
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt'];
    return allowedTypes.some(type => filename.toLowerCase().endsWith(type));
};

// Validate file size (max 10MB for Azure)
const isValidFileSize = (buffer: Buffer): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return buffer.length <= maxSize;
};

// Get content type based on file extension
const getContentType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt': 'text/plain'
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
};

// Sanitize metadata values for Azure Blob Storage
// Azure metadata headers only allow ASCII characters and cannot contain certain special characters
const sanitizeMetadataValue = (value: string): string => {
    return value
        .replace(/['"]/g, '') // Remove apostrophes and quotes
        .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
        .trim();
};

// Sanitize all metadata values in an object
const sanitizeMetadata = (metadata: Record<string, string>): Record<string, string> => {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(metadata)) {
        sanitized[key] = sanitizeMetadataValue(value);
    }
    return sanitized;
};

// Generic Azure Blob upload function
export const uploadToAzureBlob = async (
    file: MultipartFile, 
    userId: string, 
    options: AzureBlobUploadOptions
): Promise<string> => {
    try {
        const config = getAzureConfig();
        
        // Validate file
        if (!file.filename) {
            throw new Error('File name is required');
        }

        if (!isValidFileType(file.filename)) {
            throw new Error('Invalid file type. Allowed types: jpg, jpeg, png, gif, webp, pdf, doc, docx, txt');
        }

        const fileBuffer = await file.toBuffer();
        
        if (!isValidFileSize(fileBuffer)) {
            throw new Error('File size too large. Maximum size is 10MB.');
        }

        // Create blob service client
        const blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
        
        // Get container client
        const containerClient = blobServiceClient.getContainerClient(config.containerName);
        
        // Ensure container exists
        await containerClient.createIfNotExists();

        // Generate blob name
        const timestamp = Date.now();
        const fileExtension = file.filename.split('.').pop();
        const blobName = options.fileName 
            ? `${options.folderName}/${options.fileName}.${fileExtension}`
            : `${options.folderName}/${userId}-${timestamp}.${fileExtension}`;

        // Get block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Upload options
        const uploadOptions = {
            blobHTTPHeaders: {
                blobContentType: options.contentType || getContentType(file.filename)
            },
            metadata: sanitizeMetadata({
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
                originalName: file.filename,
                ...options.metadata
            })
        };

        // Upload the file
        await blockBlobClient.upload(fileBuffer, fileBuffer.length, uploadOptions);

        // Return the URL
        return blockBlobClient.url;

    } catch (error) {
        console.error('Azure Blob upload error:', error);
        throw new Error(`Azure Blob upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Convenient wrapper for profile pictures
export const uploadProfilePictureToAzure = async (file: MultipartFile, userId: string): Promise<string> => {
    const timestamp = Date.now();
    return uploadToAzureBlob(file, userId, {
        folderName: 'profile-pictures',
        fileName: `${userId}-profile-picture-${timestamp}`,
        metadata: {
            type: 'profile-picture'
        }
    });
};

// Convenient wrapper for documents
export const uploadDocumentToAzure = async (file: MultipartFile, userId: string, documentType: string): Promise<string> => {
    return uploadToAzureBlob(file, userId, {
        folderName: `documents/${documentType}`,
        metadata: {
            type: 'document',
            documentType: documentType
        }
    });
};

// Convenient wrapper for company assets
export const uploadCompanyAssetToAzure = async (file: MultipartFile, companyId: string, assetType: string): Promise<string> => {
    return uploadToAzureBlob(file, companyId, {
        folderName: `company-assets/${assetType}`,
        metadata: {
            type: 'company-asset',
            assetType: assetType
        }
    });
};

// Replace existing blob (upload new and delete old in one operation)
export const replaceAzureBlob = async (
    file: MultipartFile, 
    userId: string, 
    options: AzureBlobUploadOptions,
    oldBlobUrl?: string
): Promise<string> => {
    try {
        // Upload new file first
        const newUrl = await uploadToAzureBlob(file, userId, options);
        
        // Delete old file if it exists (do this after successful upload)
        if (oldBlobUrl && oldBlobUrl.trim() !== '' && oldBlobUrl.includes('blob.core.windows.net')) {
            const deleteSuccess = await deleteFromAzureBlob(oldBlobUrl);
            if (!deleteSuccess) {
                console.warn(`Failed to delete old blob: ${oldBlobUrl}`);
            }
        }
        
        return newUrl;
    } catch (error) {
        console.error('Azure Blob replace error:', error);
        throw error;
    }
};

// Delete blob function
export const deleteFromAzureBlob = async (blobUrl: string): Promise<boolean> => {
    try {
        const config = getAzureConfig();
        const blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
        const containerClient = blobServiceClient.getContainerClient(config.containerName);
        
        // Extract blob name from URL
        const url = new URL(blobUrl);
        const pathParts = url.pathname.split('/');
        const blobName = pathParts.slice(2).join('/'); // Remove container name from path
        
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.delete();
        
        return true;
    } catch (error) {
        console.error('Azure Blob delete error:', error);
        return false;
    }
};
