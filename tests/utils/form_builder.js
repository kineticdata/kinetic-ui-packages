export class FormBuilder {
  constructor() {
    this.form = {
      name: '',
      slug: '',
    };
  }

  stub() {
    this.form.name = 'Mock Form';
    this.form.slug = 'Mock Slug';

    return this;
  }

  withName(name) {
    this.form.name = name;
    return this;
  }

  withAttribute(name, value) {
    const attribute = {
      name,
      values: value instanceof Array ? value : [value],
    };

    if (typeof this.form.attributes === 'undefined') {
      this.form.attributes = [];
    }

    this.form.attributes.push(attribute);
    return this;
  }

  build() {
    return this.form;
  }
}
