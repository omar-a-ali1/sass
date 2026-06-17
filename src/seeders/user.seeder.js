const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

module.exports = {
  model: 'User',
  count: 10,
  generate(i) {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email({ firstName: `user${i}` }).toLowerCase(),
      password: bcrypt.hashSync('password123', 10),
      role: i === 0 ? 'admin' : 'user',
    };
  },
};
