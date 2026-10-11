import { apiUrl } from "../../helpers/api";
import type { CreatedUser } from "../../helpers/types";

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
        role: "admin",
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });

  describe("with an existing user", () => {
    let target: CreatedUser;

    beforeEach(() => {
      cy.login();
      cy.buildUser()
        .then((built) => cy.createUser(built))
        .then((created) => {
          target = created;
        });
      cy.login("student");
    });

    afterEach(() => {
      cy.login();
      cy.deleteUser(target.id);
    });

    const shouldKeepUserUnchanged = () => {
      cy.log("Check as admin that the user was not changed");
      cy.login();
      cy.request(`${apiUrl()}/user/${target.id}`)
        .its("body")
        .should("include", {
          name: target.name,
          email: target.email,
          role: target.role,
        });
    };

    it("blocks a student from updating a user in the API", () => {
      cy.log("Try to update the user");
      cy.request({
        method: "PATCH",
        url: `${apiUrl()}/user/${target.id}`,
        body: { name: "student attempt", role: "admin" },
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);

      shouldKeepUserUnchanged();
    });

    it("blocks a student from deleting a user in the API", () => {
      cy.log("Try to delete the user");
      cy.request({
        method: "DELETE",
        url: `${apiUrl()}/user/${target.id}`,
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);

      shouldKeepUserUnchanged();
    });
  });
});
