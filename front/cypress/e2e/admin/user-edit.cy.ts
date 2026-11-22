import { apiUrl } from "../../helpers/api";
import { profiles } from "../../helpers/profiles";
import type { CreatedUser } from "../../helpers/types";

describe("User edit", () => {
  const newPassword = "newPassword123";
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
    cy.login();
    cy.deleteUser(user.id);
  });

  const save = () => {
    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();
    cy.wait("@updateUserRequest");

    cy.log("Check the success toast and redirect to the users list");
    cy.contains("Usuário atualizado").should("be.visible");
    cy.location("pathname").should("eq", "/admin/users");
  };

  it("updates a user's name, email and password", () => {
    const name = `${user.name} updated`;
    const email = `updated.${user.email}`;

    cy.log("Change name, email and password");
    cy.get("#name").clear().type(name);
    cy.get("#email").clear().type(email);
    cy.get("#password").type(newPassword);
    save();

    cy.log("Check the list shows the new name and email");
    cy.filterUsers(email);
    cy.userRow(email).should("contain.text", name);

    cy.log("Check the password was changed");
    cy.loginWith(email, user.password).its("status").should("eq", 401);
    cy.loginWith(email, newPassword).its("status").should("eq", 201);
  });

  profiles
    .filter(({ role }) => role !== "aluno")
    .forEach(({ role, label }) => {
      it(`changes only the role to ${label}`, () => {
        cy.log(`Choose the ${label} role and leave the other fields as they are`);
        cy.get("#role").select(role);
        save();

        cy.log(`Check the user is listed as ${label}`);
        cy.filterUsers(user.email);
        cy.userRow(user.email).should("contain.text", label);

        cy.log("Check the API kept the name and email");
        cy.request(`${apiUrl()}/user/${user.id}`)
          .its("body")
          .should("include", { name: user.name, email: user.email, role });
      });
    });

  it("keeps the password when it is left blank", () => {
    const name = `${user.name} renamed`;

    cy.log("Change only the name, leaving the password blank");
    cy.get("#name").clear().type(name);
    cy.get("#password").should("have.value", "");
    save();

    cy.log("Check the original password still works");
    cy.loginWith(user.email, user.password).its("status").should("eq", 201);
  });

  it("does not update a user without a name", () => {
    cy.log("Clear the name field");
    cy.get("#name").clear();

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

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();

    cy.log("Check the required email error and that no request was sent");
    cy.contains("E-mail é obrigatório").should("be.visible");
    cy.location("pathname").should("eq", `/admin/users/${user.id}`);
    cy.get("@updateUserRequest.all").should("have.length", 0);
  });
});
