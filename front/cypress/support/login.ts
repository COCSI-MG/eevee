import { apiUrl } from "./api";
import type { Role } from "./types";

Cypress.Commands.add("login", (role: Role = "admin") => {
  Cypress.log({ name: "login", message: `Logging in as ${role} via API` });
  cy.session(role, () => {
    cy.env([`${role}Password`]).then((env) => {
      cy.request("POST", `${apiUrl()}/auth/login`, {
        email: Cypress.expose(`${role}Email`),
        password: env[`${role}Password`],
      });
    });
  });
});

export {};
