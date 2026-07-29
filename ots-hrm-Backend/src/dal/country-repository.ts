import { injectable } from "tsyringe";
import { Country } from "../entities";
import { ICountryResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class CountryRepository extends GenericRepository<Country, ICountryResponse>   {

    constructor () {
        super(dataSource.getRepository(Country));
    }

}