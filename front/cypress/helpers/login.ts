import { apiUrl } from "./api";
import type { Role } from "./types";

Cypress.Commands.add("login", (role: Role = "admin") => {
  Cypress.log({ name: "login", message: `Logging in as ${role} via API` });
  cy.session(
    role,
    () => {
      cy.env([`${role}Password`]).then((env) => {
        cy.request("POST", `${apiUrl()}/auth/login`, {
          email: Cypress.expose(`${role}Email`),
          password: env[`${role}Password`],
        });
      });
    },
    { cacheAcrossSpecs: true },
  );
});

Cypress.Commands.add("loginWith", (email: string, password: string) => {
  Cypress.log({ name: "loginWith", message: `Logging in as ${email} via API` });
  return cy.request({
    method: "POST",
    url: `${apiUrl()}/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  });
});

export {};
