export class SpaceBuilder {
  constructor() {
    this.space = {
      name: '',
      slug: '',
    };
  }

  stub() {
    this.space.name = 'Mock Space';
    this.space.slug = 'Mock Slug';

    return this;
  }

  withName(name) {
    this.space.name = name;
    return this;
  }

  withAttribute(name, value) {
    const attribute = {
      name,
      values: value instanceof Array ? value : [value],
    };

    if (typeof this.space.attributes === 'undefined') {
      this.space.attributes = [];
    }

    this.space.attributes.push(attribute);
    return this;
  }

  build() {
    return this.space;
  }
}
