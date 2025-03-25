const vscode = require("vscode");

module.exports = {
  currentProblemData: null,
  workspacePath: "",
  outputChannel: vscode.window.createOutputChannel("Test Cases Output"),
};
