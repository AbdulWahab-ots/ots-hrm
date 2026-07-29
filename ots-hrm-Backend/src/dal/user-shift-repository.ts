import { injectable } from "tsyringe";
import { IUserShiftResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { UserShift } from '../entities';

@injectable()
export class UserShiftRepository extends GenericRepository<UserShift, IUserShiftResponse> {
    constructor(){
        super(dataSource.getRepository(UserShift));
    }
}