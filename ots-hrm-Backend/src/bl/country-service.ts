import { inject, injectable } from "tsyringe";
import { CountryRepository } from "../dal";
import { Country } from "../entities";
import { ICountryResponse, ICountryRequest} from "../models";
import { Service } from "./generics/service";

@injectable()
export class CountryService extends Service<Country, ICountryResponse, ICountryRequest> {
    constructor(@inject('CountryRepository') private readonly countryRepository: CountryRepository) {
        super(countryRepository, () => new Country());
    }
}
