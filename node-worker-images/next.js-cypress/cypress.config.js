/** @type {import('cypress').CypressConfig} */
module.exports = {
  video: false,
  e2e: {
    baseUrl: "http://127.0.0.1:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: false,
  },
};
