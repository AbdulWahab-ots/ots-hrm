import { inject, injectable } from "tsyringe";
import { UserService } from "./user-service";
import { CompanyService } from "./company-service";
import { MultipartFile } from "@fastify/multipart";
import { 
    uploadProfilePictureToAzure,
    uploadDocumentToAzure,
    uploadCompanyAssetToAzure,
    deleteFromAzureBlob
} from "../utility"
import { ITokenUser } from "../models";
import { DefaultRoles } from "../constants";

@injectable()
export class UploadService {
    constructor(
        @inject('UserService') private readonly userService: UserService,
        @inject('CompanyService') private readonly companyService: CompanyService
    ){
    }

    // Helper function to safely delete old Azure blob files
    private async deleteOldAzureFile(oldUrl: string | undefined | null): Promise<void> {
        if (oldUrl && oldUrl.trim() !== '' && oldUrl.includes('blob.core.windows.net')) {
            try {
                const deleteSuccess = await deleteFromAzureBlob(oldUrl);
                if (deleteSuccess) {
                    console.log(`Successfully deleted old file: ${oldUrl}`);
                } else {
                    console.warn(`Failed to delete old file: ${oldUrl}`);
                }
            } catch (error) {
                console.error(`Error deleting old file ${oldUrl}:`, error);
                // Don't throw error here, as the main upload was successful
            }
        }
    }

    uploadProfilePicture = async (file: MultipartFile, userId: string, contextUser: ITokenUser): Promise<string> => {
        try {
            // Get current user to check for existing picture
            const currentUser = await this.userService.getById(userId);
            
            // Upload new picture first
            const newUrl = await uploadProfilePictureToAzure(file, userId);
            
            // Update user record with new picture URL
            await this.userService.partialUpdate(userId, {pictureUrl: newUrl}, contextUser);
            
            // Delete old picture if it exists (do this after successful upload and update)
            await this.deleteOldAzureFile(currentUser.pictureUrl);
            
            return newUrl;
        } catch (error) {
            console.error('Error in uploadProfilePicture:', error);
            throw error;
        }
    }

    uploadEmployeeDocument = async (file: MultipartFile, userId: string, documentType: string, contextUser: ITokenUser): Promise<string> => {
        return await uploadDocumentToAzure(file, userId, documentType);
    }

    uploadCompanyLogo = async (file: MultipartFile, companyId: string, contextUser: ITokenUser): Promise<string> => {
        try {
            // Determine which company to update based on user role
            let targetCompanyId = companyId;
            
            // If user is Super Admin, companyId is required
            if (contextUser.role === DefaultRoles.SuperAdmin) {
                if (!companyId || companyId.trim() === '') {
                    throw new Error('Company ID is required for Super Admin');
                }
                targetCompanyId = companyId;
            } else {
                // If user is not super admin (Admin), use their company ID from token
                targetCompanyId = contextUser.companyId;
            }
            
            // Get current company to check for existing logo
            const currentCompany = await this.companyService.getById(targetCompanyId, contextUser);
            if (!currentCompany) {
                throw new Error('Company not found');
            }
            
            // Upload new logo first
            const newUrl = await uploadCompanyAssetToAzure(file, targetCompanyId, 'logo');
            
            // Update company record with new logo URL
            await this.companyService.partialUpdate(targetCompanyId, {logoUrl: newUrl}, contextUser);
            
            // Delete old logo if it exists (do this after successful upload and update)
            await this.deleteOldAzureFile(currentCompany.logoUrl);
            
            return newUrl;
        } catch (error) {
            console.error('Error in uploadCompanyLogo:', error);
            throw error;
        }
    }

    uploadCompanyBanner = async (file: MultipartFile, companyId: string, contextUser: ITokenUser): Promise<string> => {
        return await uploadCompanyAssetToAzure(file, companyId, 'banner');
    }
}