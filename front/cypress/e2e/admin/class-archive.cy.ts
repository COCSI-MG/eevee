import { apiUrl } from "../../helpers/api";
import type { CreatedClass, CreatedUser } from "../../helpers/types";

// A planilha de casos chama este fluxo de "Deletar turma", mas o app arquiva:
// a turma sai da listagem ativa, o histórico é preservado e um administrador
// pode restaurá-la.
describe("Class archiving", () => {
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

  it("archives a class after confirming the dialog", () => {
    cy.filterClasses(klass.name);

    cy.log("Open the row menu and choose archive");
    cy.classRow(klass.name).find("button").click();
    cy.contains('[role="menuitem"]', "Arquivar").click();

    cy.log("Confirm the archiving dialog");
    cy.get('[role="alertdialog"]')
      .should("contain.text", "O histórico será preservado")
      .contains("button", "Arquivar turma")
      .click();

    cy.log("Check the success toast and that the class left the active list");
    cy.contains("Turma arquivada").should("be.visible");
    cy.contains("td", klass.name).should("not.exist");

    cy.log("Check the API no longer lists the class as active");
    cy.request({
      url: `${apiUrl()}/class/paginated`,
      qs: { page: 1, search: klass.name },
    })
      .its("body.meta.total")
      .should("eq", 0);

    cy.log("Check the class was archived instead of removed");
    cy.request({
      url: `${apiUrl()}/class/paginated`,
      qs: { page: 1, search: klass.name, status: "inactive" },
    })
      .its("body.data")
      .should("have.length", 1);
  });
});
