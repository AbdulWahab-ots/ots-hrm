import { inject, injectable } from "tsyringe";
import { RoleRepository } from "../dal";
import { Role } from "../entities";
import { Actions, IRoleRequest, IRoleResponse, ITokenUser } from "../models";
import { Service } from "./generics/service";
import { AppError } from "../utility/app-error";
import { upperFirst, camelCase } from "lodash";
import { PrivilegeService } from "./privilege-service";
import { Not } from "typeorm";
import { generateCodeFromName, sanitizeString } from "../utility";
@injectable()
export class RoleService extends Service<Role, IRoleResponse, IRoleRequest> {
    constructor(
        @inject('RoleRepository') private readonly roleRepository: RoleRepository,
        @inject('PrivilegeService') private readonly privilegeService: PrivilegeService
    ){
        super(roleRepository, () => new Role);
    }

    async add(request: IRoleRequest, contextUser: ITokenUser): Promise<IRoleResponse> {
        try {

            // let Modules: string[] = ["Users", "Roles"];
            // request.privilegeIds = await this.privilegeService.getPrivilegeIdsByModules(Modules);


            return super.add(request, contextUser);
        } catch (error) {
            throw error;
        }
    }

    async update(id: string, request: IRoleRequest, contextUser: ITokenUser): Promise<IRoleResponse> {
        try {
            let { name } = request;
            name = sanitizeString(name);
            const camelCasedName = generateCodeFromName(name);

            const existing = await this.roleRepository.firstOrDefault({
                where: [
                    { name: name, companyId: contextUser.companyId, id: Not(id) },
                    { code: camelCasedName, companyId: contextUser.companyId, id: Not(id) }
                ]
            });

            if (existing) {
                throw new AppError(`Role with name ${name} already exists`, '409');
            }

            request.code = camelCasedName;

            return super.update(id, request, contextUser);
        } catch (error) {
            throw error;
        }
    }
}
