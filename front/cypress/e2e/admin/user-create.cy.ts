import { profiles } from "../../helpers/profiles";
import type { TestUser } from "../../helpers/types";

describe("User creation", () => {
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

  const fillForm = (user: TestUser, password: string) => {
    cy.log("Fill in name, email and password and choose the role");
    cy.get("#name").type(user.name);
    cy.get("#email").type(user.email);
    if (password) {
      cy.get("#password").type(password);
    }
    cy.get("#role").select(user.role);
  };

  const submit = () => {
    cy.log("Submit the form");
    cy.contains("button", "Criar Usuário").click();
  };

  const shouldNotCreate = (message: string) => {
    cy.log("Check the validation error and that no request was sent");
    cy.contains(message).should("be.visible");
    cy.location("pathname").should("eq", "/admin/users/new");
    cy.get("@createUserRequest.all").should("have.length", 0);
  };

  profiles.forEach(({ role, label }) => {
    describe(`with the ${label} role`, () => {
      it("creates the user", () => {
        cy.buildUser(role).then((user) => {
          fillForm(user, user.password);
          submit();
          cy.wait("@createUserRequest").then(({ response }) => {
            createdId = response?.body.id;
          });

          cy.log("Check the success toast and redirect to the users list");
          cy.contains("Usuário criado").should("be.visible");
          cy.location("pathname").should("eq", "/admin/users");

          cy.log(`Check the user is listed as ${label}`);
          cy.filterUsers(user.email);
          cy.userRow(user.email).should("contain.text", user.name);
          cy.userRow(user.email).should("contain.text", label);
        });
      });

      it("does not create the user without a password", () => {
        cy.buildUser(role).then((user) => {
          fillForm(user, "");
          submit();
          shouldNotCreate("Senha é obrigatória");
        });
      });

      it("does not create the user with a password shorter than 8 characters", () => {
        cy.buildUser(role).then((user) => {
          fillForm(user, "1234567");
          submit();
          shouldNotCreate("A senha deve ter pelo menos 8 caracteres");
        });
      });
    });
  });
});
