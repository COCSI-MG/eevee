export interface TestUser {
  name: string;
  email: string;
  password: string;
  isAdmin: boolean;
}

export interface CreatedUser extends TestUser {
  id: number;
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      buildUser(isAdmin?: boolean): Chainable<TestUser>;
      createUser(user: TestUser): Chainable<CreatedUser>;
      deleteUser(id: number): Chainable<void>;
      visitUsers(): Chainable<void>;
      filterUsers(term: string): Chainable<void>;
      userRow(email: string): Chainable<JQuery<HTMLTableRowElement>>;
    }
  }
}
