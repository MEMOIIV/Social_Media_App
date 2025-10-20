"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRepository = void 0;
const db_repositories_1 = require("./db.repositories");
class MessageRepository extends db_repositories_1.DataBaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.MessageRepository = MessageRepository;
