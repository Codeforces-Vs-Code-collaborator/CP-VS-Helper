function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Add Custom Test Case</title>
</head>
<body>
  <form id="testCaseForm">
    <label for="input">Test Case Input:</label><br>
    <textarea id="input" rows="6" cols="50" placeholder="Enter test case input"></textarea><br>
    <label for="output">Test Case Output:</label><br>
    <textarea id="output" rows="6" cols="50" placeholder="Enter test case output"></textarea><br><br>
    <button type="button" id="submit">Submit</button>
    <button type="button" id="cancel">Cancel</button>
  </form>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('submit').addEventListener('click', () => {
      const input = document.getElementById('input').value;
      const output = document.getElementById('output').value;
      if (!input || !output) {
        alert("Both fields must be filled!");
        return;
      }
      vscode.postMessage({ command: 'submit', data: { input, output }});
    });
    document.getElementById('cancel').addEventListener('click', () => {
      vscode.postMessage({ command: 'cancel' });
    });
  </script>
</body>
</html>`;
}

module.exports = { getWebviewContent };
