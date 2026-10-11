import type { CreatedUser } from "../../helpers/types";

describe("User deletion", () => {
  let user: CreatedUser | undefined;

  beforeEach(() => {
    user = undefined;
    cy.login();
    cy.buildUser()
      .then((built) => cy.createUser(built))
      .then((created) => {
        user = created;
        cy.visitUsers();
      });
  });

  afterEach(() => {
    if (user) {
      cy.deleteUser(user.id);
      user = undefined;
    }
  });

  it("deletes a user after confirming the dialog", () => {
    const { email } = user!;
    cy.filterUsers(email);

    cy.log("Open the row menu and choose delete");
    cy.userRow(email).find("button").click();
    cy.contains('[role="menuitem"]', "Excluir").click();

    cy.log("Confirm the deletion dialog");
    cy.get('[role="alertdialog"]')
      .should("contain.text", "Excluir este usuário?")
      .contains("button", "Excluir")
      .click();

    cy.log("Check the success toast and that the user left the list");
    cy.contains("Usuário excluído").should("be.visible");
    cy.contains("td", email)
      .should("not.exist")
      .then(() => {
        user = undefined;
      });
  });
});
