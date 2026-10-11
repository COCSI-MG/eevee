import type { CreatedUser } from "../../helpers/types";

describe("User deactivation", () => {
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

  it("deactivates a user after confirming the dialog", () => {
    const { email } = user!;
    cy.filterUsers(email);

    cy.log("Open the row menu and choose deactivate");
    cy.userRow(email).find("button").click();
    cy.contains('[role="menuitem"]', "Desativar").click();

    cy.log("Confirm the deactivation dialog");
    cy.get('[role="alertdialog"]')
      .should("contain.text", "Desativar esta conta?")
      .contains("button", "Desativar conta")
      .click();

    cy.log("Check the success toast and that the user left the list");
    cy.contains("Conta desativada").should("be.visible");
    cy.contains("td", email)
      .should("not.exist")
      .then(() => {
        user = undefined;
      });
  });
});
