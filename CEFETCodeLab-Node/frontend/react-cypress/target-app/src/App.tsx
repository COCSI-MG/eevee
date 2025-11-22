import "./App.css";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Mock Page for Testing</h1>
      <p>Test page</p>
      <input type="text" id="test-input" placeholder="Enter some text" />
      <button id="test-button" onClick={() => alert("Mock button clicked!")}>
        Click Me
      </button>
      <div
        id="message-area"
        style={{ marginTop: "10px", border: "1px solid #ccc", padding: "10px" }}
      >
        Messages will appear here.
      </div>
    </div>
  );
}

export default App;
