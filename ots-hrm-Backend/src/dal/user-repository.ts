import { injectable } from "tsyringe";
import { User } from "../entities";
import { IUserResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class UserRepository extends GenericRepository<User,IUserResponse>    {
    constructor(){
        super(dataSource.getRepository(User));
    }

    async existsByEmail(email: string): Promise<boolean> {
        const count = await this.repository.count({ where: { email } });
        return count > 0;
    }

    async existsByUsername(username: string): Promise<boolean> {
        const count = await this.repository.count({ where: { userName: username } });
        return count > 0;
    }

}