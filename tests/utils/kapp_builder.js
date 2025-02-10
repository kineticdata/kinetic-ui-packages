export class KappBuilder {
  constructor() {
    this.kapp = {
      name: '',
      slug: '',
    };
  }

  stub() {
    this.kapp.name = 'Mock Kapp';
    this.kapp.slug = 'Mock Slug';

    return this;
  }

  withName(name) {
    this.kapp.name = name;
    return this;
  }

  withAttribute(name, value) {
    const attribute = {
      name,
      values: value instanceof Array ? value : [value],
    };

    if (typeof this.kapp.attributes === 'undefined') {
      this.kapp.attributes = [];
    }

    this.kapp.attributes.push(attribute);
    return this;
  }

  build() {
    return this.kapp;
  }
}
