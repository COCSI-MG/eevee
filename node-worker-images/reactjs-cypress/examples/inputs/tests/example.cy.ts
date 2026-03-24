describe("Example Cypress Test", () => {
    beforeEach(() => {
        cy.visit("/");
    });
    it("should have a hello world message", () => {
        cy.get("h1").contains("Hello, World!").should("be.visible");
    });
});
