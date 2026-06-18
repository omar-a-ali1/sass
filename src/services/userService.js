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

    const result = await this.userRepository.paginate(filters, { page, limit, sort: sortExpr });
    if (result.data) result.data = result.data.map(sanitizeData);
    return result;
  }
}

module.exports = UserService;
