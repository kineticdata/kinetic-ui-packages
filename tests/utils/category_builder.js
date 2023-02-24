export class CategoryBuilder {
  constructor() {
    this.category = {
      name: '',
      slug: '',
    };
  }

  stub() {
    this.category.name = 'Mock Category';
    this.category.slug = 'mock-category';

    return this;
  }

  withName(name) {
    this.category.name = name;
    return this;
  }

  withAttribute(name, value) {
    const attribute = {
      name,
      values: value instanceof Array ? value : [value],
    };

    if (typeof this.category.attributes === 'undefined') {
      this.category.attributes = [];
    }

    this.category.attributes.push(attribute);
    return this;
  }

  build() {
    return this.category;
  }
}
