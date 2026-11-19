import { apiUrl } from "../../helpers/api";
import type { ClassStudent, CreatedClass, CreatedUser } from "../../helpers/types";

describe("Class edit", () => {
  let klass: CreatedClass;
  let enrolled: CreatedUser;
  let seeded: ClassStudent;

  beforeEach(() => {
    cy.login();
    cy.seededStudent().then((found) => {
      seeded = found;
    });
    cy.buildUser()
      .then((built) => cy.createUser(built))
      .then((created) => {
        enrolled = created;
        return cy.buildClass();
      })
      .then((built) => cy.createClass(built, [enrolled.id]))
      .then((created) => {
        klass = created;
        cy.intercept("PATCH", `**/class/${klass.id}`).as("updateClassRequest");
        cy.log("Open the edit form and wait for the class data to load");
        cy.visit(`/admin/classes/${klass.id}`);
        cy.contains("h1", "Editar Turma").should("be.visible");
        cy.get("#name").should("have.value", klass.name);
      });
  });

  afterEach(() => {
    cy.deleteClass(klass.id);
    cy.deleteUser(enrolled.id);
  });

  it("updates a class name description and students", () => {
    const name = `${klass.name} editada`;
    const description = `${klass.description} editada`;

    cy.log("Change name and description and enroll another student");
    cy.get("#name").clear().type(name);
    cy.get("#description").clear().type(description);
    cy.addStudentToForm(seeded.email);
    cy.contains("Usuários Selecionados (2)").should("be.visible");

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();
    cy.wait("@updateClassRequest");

    cy.log("Check the success toast and redirect to the classes list");
    cy.contains("Turma atualizada").should("be.visible");
    cy.location("pathname").should("eq", "/admin/classes");

    cy.log("Check the new name and description were persisted");
    cy.visit(`/admin/classes/${klass.id}`);
    cy.get("#name").should("have.value", name);
    cy.get("#description").should("have.value", description);

    cy.log("Check both students are enrolled");
    cy.classStudents(klass.id).then((students) => {
      expect(students.map((student) => student.id).sort()).to.deep.equal(
        [enrolled.id, seeded.id].sort(),
      );
    });
  });

  it("updates a class name and description keeping its students", () => {
    const name = `${klass.name} renomeada`;
    const description = `${klass.description} renomeada`;

    cy.log("Change only name and description");
    cy.get("#name").clear().type(name);
    cy.get("#description").clear().type(description);

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();
    cy.wait("@updateClassRequest");

    cy.log("Check the success toast and redirect to the classes list");
    cy.contains("Turma atualizada").should("be.visible");
    cy.location("pathname").should("eq", "/admin/classes");

    cy.log("Check the new name and description were persisted");
    cy.visit(`/admin/classes/${klass.id}`);
    cy.get("#name").should("have.value", name);
    cy.get("#description").should("have.value", description);

    cy.log("Check the enrolled student was kept");
    cy.classStudents(klass.id).should("deep.equal", [
      { id: enrolled.id, email: enrolled.email },
    ]);
  });

  it("does not update a class without a name", () => {
    cy.log("Clear the name field");
    cy.get("#name").clear();

    cy.log("Save the changes");
    cy.contains("button", "Salvar Alterações").click();

    cy.log("Check the required name error and that no request was sent");
    cy.contains("Nome da turma é obrigatório").should("be.visible");
    cy.location("pathname").should("eq", `/admin/classes/${klass.id}`);
    cy.get("@updateClassRequest.all").should("have.length", 0);

    cy.log("Check the original name was kept");
    cy.request(`${apiUrl()}/class/${klass.id}`)
      .its("body.name")
      .should("eq", klass.name);
  });
});
