import { injectable } from "tsyringe";
import { ToDo } from "../entities";
import { IToDoResponse } from "../models";
import { dataSource } from "./db/db-source";
import { GenericRepository } from "./generics/repository";

@injectable()
export class ToDoRepository extends GenericRepository<ToDo, IToDoResponse>   {

    constructor () {
        super(dataSource.getRepository(ToDo));
    }
    
}