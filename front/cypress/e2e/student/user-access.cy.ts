import { apiUrl } from "../../support/api";

describe("User management as a student", () => {
  beforeEach(() => {
    cy.login("student");
  });

  const shouldBeRedirectedToClasses = () => {
    cy.log("Check the student lands on their classes page");
    cy.location("pathname").should("eq", "/classes");
    cy.contains("h1", "Suas turmas").should("be.visible");
  };

  it("redirects the student away from the users list", () => {
    cy.intercept("GET", "**/user/paginated*").as("paginatedUsers");

    cy.log("Open the users list");
    cy.visit("/admin/users");

    shouldBeRedirectedToClasses();
    cy.contains("h1", "Usuários").should("not.exist");
    cy.get("@paginatedUsers.all").should("have.length", 0);
  });

  it("redirects the student away from the new user form", () => {
    cy.log("Open the new user form");
    cy.visit("/admin/users/new");

    shouldBeRedirectedToClasses();
    cy.contains("h1", "Criar Usuário").should("not.exist");
  });

  it("redirects the student away from the edit user form", () => {
    cy.log("Open the edit form of the admin user");
    cy.visit("/admin/users/1");

    shouldBeRedirectedToClasses();
    cy.contains("h1", "Editar Usuário").should("not.exist");
  });

  it("blocks user management requests from a student in the API", () => {
    cy.log("Try to list users");
    cy.request({
      url: `${apiUrl()}/user/paginated`,
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);

    cy.log("Try to create a user");
    cy.request({
      method: "POST",
      url: `${apiUrl()}/user`,
      body: {
        name: "student attempt",
        email: `student-attempt.${Date.now()}@test.local`,
        password: "password12345",
        isAdmin: true,
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });
});
