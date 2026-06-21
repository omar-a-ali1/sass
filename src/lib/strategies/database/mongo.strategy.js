const mongoose = require('mongoose');

class MongoStrategy {
  _model(name) {
    return mongoose.model(name);
  }

  async findOne(model, query, _opts = {}) {
    let q = this._model(model).findOne(query);
    if (_opts.session) q = q.session(_opts.session);
    return q.lean();
  }

  async findById(model, id, _opts = {}) {
    let q = this._model(model).findById(id);
    if (_opts.session) q = q.session(_opts.session);
    return q.lean();
  }

  async find(model, query = {}, _opts = {}) {
    let q = this._model(model).find(query);
    if (_opts.session) q = q.session(_opts.session);
    return q.lean();
  }

  async paginate(model, query = {}, opts = {}) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 20));
    const sort = opts.sort || '-createdAt';
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this._model(model).find(query).sort(sort).skip(skip).limit(limit).lean(),
      this._model(model).countDocuments(query),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  }

  async create(model, data, _opts = {}) {
    if (_opts.session) {
      const doc = new (this._model(model))(data);
      return doc.save({ session: _opts.session });
    }
    return this._model(model).create(data);
  }

  async findByIdAndUpdate(model, id, data, _opts = {}) {
    let q = this._model(model).findByIdAndUpdate(id, data, { new: true });
    if (_opts.session) q = q.session(_opts.session);
    return q.lean();
  }

  async deleteOne(model, query, _opts = {}) {
    let q = this._model(model).deleteOne(query);
    if (_opts.session) q = q.session(_opts.session);
    return q;
  }

  async count(model, query = {}) {
    return this._model(model).countDocuments(query);
  }

  async verify() {
    return mongoose.connection.readyState === 1;
  }

  async truncate(model) {
    await this._model(model).deleteMany({});
  }

  async insertMany(model, docs) {
    return this._model(model).insertMany(docs);
  }

  async softDelete(model, id, _opts = {}) {
    let q = this._model(model).findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
    if (_opts.session) q = q.session(_opts.session);
    return q.lean();
  }

  async restore(model, id, _opts = {}) {
    let q = this._model(model).findByIdAndUpdate(id, { deletedAt: null }, { new: true });
    if (_opts.session) q = q.session(_opts.session);
    return q.lean();
  }

  getModel(name) {
    return this._model(name);
  }

  async aggregate(model, pipeline) {
    return this._model(model).aggregate(pipeline);
  }

  async join(model, joins, query = {}, opts = {}) {
    const joinArr = Array.isArray(joins) ? joins : [joins];
    const page = Math.max(1, opts.page || 1);
    const limit = Math.min(100, Math.max(1, opts.limit || 20));
    const skip = (page - 1) * limit;
    const sort = opts.sort || '-createdAt';

    const lookupStages = joinArr.map(j => ({
      $lookup: {
        from: j.with.toLowerCase() + 's',
        localField: j.local,
        foreignField: j.foreign,
        as: j.as || j.with,
      }
    }));

    const pipeline = [
      { $match: query },
      ...lookupStages,
      { $sort: Object.fromEntries([[sort.replace(/^-/, ''), sort.startsWith('-') ? -1 : 1]]) },
      { $skip: skip },
      { $limit: limit },
    ];

    const [data, countResult] = await Promise.all([
      this._model(model).aggregate(pipeline),
      this._model(model).countDocuments(query),
    ]);

    return {
      data,
      total: countResult,
      page,
      limit,
      totalPages: Math.ceil(countResult / limit) || 1,
    };
  }

  async withTransaction(callback) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const trx = new Proxy(this, {
        get: (target, prop) => {
          const orig = Reflect.get(target, prop);
          if (typeof orig !== 'function') return orig;
          return (...args) => orig.call(target, ...args, { session });
        }
      });
      const result = await callback(trx);
      await session.commitTransaction();
      return result;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }
}

module.exports = MongoStrategy;