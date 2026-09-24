import { apiUrl } from "./api";
import type { CreatedUser, TestUser } from "./types";

const slug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

Cypress.Commands.add("buildUser", (isAdmin = false) => {
  const testCase = Cypress.currentTest.title;
  const suffix = Date.now();
  const user: TestUser = {
    name: `${testCase} ${suffix}`,
    email: `${slug(testCase)}.${suffix}@test.local`,
    password: "password12345",
    isAdmin,
  };
  Cypress.log({
    name: "buildUser",
    message: `Built ${isAdmin ? "admin" : "regular"} user ${user.email}`,
  });
  return cy.wrap<TestUser>(user, { log: false });
});

Cypress.Commands.add("createUser", (user: TestUser) => {
  Cypress.log({ name: "createUser", message: `Creating user ${user.email} via API` });
  return cy
    .request({
      method: "POST",
      url: `${apiUrl()}/user`,
      body: user,
    })
    .then((response) => ({ ...user, id: response.body.id }) as CreatedUser);
});

Cypress.Commands.add("deleteUser", (id: number) => {
  Cypress.log({ name: "deleteUser", message: `Cleaning up user ${id} via API` });
  cy.request({
    method: "PATCH",
    url: `${apiUrl()}/user/${id}`,
    body: { isAdmin: false },
    failOnStatusCode: false,
  });
  cy.request({
    method: "DELETE",
    url: `${apiUrl()}/user/${id}`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("visitUsers", () => {
  Cypress.log({ name: "visitUsers", message: "Opening the users list" });
  cy.visit("/admin/users");
  cy.contains("h1", "Usuários").should("be.visible");
});

Cypress.Commands.add("filterUsers", (term: string) => {
  Cypress.log({ name: "filterUsers", message: `Filtering users by "${term}"` });
  cy.intercept("GET", "**/user/paginated*").as("paginatedUsers");
  cy.get('input[aria-label="Filtrar usuários por nome ou e-mail"]')
    .clear()
    .type(term);
  cy.wait("@paginatedUsers");
});

Cypress.Commands.add("userRow", (email: string) => {
  return cy.contains("td", email).parents("tr");
});

export {};
