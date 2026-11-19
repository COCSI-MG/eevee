import type { CreatedClass, CreatedUser } from "../../helpers/types";

describe("Class filter", () => {
  let klass: CreatedClass;
  let enrolled: CreatedUser;

  beforeEach(() => {
    cy.login();
    cy.buildUser()
      .then((built) => cy.createUser(built))
      .then((created) => {
        enrolled = created;
        return cy.buildClass();
      })
      .then((built) => cy.createClass(built, [enrolled.id]))
      .then((created) => {
        klass = created;
        cy.visitClasses();
      });
  });

  afterEach(() => {
    cy.deleteClass(klass.id);
    cy.deleteUser(enrolled.id);
  });

  it("filters classes by an existing name", () => {
    cy.filterClasses(klass.name);

    cy.log("Check only the matching class is listed");
    cy.get("tbody tr").should("have.length", 1);
    cy.classRow(klass.name).should("contain.text", klass.description);
  });

  it("does not list any class for a name that does not exist", () => {
    cy.filterClasses(`${klass.name} inexistente`);

    cy.log("Check the empty state message");
    cy.get("tbody tr").should("have.length", 1);
    cy.contains("td", "Nenhuma turma corresponde a sua busca.").should(
      "be.visible",
    );
  });
});
