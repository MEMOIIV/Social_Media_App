"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostRepository = void 0;
const db_repositories_1 = require("./db.repositories");
class PostRepository extends db_repositories_1.DataBaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
}
exports.PostRepository = PostRepository;
