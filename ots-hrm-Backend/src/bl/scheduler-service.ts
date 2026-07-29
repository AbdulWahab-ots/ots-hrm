import { inject, injectable } from "tsyringe";
import { SchedulerRepository } from "../dal";
import { Scheduler } from "../entities";
import { ISchedulerRequest, ISchedulerResponse } from "../models";
import { Service } from "./generics/service";

@injectable()
export class SchedulerService extends Service<Scheduler, ISchedulerResponse, ISchedulerRequest> {
    constructor(@inject('SchedulerRepository') private readonly schedulerRepository: SchedulerRepository) {
        super(schedulerRepository, () => new Scheduler())
    }

}
