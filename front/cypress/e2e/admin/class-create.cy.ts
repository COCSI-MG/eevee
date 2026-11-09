import type { ClassStudent } from "../../helpers/types";

describe("Class creation", () => {
  let student: ClassStudent;
  let createdId: number | undefined;

  beforeEach(() => {
    cy.login();
    cy.seededStudent().then((found) => {
      student = found;
    });
    cy.intercept("POST", "**/class").as("createClassRequest");
    cy.log("Open the new class form");
    cy.visit("/admin/classes/new");
    cy.contains("h1", "Criar Turma").should("be.visible");
  });

  afterEach(() => {
    if (createdId) {
      cy.deleteClass(createdId);
      createdId = undefined;
    }
  });

  it("creates a class with name description and a student", () => {
    cy.buildClass().then((klass) => {
      cy.log("Fill in name and description");
      cy.get("#name").type(klass.name);
      cy.get("#description").type(klass.description);

      cy.log("Enroll a student");
      cy.addStudentToForm(student.email);
      cy.contains("Usuários Selecionados (1)").should("be.visible");

      cy.log("Submit the form");
      cy.contains("button", "Criar Turma").click();
      cy.wait("@createClassRequest").then(({ response }) => {
        createdId = response?.body.id;
      });

      cy.log("Check the success toast and redirect to the classes list");
      cy.contains("Turma criada").should("be.visible");
      cy.location("pathname").should("eq", "/admin/classes");

      cy.log("Check the class is listed with its description");
      cy.filterClasses(klass.name);
      cy.classRow(klass.name).should("contain.text", klass.description);

      cy.log("Check the student was enrolled");
      cy.then(() => {
        cy.classStudents(createdId!).should("deep.equal", [
          { id: student.id, email: student.email },
        ]);
      });
    });
  });

  it("does not create a class without a name", () => {
    cy.buildClass().then((klass) => {
      cy.log("Fill in description and student leaving the name empty");
      cy.get("#description").type(klass.description);
      cy.addStudentToForm(student.email);

      cy.log("Submit the form");
      cy.contains("button", "Criar Turma").click();

      cy.log("Check the required name error and that no request was sent");
      cy.contains("Nome da turma é obrigatório").should("be.visible");
      cy.location("pathname").should("eq", "/admin/classes/new");
      cy.get("@createClassRequest.all").should("have.length", 0);
    });
  });
});
