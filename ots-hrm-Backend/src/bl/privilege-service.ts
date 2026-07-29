import { inject, injectable } from "tsyringe";
import { PrivilegeRepository } from "../dal";
import { Privilege } from "../entities";
import { IPrivilegeResponse } from "../models";
import { Service } from "./generics/service";

@injectable()
export class PrivilegeService extends Service<Privilege, IPrivilegeResponse> {

    constructor(@inject('PrivilegeRepository') private readonly privilegeRepository: PrivilegeRepository){
        super(privilegeRepository, () => new Privilege)
    }

    async getPrivilegeIdsByModules(modules: string[]): Promise<string[]> {
        return (await this.privilegeRepository.getPrivilegeIdsByModules(modules)).map(privilege => privilege.id);
    }

}
