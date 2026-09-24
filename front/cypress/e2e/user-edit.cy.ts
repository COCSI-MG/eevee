import type { CreatedUser } from "../support/types";

describe("User edit", () => {
  let user: CreatedUser;

  beforeEach(() => {
    cy.login();
    cy.buildUser()
      .then((built) => cy.createUser(built))
      .then((created) => {
        user = created;
        cy.intercept("PATCH", `**/user/${user.id}`).as("updateUserRequest");
        cy.log("Open the edit form and wait for the user data to load");
        cy.visit(`/admin/users/${user.id}`);
        cy.contains("h1", "Editar Usuário").should("be.visible");
        cy.get("#name").should("have.value", user.name);
      });
  });

  afterEach(() => {
    cy.deleteUser(user.id);
  });

  it("updates a user's name, email and password", () => {
    const name = `${user.name} updated`;
    const email = `updated.${user.email}`;

    cy.log("Change name, email and password");
    cy.get("#name").clear().type(name);
    cy.get("#email").clear().type(email);
    cy.get("#password").type("newPassword123");

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();
    cy.wait("@updateUserRequest");

    cy.log("Check the success toast and redirect to the users list");
    cy.contains("Usuário atualizado").should("be.visible");
    cy.location("pathname").should("eq", "/admin/users");

    cy.log("Check the list shows the new name and email");
    cy.filterUsers(email);
    cy.userRow(email).should("contain.text", name);
  });

  it("promotes a user to admin", () => {
    const name = `${user.name} admin`;
    const email = `admin.${user.email}`;

    cy.log("Change name, email and password and mark as admin");
    cy.get("#name").clear().type(name);
    cy.get("#email").clear().type(email);
    cy.get("#password").type("newPassword123");
    cy.get("#isAdmin").click();

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();
    cy.wait("@updateUserRequest");

    cy.log("Check the success toast and redirect to the users list");
    cy.contains("Usuário atualizado").should("be.visible");
    cy.location("pathname").should("eq", "/admin/users");

    cy.log("Check the user is listed as an admin");
    cy.filterUsers(email);
    cy.userRow(email).should("contain.text", "Administrador");
  });

  it("does not update a user without a name", () => {
    cy.log("Clear the name field");
    cy.get("#name").clear();
    cy.get("#password").type("newPassword123");

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();

    cy.log("Check the required name error and that no request was sent");
    cy.contains("Nome é obrigatório").should("be.visible");
    cy.location("pathname").should("eq", `/admin/users/${user.id}`);
    cy.get("@updateUserRequest.all").should("have.length", 0);
  });

  it("does not update a user without an email", () => {
    cy.log("Clear the email field");
    cy.get("#email").clear();
    cy.get("#password").type("newPassword123");

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();

    cy.log("Check the required email error and that no request was sent");
    cy.contains("E-mail é obrigatório").should("be.visible");
    cy.location("pathname").should("eq", `/admin/users/${user.id}`);
    cy.get("@updateUserRequest.all").should("have.length", 0);
  });
});
