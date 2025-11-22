describe("Mock Page Test", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should display the heading and paragraph", () => {
    cy.contains("h1", "Mock Page for Testing").should("be.visible");
    cy.contains(
      "p",
      "This page is designed to be targeted by Cypress tests."
    ).should("be.visible");
  });

  it("should allow typing into the input field", () => {
    const inputText = "Hello Cypress!";
    cy.get("#test-input").type(inputText).should("have.value", inputText);
  });

  it("should show an alert when the button is clicked", () => {
    cy.get("#test-button").click();
  });

  it("should have a message area", () => {
    cy.get("#message-area")
      .should("be.visible")
      .and("contain.text", "Messages will appear here.");
  });
});
