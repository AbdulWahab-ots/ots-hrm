import { injectable } from "tsyringe";
import { Benefit } from "../entities";
import { IBenefitResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class BenefitRepository extends GenericRepository<Benefit, IBenefitResponse> {

    constructor () {
        super(dataSource.getRepository(Benefit));
    }
    
}
