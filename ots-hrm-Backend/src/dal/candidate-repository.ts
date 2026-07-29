import { injectable } from "tsyringe";
import { Candidate } from "../entities";
import { ICandidateResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class CandidateRepository extends GenericRepository<Candidate, ICandidateResponse> {
    constructor() {
        super(dataSource.getRepository(Candidate));
    }
}
