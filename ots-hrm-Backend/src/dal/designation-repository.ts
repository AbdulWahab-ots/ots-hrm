import { injectable } from "tsyringe";
import { Designation } from "../entities";
import { IDesignationResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class DesignationRepository extends GenericRepository<Designation, IDesignationResponse>   {

    constructor () {
        super(dataSource.getRepository(Designation));
    }
    
}