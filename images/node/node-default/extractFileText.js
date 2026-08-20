const fs = require("fs");
const path = require("path");

function readFileAndEscapeLineBreaks(filePath) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    // Replace line breaks with escaped line breaks
    const escapedContent = data.replace(/\r?\n|\r/g, "\\n");
    console.log(escapedContent);
  });
}

// Replace 'input.txt' with the path to your file
const filePath = path.join(__dirname, "app.ts");
readFileAndEscapeLineBreaks(filePath);
