import { injectable } from "tsyringe";
import { MasterEnum } from "../entities";
import { IMasterEnumResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class MasterEnumRepository extends GenericRepository<MasterEnum, IMasterEnumResponse> {
    constructor(){
        super(dataSource.getRepository(MasterEnum));
    }

}