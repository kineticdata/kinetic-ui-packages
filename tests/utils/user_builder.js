export class UserBuilder {
  constructor() {
    this.user = {
      username: '',
      displayName: '',
    };
  }

  stub() {
    this.user.username = 'mock.user';
    this.user.displayName = 'Mock User';

    return this;
  }

  withUsername(username) {
    this.user.username = username;
    return this;
  }

  withAttribute(name, value, attributeSet) {
    const attribute = {
      name,
      values: value instanceof Array ? value : [value],
    };

    let attributes;

    if (attributeSet) {
      if (typeof this.user[attributeSet] === 'undefined') {
        this.users[attributeSet] = [];
      }
      attributes = this.users[attributeSet];
    } else {
      if (typeof this.user.attributes === 'undefined') {
        this.user.attributes = [];
      }
      attributes = this.user.attributes;
    }

    attributes.push(attribute);
    return this;
  }

  build() {
    return this.user;
  }
}
