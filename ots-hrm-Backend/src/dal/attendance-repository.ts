import { injectable } from "tsyringe";
import { IAttendanceResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";
import { Attendance } from '../entities';

@injectable()
export class AttendanceRepository extends GenericRepository<Attendance, IAttendanceResponse> {
    constructor(){
        super(dataSource.getRepository(Attendance));
    }
}