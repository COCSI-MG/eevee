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

const requestLogin = (
  email: string,
  password: string,
  retries = 1,
): Cypress.Chainable<Cypress.Response<unknown>> =>
  cy
    .request({
      method: "POST",
      url: `${apiUrl()}/auth/login`,
      body: { email, password },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status !== 429 || retries === 0) {
        return cy.wrap(response, { log: false });
      }
      const seconds = Number(response.headers["retry-after"]) || 60;
      cy.log(`Login rate limit reached, waiting ${seconds}s`);
      cy.wait((seconds + 1) * 1000);
      return requestLogin(email, password, retries - 1);
    });

Cypress.Commands.add("loginWith", (email: string, password: string) => {
  Cypress.log({ name: "loginWith", message: `Logging in as ${email} via API` });
  return requestLogin(email, password);
});

export {};
