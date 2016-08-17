class FakeCollection {
  constructor(name) {
    this.name = name;
  }

  find() {
    return { fetch: () => [] };
  }

  findOne() {
    return undefined;
  }

  insert() {}

  update() {}
}

// eslint-disable-next-line import/prefer-default-export
export const Mongo = {
  Collection: FakeCollection,
};
