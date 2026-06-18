class ActivityLogRepository {
  constructor({ dbStrategy }) {
    this.db = dbStrategy;
  }

  async create(data) {
    return this.db.create('ActivityLog', data);
  }

  async find(query = {}, opts = {}) {
    return this.db.find('ActivityLog', query, opts);
  }

  async paginate(query = {}, opts = {}) {
    return this.db.paginate('ActivityLog', query, opts);
  }

  async findByActor(actorId, opts = {}) {
    return this.db.paginate('ActivityLog', { actor: actorId }, opts);
  }

  async findByResource(resource, resourceId, opts = {}) {
    return this.db.paginate('ActivityLog', { resource, resourceId }, opts);
  }

  async findByAction(action, opts = {}) {
    return this.db.paginate('ActivityLog', { action }, opts);
  }
}

module.exports = ActivityLogRepository;
