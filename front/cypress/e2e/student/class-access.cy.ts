import { apiUrl } from "../../helpers/api";

// Id que não existe: o AdminGuard precisa barrar antes de a turma ser procurada.
const missingClassId = 999999;

describe("Class management as a student", () => {
  beforeEach(() => {
    cy.login("student");
  });

  const shouldBeRedirectedToClasses = () => {
    cy.log("Check the student lands on their classes page");
    cy.location("pathname").should("eq", "/classes");
    cy.contains("h1", "Suas turmas").should("be.visible");
  };

  it("redirects the student away from the classes list", () => {
    cy.intercept("GET", "**/class/paginated*").as("paginatedClasses");

    cy.log("Open the admin classes list");
    cy.visit("/admin/classes");

    shouldBeRedirectedToClasses();
    cy.contains("h1", "Turmas").should("not.exist");
    cy.get("@paginatedClasses.all").should("have.length", 0);
  });

  it("redirects the student away from the new class form", () => {
    cy.log("Open the new class form");
    cy.visit("/admin/classes/new");

    shouldBeRedirectedToClasses();
    cy.contains("h1", "Criar Turma").should("not.exist");
  });

  it("redirects the student away from the edit class form", () => {
    cy.log("Open the edit form of an existing class");
    cy.visit("/admin/classes/1");

    shouldBeRedirectedToClasses();
    cy.contains("h1", "Editar Turma").should("not.exist");
  });

  it("only lists the classes the student is enrolled in", () => {
    cy.log("The paginated listing is allowed for students and scoped to them");
    cy.request(`${apiUrl()}/auth/me`)
      .its("body.userId")
      .then((userId: number) => {
        cy.request({ url: `${apiUrl()}/class/paginated`, qs: { page: 1 } }).then(
          ({ status, body }) => {
            expect(status).to.eq(200);
            body.data.forEach((klass: { users: { userId: number }[] }) => {
              expect(klass.users.map((user) => user.userId)).to.include(userId);
            });
          },
        );
      });
  });

  it("blocks class management requests from a student in the API", () => {
    cy.log("Try to create a class");
    cy.request({
      method: "POST",
      url: `${apiUrl()}/class`,
      body: {
        name: `Turma do aluno ${Date.now()}`,
        description: "Turma criada por um aluno",
        students: [1],
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);

    cy.log("Try to update a class");
    cy.request({
      method: "PATCH",
      url: `${apiUrl()}/class/${missingClassId}`,
      body: {
        name: `Turma editada pelo aluno ${Date.now()}`,
        description: "Turma editada por um aluno",
        students: [1],
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);

    cy.log("Try to delete a class");
    cy.request({
      method: "DELETE",
      url: `${apiUrl()}/class/${missingClassId}`,
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 403);
  });
});
