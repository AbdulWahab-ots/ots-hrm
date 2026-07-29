import { injectable } from "tsyringe";
import { IBreakRequest, IBreakResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { AttendanceBreak } from '../entities';

@injectable()
export class AttendanceBreakRepository extends GenericRepository<AttendanceBreak, IBreakResponse> {
    constructor(){
        super(dataSource.getRepository(AttendanceBreak));
    }
}