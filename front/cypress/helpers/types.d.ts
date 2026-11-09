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

export interface TestClass {
  name: string;
  description: string;
}

export interface CreatedClass extends TestClass {
  id: number;
}

export interface ClassStudent {
  id: number;
  email: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      login(role?: Role): Chainable<void>;
      loginWith(email: string, password: string): Chainable<Cypress.Response<unknown>>;
      buildUser(role?: UserRole): Chainable<TestUser>;
      createUser(user: TestUser): Chainable<CreatedUser>;
      deleteUser(id: number): Chainable<void>;
      visitUsers(): Chainable<void>;
      filterUsers(term: string): Chainable<void>;
      userRow(email: string): Chainable<JQuery<HTMLTableRowElement>>;
      buildClass(): Chainable<TestClass>;
      createClass(klass: TestClass, students: number[]): Chainable<CreatedClass>;
      enrollStudents(klass: CreatedClass, students: number[]): Chainable<void>;
      deleteClass(id: number): Chainable<void>;
      classStudents(id: number): Chainable<ClassStudent[]>;
      seededStudent(): Chainable<ClassStudent>;
      visitClasses(): Chainable<void>;
      filterClasses(term: string): Chainable<void>;
      classRow(name: string): Chainable<JQuery<HTMLTableRowElement>>;
      addStudentToForm(email: string): Chainable<void>;
    }
  }
}
