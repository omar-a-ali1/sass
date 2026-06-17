const NotFoundError = require('../errors/NotFoundError');
const sanitizeData = require('../utils/sanitizeData');

class UserService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async get(id) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return sanitizeData(user);
  }

  async list(query) {
    const { page, limit, sort, search, ...filters } = query;
    const sortExpr = sort === 'asc' ? 'createdAt' : '-createdAt';

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    return this.userRepository.paginate(filters, { page, limit, sort: sortExpr });
  }
}

module.exports = UserService;
