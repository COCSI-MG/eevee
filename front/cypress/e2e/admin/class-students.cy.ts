import type { ClassStudent, CreatedClass, CreatedUser } from "../../helpers/types";

describe("Class students", () => {
  let seeded: ClassStudent;

  beforeEach(() => {
    cy.login();
    cy.seededStudent().then((found) => {
      seeded = found;
    });
  });

  describe("in a class that already has a student", () => {
    let klass: CreatedClass;
    let enrolled: CreatedUser;

    const openClassForm = () => {
      cy.intercept("PATCH", `**/class/${klass.id}`).as("updateClassRequest");
      cy.visit(`/admin/classes/${klass.id}`);
      cy.contains("h1", "Editar Turma").should("be.visible");
      cy.get("#name").should("have.value", klass.name);
    };

    beforeEach(() => {
      cy.buildUser()
        .then((built) => cy.createUser(built))
        .then((created) => {
          enrolled = created;
          return cy.buildClass();
        })
        .then((built) => cy.createClass(built, [enrolled.id]))
        .then((created) => {
          klass = created;
        });
    });

    afterEach(() => {
      // Um dos testes termina logado como aluno, que não pode apagar turma.
      cy.login();
      cy.deleteClass(klass.id);
      cy.deleteUser(enrolled.id);
    });

    it("enrolls a student by email and the student sees the class", () => {
      openClassForm();

      cy.log("Search the student by email and enroll them");
      cy.addStudentToForm(seeded.email);
      cy.contains("Usuários Selecionados (2)").should("be.visible");

      cy.log("Save the changes");
      cy.contains("button", "Salvar Alterações").click();
      cy.wait("@updateClassRequest");
      cy.contains("Turma atualizada").should("be.visible");

      cy.log("Check the enrollment was persisted");
      cy.classStudents(klass.id).then((students) => {
        expect(students.map((student) => student.email)).to.include(
          seeded.email,
        );
      });

      cy.log("Check the student sees the class in their own list");
      cy.login("student");
      cy.visit("/classes");
      cy.contains("h1", "Suas turmas").should("be.visible");
      cy.contains(klass.name).should("be.visible");
    });

    // O X de remover aluno fica dentro do <form> e o componente Button não
    // define type, então ele vale como submit: o clique salva a turma na hora,
    // sem passar pelo "Salvar Alterações". Se isso for corrigido, este teste
    // passa a precisar do clique em salvar.
    it("removes a student from the class", () => {
      cy.log("Enroll a second student so the class keeps one after the removal");
      cy.then(() => cy.enrollStudents(klass, [enrolled.id, seeded.id]));

      openClassForm();
      cy.contains("Usuários Selecionados (2)").should("be.visible");

      cy.log("Remove the seeded student from the selection");
      cy.contains("p", seeded.email)
        .closest("div:has(> button)")
        .find("button")
        .click();

      cy.log("Check the class was saved without the removed student");
      cy.wait("@updateClassRequest")
        .its("request.body.students")
        .should("deep.equal", [enrolled.id]);
      cy.contains("Turma atualizada").should("be.visible");

      cy.log("Check only the remaining student is enrolled");
      cy.classStudents(klass.id).should("deep.equal", [
        { id: enrolled.id, email: enrolled.email },
      ]);
    });
  });

  describe("in the new class form", () => {
    beforeEach(() => {
      cy.intercept("POST", "**/class").as("createClassRequest");
      cy.log("Open the new class form");
      cy.visit("/admin/classes/new");
      cy.contains("h1", "Criar Turma").should("be.visible");
    });

    it("does not enroll a student when the email does not exist", () => {
      cy.buildClass().then((built) => {
        cy.get("#name").type(built.name);
        cy.get("#description").type(built.description);

        cy.log("Search a student by an email that does not exist");
        cy.contains("button", "Adicionar Usuários").click();
        cy.get('input[placeholder="Buscar usuários..."]').type(
          `nao.existe.${Date.now()}@test.local`,
        );

        cy.log("Check no user is offered and none gets enrolled");
        cy.contains("Nenhum usuário encontrado.").should("be.visible");
        cy.get("body").type("{esc}");
        cy.contains("Usuários Selecionados (0)").should("be.visible");

        cy.log("Submit the form");
        cy.contains("button", "Criar Turma").click();

        cy.log("Check the class is not created without a student");
        cy.contains("Nenhum aluno selecionado.").should("be.visible");
        cy.location("pathname").should("eq", "/admin/classes/new");
        cy.get("@createClassRequest.all").should("have.length", 0);
      });
    });

    it("does not offer the remove action when the class has no students", () => {
      cy.log("Check the empty state and that there is nothing to remove");
      cy.contains("Usuários Selecionados (0)").should("be.visible");
      cy.contains("Nenhum usuário selecionado").should("be.visible");
      cy.contains("button", "Limpar Tudo").should("not.exist");
    });
  });
});
