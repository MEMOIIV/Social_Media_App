import {
  CreateOptions,
  DeleteResult,
  HydratedDocument,
  Model,
  MongooseUpdateQueryOptions,
  PopulateOptions,
  ProjectionType,
  QueryOptions,
  RootFilterQuery,
  Types,
  UpdateQuery,
  UpdateWriteOpResult,
} from "mongoose";

export abstract class DataBaseRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  // create
  async create({
    data,
    options,
  }: {
    data: Partial<TDocument>[];
    options?: CreateOptions | undefined;
  }): Promise<HydratedDocument<TDocument>[] | undefined> {
    return await this.model.create(data, options);
  }

  // Insert Many
  async insertMany({
    data,
  }: {
    data: Partial<TDocument>[];
  }): Promise<HydratedDocument<TDocument>[]> {
    return (await this.model.insertMany(data)) as HydratedDocument<TDocument>[];
  }

  // Find
  async find({
    // if not find this function return: []
    filter,
    select,
    options,
  }: {
    filter?: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | undefined;
    options?: QueryOptions<TDocument> | undefined;
  }): Promise<any | HydratedDocument<TDocument>[] | []> {
    const doc = this.model.find(filter || {}).select(select || "");
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
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

  // pagination
  async paginate({
    filter = {},
    select = {},
    options = {},
    page = 1,
    limit = 5,
  }: {
    filter?: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | undefined;
    options?: QueryOptions<TDocument> | undefined;
    page?: number;
    limit?: number;
  }) {
    let docsCount: number | undefined = undefined;
    let pages: number | undefined = undefined;
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

  // Find One
  async findOne({
    // return:  doc || null
    filter,
    select,
    options,
  }: {
    filter?: RootFilterQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<any | HydratedDocument<TDocument> | null> {
    const doc = this.model.findOne(filter , select , options);
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  // Find By Id
  async findById({
    id,
    select,
    options,
  }: {
    id: Types.ObjectId;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<any | HydratedDocument<TDocument> | null> {
    const doc = this.model.findById(id).select(select || "");
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  // Update One
  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    options?: MongooseUpdateQueryOptions<TDocument> | null;
  }): Promise<UpdateWriteOpResult> {
    if (Array.isArray(update)) {
      update.push({
        $set: { __v: { $add: ["$__v", 1] } },
      });
      return await this.model.updateOne(filter, update, options);
    }
    return await this.model.updateOne(
      filter,
      { ...update, $inc: { __v: 1 } },
      options
    );
  }

  // Find One and update
  async findOneAndUpdate({
    filter,
    update,
    select,
    options = { new: true, runValidators: true },
  }: {
    filter: RootFilterQuery<TDocument>;
    update: UpdateQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<any | HydratedDocument<TDocument> | null> {
    const doc = this.model
      .findOneAndUpdate(filter, { ...update, $inc: { __v: 1 } }, options)
      .select(select || "");
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  // Find By Id and update
  async findByIdAndUpdate({
    id,
    update,
    select,
    options = { new: true, runValidators: true },
  }: {
    id: Types.ObjectId;
    update: UpdateQuery<TDocument>;
    select?: ProjectionType<TDocument> | null;
    options?: QueryOptions<TDocument> | null;
  }): Promise<any | HydratedDocument<TDocument> | null> {
    const doc = this.model
      .findOneAndUpdate(id, { ...update, $inc: { __v: 1 } }, options)
      .select(select || "");
    if (options?.populate) {
      doc.populate(options.populate as PopulateOptions[]);
    }
    if (options?.lean) {
      doc.lean(options.lean);
    }
    return await doc.exec();
  }

  // Delete One
  async deleteOne({
    filter,
  }: {
    filter: RootFilterQuery<TDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }

  // Delete Many
  async deleteMany({
    filter,
  }: {
    filter: RootFilterQuery<TDocument>;
  }): Promise<DeleteResult> {
    return await this.model.deleteMany(filter);
  }

  // Find One And Delete
  async findOneAndDelete({
    filter,
  }: {
    filter: RootFilterQuery<TDocument>;
  }): Promise<HydratedDocument<TDocument> | null> {
    return await this.model.findOneAndDelete(filter);
  }
}
