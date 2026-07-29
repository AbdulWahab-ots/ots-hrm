import { inject, injectable } from "tsyringe";
import { CandidateRepository } from "../dal";
import { Candidate } from "../entities";
import { ICandidateRequest, ICandidateResponse, ITokenUser } from "../models";
import { Service } from "./generics/service";

@injectable()
export class CandidateService extends Service<Candidate, ICandidateResponse, ICandidateRequest> {
    constructor(
        @inject('CandidateRepository') private readonly candidateRepository: CandidateRepository,
    ) {
        super(candidateRepository, () => new Candidate());
    }

    // PATCH updates only the provided fields. When the stage changes, stamp `date`
    // with today (spec 3.1) so the board reflects the last movement.
    async update(id: string, request: ICandidateRequest, contextUser: ITokenUser): Promise<ICandidateResponse> {
        if (request.stage !== undefined) {
            request = { ...request, date: new Date().toISOString().slice(0, 10) };
        }
        return super.update(id, request, contextUser);
    }
}
