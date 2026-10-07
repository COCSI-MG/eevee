import type { CreatedUser } from "../../support/types";

describe("User deletion", () => {
  let user: CreatedUser;

  beforeEach(() => {
    cy.login();
    cy.buildUser()
      .then((built) => cy.createUser(built))
      .then((created) => {
        user = created;
        cy.visitUsers();
      });
  });

  afterEach(() => {
    cy.deleteUser(user.id);
  });

  it("deletes a user after confirming the dialog", () => {
    cy.filterUsers(user.email);

    cy.log("Open the row menu and choose delete");
    cy.userRow(user.email).find("button").click();
    cy.contains('[role="menuitem"]', "Excluir").click();

    cy.log("Confirm the deletion dialog");
    cy.get('[role="alertdialog"]')
      .should("contain.text", "Excluir este usuário?")
      .contains("button", "Excluir")
      .click();

    cy.log("Check the success toast and that the user left the list");
    cy.contains("Usuário excluído").should("be.visible");
    cy.contains("td", user.email).should("not.exist");
  });
});
