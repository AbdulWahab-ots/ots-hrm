import { injectable } from "tsyringe";
import { Role } from "../entities";
import { IRoleResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class RoleRepository extends GenericRepository<Role, IRoleResponse> {

    constructor(){
        super(dataSource.getRepository(Role));
    }

}