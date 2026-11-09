import { apiUrl } from "./api";
import type { ClassStudent, CreatedClass, TestClass } from "./types";

// O nome da turma passa pelo @NoSpecialCharacters da API, que só aceita
// letras, números, ponto e espaço.
const onlyAllowedCharacters = (value: string) =>
  value.replace(/[^a-zA-ZÀ-ÿ0-9.\s]+/g, " ").replace(/\s+/g, " ").trim();

Cypress.Commands.add("buildClass", () => {
  const testCase = onlyAllowedCharacters(Cypress.currentTest.title);
  const suffix = Date.now();
  const klass: TestClass = {
    name: `Turma ${testCase} ${suffix}`,
    description: `Descrição da turma ${suffix}`,
  };
  Cypress.log({ name: "buildClass", message: `Built class ${klass.name}` });
  return cy.wrap<TestClass>(klass, { log: false });
});

Cypress.Commands.add("createClass", (klass: TestClass, students: number[]) => {
  Cypress.log({
    name: "createClass",
    message: `Creating class ${klass.name} via API`,
  });
  return cy
    .request({
      method: "POST",
      url: `${apiUrl()}/class`,
      body: { ...klass, students },
    })
    .then((response) => ({ ...klass, id: response.body.id }) as CreatedClass);
});

Cypress.Commands.add(
  "enrollStudents",
  (klass: CreatedClass, students: number[]) => {
    Cypress.log({
      name: "enrollStudents",
      message: `Enrolling ${students.length} student(s) in class ${klass.id} via API`,
    });
    cy.request({
      method: "PATCH",
      url: `${apiUrl()}/class/${klass.id}`,
      body: { name: klass.name, description: klass.description, students },
    });
  },
);

Cypress.Commands.add("deleteClass", (id: number) => {
  Cypress.log({
    name: "deleteClass",
    message: `Cleaning up class ${id} via API`,
  });
  cy.request({
    method: "DELETE",
    url: `${apiUrl()}/class/${id}`,
    failOnStatusCode: false,
  });
});

Cypress.Commands.add("classStudents", (id: number) => {
  return cy
    .request({ method: "GET", url: `${apiUrl()}/class/${id}` })
    .then(({ body }) =>
      (body.userClasses ?? []).map(
        (userClass: { userId: number; user: { email: string } }) => ({
          id: userClass.userId,
          email: userClass.user.email,
        }),
      ) as ClassStudent[],
    );
});

Cypress.Commands.add("seededStudent", () => {
  const email = Cypress.expose("studentEmail") as string;
  return cy
    .request({ method: "GET", url: `${apiUrl()}/user` })
    .then(({ body }) => {
      const student = (body as Array<{ id: number; email: string }>).find(
        (user) => user.email === email,
      );
      expect(student, `seeded student ${email}`).to.not.be.undefined;
      return student as { id: number; email: string };
    });
});

Cypress.Commands.add("visitClasses", () => {
  Cypress.log({ name: "visitClasses", message: "Opening the classes list" });
  cy.visit("/admin/classes");
  cy.contains("h1", "Turmas").should("be.visible");
});

Cypress.Commands.add("filterClasses", (term: string) => {
  Cypress.log({
    name: "filterClasses",
    message: `Filtering classes by "${term}"`,
  });
  cy.intercept("GET", "**/class/paginated*").as("paginatedClasses");
  cy.get('input[aria-label="Filtrar turmas por nome ou descrição"]')
    .clear()
    .type(term);
  cy.wait("@paginatedClasses");
});

Cypress.Commands.add("classRow", (name: string) => {
  return cy.contains("td", name).parents("tr");
});

Cypress.Commands.add("addStudentToForm", (email: string) => {
  Cypress.log({
    name: "addStudentToForm",
    message: `Adding student ${email} in the class form`,
  });
  cy.contains("button", "Adicionar Usuários").click();
  cy.get('input[placeholder="Buscar usuários..."]').clear().type(email);
  cy.contains('[role="option"]', email).click();
});

export {};
