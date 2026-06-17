class DependencyContainer {
  constructor() {
    this.services = new Map();
  }

  register(name, instance) {
    this.services.set(name, instance);
  }

  get(name) {
    if (!this.services.has(name)) {
      throw new Error(`Service ${name} not found`);
    }
    return this.services.get(name);
  }

  has(name) {
    return this.services.has(name);
  }
}

module.exports = DependencyContainer;
