"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_repositories_1 = require("./db.repositories");
const err_response_1 = require("../../utils/response/err.response");
class UserRepository extends db_repositories_1.DataBaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async createUser({ data, options, }) {
        const [user] = (await this.create({ data, options })) || [];
        if (!user)
            throw new err_response_1.BadRequestExceptions("fail to created user", {
                cause: { data, options },
            });
        return user;
    }
}
exports.UserRepository = UserRepository;
