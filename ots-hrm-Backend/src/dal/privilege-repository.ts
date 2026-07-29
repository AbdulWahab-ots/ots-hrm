import { injectable } from "tsyringe";
import { Privilege } from "../entities";
import { IPrivilegeResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class PrivilegeRepository extends GenericRepository<Privilege, IPrivilegeResponse> {

    constructor(){
        super(dataSource.getRepository(Privilege));
    }

    async getPrivilegeIdsByModules(modules: string[]): Promise<Privilege[]> {
        const privileges = await this.repository
            .createQueryBuilder("privilege")
            .where("privilege.module IN (:...modules)", { modules })
            .getMany();

        return privileges;
    }

}