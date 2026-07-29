import { inject, injectable } from "tsyringe";
import { ToDoRepository } from "../dal";
import { ToDo } from "../entities";
import { IToDoRequest, IToDoResponse } from "../models";
import { Service } from "./generics/service";

@injectable()
export class ToDoService extends Service<ToDo, IToDoResponse, IToDoRequest> {
    constructor(@inject('ToDoRepository') private readonly toDoRepository: ToDoRepository) {
        super(toDoRepository, () => new ToDo)
     }

}
