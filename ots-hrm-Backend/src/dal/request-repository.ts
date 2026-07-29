import { injectable } from "tsyringe";
import { IRequestResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { Request } from '../entities';

@injectable()
export class RequestRepository extends GenericRepository<Request, IRequestResponse> {
    constructor(){
        super(dataSource.getRepository(Request));
    }
}
