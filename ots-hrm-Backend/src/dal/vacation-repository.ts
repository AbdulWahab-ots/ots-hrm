import { injectable } from "tsyringe";
import { IVacationResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { Vacation } from '../entities';

@injectable()
export class VacationRepository extends GenericRepository<Vacation, IVacationResponse> {
    constructor(){
        super(dataSource.getRepository(Vacation));
    }
}