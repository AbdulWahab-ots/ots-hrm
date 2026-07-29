import { injectable } from "tsyringe";
import { Announcement } from "../entities";
import { IAnnouncementResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class AnnouncementRepository extends GenericRepository<Announcement, IAnnouncementResponse> {

    constructor () {
        super(dataSource.getRepository(Announcement));
    }

}
