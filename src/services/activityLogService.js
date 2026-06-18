class ActivityLogService {
  constructor({ activityLogRepository }) {
    this.repo = activityLogRepository;
  }

  async log({ actor, action, resource, resourceId, metadata, ip, userAgent, traceId }) {
    return this.repo.create({ actor, action, resource, resourceId, metadata, ip, userAgent, traceId });
  }

  async list(query = {}, opts = {}) {
    return this.repo.paginate(query, opts);
  }

  async findByActor(actorId, opts = {}) {
    return this.repo.findByActor(actorId, opts);
  }

  async findByResource(resource, resourceId, opts = {}) {
    return this.repo.findByResource(resource, resourceId, opts);
  }
}

module.exports = ActivityLogService;
