import { inject, injectable } from "tsyringe";
import { ControllerBase } from "./generics/controller-base";
import { CommonRoutes } from "../constants";
import { FastifyReply, FastifyRequest, preHandlerHookHandler, RouteHandlerMethod } from "fastify";
import { ExtendedRequest } from "../models";
import { authorize, validateCompanyHeader } from "../middlewares/authentication";
import { UploadService } from "../bl";

@injectable()
export class UploadController extends ControllerBase {
    constructor(@inject('UploadService') private readonly uploadService: UploadService){
        super('/upload');
        this.middleware = [authorize, validateCompanyHeader] as preHandlerHookHandler[];
        this.endPoints = [
            {
                method: 'POST',
                path: "profile-picture/:id",
                handler: this.uploadProfilePic as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: "employee-document/:id/:documentType",
                handler: this.uploadEmployeeDocument as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: "company-logo",
                handler: this.uploadCompanyLogo as RouteHandlerMethod
            },
            {
                method: 'POST',
                path: "company-banner/:companyId", 
                handler: this.uploadCompanyBanner as RouteHandlerMethod
            }
        ];
    }

    private uploadProfilePic = async (req: FastifyRequest<{Params: {id: string}}>, res: FastifyReply) => {
        try {
            const request = req as ExtendedRequest;

            const file = await req.file();
            if (!file) {
                return res.status(400).send({message: 'File is required'});
            }

            const url = await this.uploadService.uploadProfilePicture(file, req.params.id, request.user!);
            
            res.send({ url, message: 'Profile picture uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            res.status(500).send({ message });
        }
    }

    private uploadEmployeeDocument = async (req: FastifyRequest<{Params: {id: string, documentType: string}}>, res: FastifyReply) => {
        try {
            const request = req as ExtendedRequest;
            
            const file = await req.file();
            if (!file) {
                return res.status(400).send({message: 'File is required'});
            }

            const url = await this.uploadService.uploadEmployeeDocument(file, req.params.id, req.params.documentType, request.user!);
            
            res.send({ 
                url, 
                message: 'Employee document uploaded successfully', 
                documentType: req.params.documentType 
            });
        } catch (error) {
            console.error('Upload error:', error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            res.status(500).send({ message });
        }
    }

    private uploadCompanyLogo = async (req: FastifyRequest<{Querystring: {companyId?: string}}>, res: FastifyReply) => {
        try {
            const request = req as ExtendedRequest;
            
            const file = await req.file();
            if (!file) {
                return res.status(400).send({message: 'File is required'});
            }

            const url = await this.uploadService.uploadCompanyLogo(file, req.query.companyId || '', request.user!);
            
            res.send({ url, message: 'Company logo uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            res.status(500).send({ message });
        }
    }

    private uploadCompanyBanner = async (req: FastifyRequest<{Params: {companyId: string}}>, res: FastifyReply) => {
        try {
            const request = req as ExtendedRequest;
            
            const file = await req.file();
            if (!file) {
                return res.status(400).send({message: 'File is required'});
            }

            const url = await this.uploadService.uploadCompanyBanner(file, req.params.companyId, request.user!);

            res.send({ url, message: 'Company banner uploaded successfully' });
        } catch (error) {
            console.error('Upload error:', error);
            const message = error instanceof Error ? error.message : 'Upload failed';
            res.status(500).send({ message });
        }
    }
}