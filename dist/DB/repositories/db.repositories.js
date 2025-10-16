"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBaseRepository = void 0;
class DataBaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
    async insertMany({ data, }) {
        return (await this.model.insertMany(data));
    }
    async find({ filter, select, options, }) {
        const doc = this.model.find(filter || {}).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        if (options?.limit) {
            doc.limit(options.limit);
        }
        if (options?.skip) {
            doc.skip(options.skip);
        }
        return await doc.exec();
    }
    async paginate({ filter = {}, select = {}, options = {}, page = 1, limit = 5, }) {
        let docsCount = undefined;
        let pages = undefined;
        page = Math.floor(page < 1 ? 1 : page);
        options.limit = Math.floor(limit < 1 || !limit ? 5 : limit);
        options.skip = (page - 1) * limit;
        docsCount = await this.model.countDocuments({
            ...filter,
            freezedAt: { $exists: false },
        });
        pages = Math.ceil(docsCount / options.limit);
        const result = await this.find({ filter, select, options });
        return {
            docsCount,
            pages,
            limit: options.limit,
            currentPage: page,
            result,
        };
    }
    async findOne({ filter, select, options, }) {
        const doc = this.model.findOne(filter, select, options);
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async findById({ id, select, options, }) {
        const doc = this.model.findById(id).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async updateOne({ filter, update, options, }) {
        if (Array.isArray(update)) {
            update.push({
                $set: { __v: { $add: ["$__v", 1] } },
            });
            return await this.model.updateOne(filter, update, options);
        }
        return await this.model.updateOne(filter, { ...update, $inc: { __v: 1 } }, options);
    }
    async findOneAndUpdate({ filter, update, select, options = { new: true, runValidators: true }, }) {
        const doc = this.model
            .findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options)
            .select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async findByIdAndUpdate({ id, update, select, options = { new: true, runValidators: true }, }) {
        const doc = this.model
            .findOneAndUpdate(id, { ...update, $inc: { __v: 1 } }, options)
            .select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async deleteOne({ filter, }) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return await this.model.deleteMany(filter);
    }
    async findOneAndDelete({ filter, }) {
        return await this.model.findOneAndDelete(filter);
    }
}
exports.DataBaseRepository = DataBaseRepository;
