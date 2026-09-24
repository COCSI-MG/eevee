import type { TestUser } from "../support/types";

describe("User creation", () => {
  let user: TestUser;
  let createdId: number | undefined;

  beforeEach(() => {
    cy.login();
    cy.intercept("POST", "**/user").as("createUserRequest");
    cy.log("Open the new user form");
    cy.visit("/admin/users/new");
    cy.contains("h1", "Criar Usuário").should("be.visible");
  });

  afterEach(() => {
    if (createdId) {
      cy.deleteUser(createdId);
      createdId = undefined;
    }
  });

  it("creates a regular user", () => {
    cy.buildUser().then((built) => {
      user = built;
      cy.log("Fill in name, email and password");
      cy.get("#name").type(user.name);
      cy.get("#email").type(user.email);
      cy.get("#password").type(user.password);

      cy.log("Submit the form");
      cy.contains("button", "Criar Usuário").click();
      cy.wait("@createUserRequest").then(({ response }) => {
        createdId = response?.body.id;
      });

      cy.log("Check the success toast and redirect to the users list");
      cy.contains("Usuário criado").should("be.visible");
      cy.location("pathname").should("eq", "/admin/users");

      cy.log("Check the user is listed as a regular user");
      cy.filterUsers(user.email);
      cy.userRow(user.email).should("contain.text", user.name);
      cy.userRow(user.email).should("contain.text", "Usuário");
    });
  });

  it("creates an admin user", () => {
    cy.buildUser(true).then((built) => {
      user = built;
      cy.log("Fill in name, email and password and mark as admin");
      cy.get("#name").type(user.name);
      cy.get("#email").type(user.email);
      cy.get("#password").type(user.password);
      cy.get("#isAdmin").click();

      cy.log("Submit the form");
      cy.contains("button", "Criar Usuário").click();
      cy.wait("@createUserRequest").then(({ response }) => {
        createdId = response?.body.id;
      });

      cy.log("Check the success toast and redirect to the users list");
      cy.contains("Usuário criado").should("be.visible");
      cy.location("pathname").should("eq", "/admin/users");

      cy.log("Check the user is listed as an admin");
      cy.filterUsers(user.email);
      cy.userRow(user.email).should("contain.text", "Administrador");
    });
  });

  it("does not create a regular user without a password", () => {
    cy.buildUser().then((built) => {
      cy.log("Fill in name and email, leaving the password empty");
      cy.get("#name").type(built.name);
      cy.get("#email").type(built.email);

      cy.log("Submit the form");
      cy.contains("button", "Criar Usuário").click();

      cy.log("Check the required password error and that no request was sent");
      cy.contains("Senha é obrigatória").should("be.visible");
      cy.location("pathname").should("eq", "/admin/users/new");
      cy.get("@createUserRequest.all").should("have.length", 0);
    });
  });

  it("does not create an admin user without a password", () => {
    cy.buildUser(true).then((built) => {
      cy.log("Fill in name and email as admin, leaving the password empty");
      cy.get("#name").type(built.name);
      cy.get("#email").type(built.email);
      cy.get("#isAdmin").click();

      cy.log("Submit the form");
      cy.contains("button", "Criar Usuário").click();

      cy.log("Check the required password error and that no request was sent");
      cy.contains("Senha é obrigatória").should("be.visible");
      cy.location("pathname").should("eq", "/admin/users/new");
      cy.get("@createUserRequest.all").should("have.length", 0);
    });
  });
});
