import { injectable } from "tsyringe";
import { IVerificationResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { Verification } from '../entities/verification';

@injectable()
export class VerificationRepository extends GenericRepository<Verification, IVerificationResponse> {
    constructor(){
        super(dataSource.getRepository(Verification));
    }
}