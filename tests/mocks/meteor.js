class FakeMeteor {
  constructor() {
    this.isServer = false;
    this.isClient = true;
    this.userId = false;
    this.user = undefined;
  }

  fakeLogin(userId) {
    this.userId = userId;
    this.user = { _id: userId };
  }

  fakeLogout() {
    this.userId = false;
    this.user = undefined;
  }
}

export const Meteor = new FakeMeteor();
