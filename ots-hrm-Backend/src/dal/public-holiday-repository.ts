import { injectable } from "tsyringe";
import { PublicHoliday } from "../entities";
import { IPublicHolidayResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class PublicHolidayRepository extends GenericRepository<PublicHoliday, IPublicHolidayResponse>   {

    constructor () {
        super(dataSource.getRepository(PublicHoliday));
    }
    
}