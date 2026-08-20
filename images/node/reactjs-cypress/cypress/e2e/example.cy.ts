describe("Example Cypress Test", () => {
    beforeEach(() => {
        cy.visit("/");
    });
    it("should have a hello world message", () => {
        cy.contains("Hello, World!").should("be.visible");
    });
});
