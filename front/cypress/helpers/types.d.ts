export type Role = "admin" | "student";

export type UserRole = "aluno" | "professor" | "admin";

export interface TestUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreatedUser extends TestUser {
  id: number;
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(role?: Role): Chainable<void>;
      buildUser(role?: UserRole): Chainable<TestUser>;
      createUser(user: TestUser): Chainable<CreatedUser>;
      deleteUser(id: number): Chainable<void>;
      visitUsers(): Chainable<void>;
      filterUsers(term: string): Chainable<void>;
      userRow(email: string): Chainable<JQuery<HTMLTableRowElement>>;
    }
  }
}
