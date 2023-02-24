export class TeamBuilder {
  constructor() {
    this.team = {
      name: '',
      slug: '',
    };
  }

  stub() {
    this.team.name = 'Mock Team';
    this.team.slug = 'Mock Slug';

    return this;
  }

  withName(name) {
    this.team.name = name;
    return this;
  }

  withSlug(slug) {
    this.team.slug = slug;
    return this;
  }

  withDescription(description) {
    this.team.description = description;
    return this;
  }

  withAttribute(name, value) {
    const attribute = {
      name,
      values: value instanceof Array ? value : [value],
    };

    if (typeof this.team.attributes === 'undefined') {
      this.team.attributes = [];
    }

    this.team.attributes.push(attribute);
    return this;
  }

  build() {
    return this.team;
  }
}
