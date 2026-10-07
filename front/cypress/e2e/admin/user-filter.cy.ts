import type { CreatedUser } from "../../support/types";

describe("User filter", () => {
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

  it("filters users by name", () => {
    cy.filterUsers(user.name);

    cy.log("Check only the matching user is listed");
    cy.get("tbody tr").should("have.length", 1);
    cy.userRow(user.email).should("contain.text", user.name);
  });
});
