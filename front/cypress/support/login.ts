import { apiUrl } from "./api";

Cypress.Commands.add("login", () => {
  Cypress.log({ name: "login", message: "Logging in as admin via API" });
  cy.session("admin", () => {
    cy.env(["adminPassword"]).then(({ adminPassword }) => {
      cy.request("POST", `${apiUrl()}/auth/login`, {
        email: Cypress.expose("adminEmail"),
        password: adminPassword,
      });
    });
  });
});

export {};
