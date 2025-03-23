const vscode = require("vscode");
const { fetchProblemData } = require("./commands/fetchProblemData");
const { fetchDataToExecute } = require("./commands/executeTestCases");
const { addCustomTestCase } = require("./commands/addCustomTestCase");
const state = require("./state");

function activate(context) {
  state.outputChannel.show();
  console.log("Extension activated.");

  let runProblemCommand = vscode.commands.registerCommand("extension.runProblem", fetchProblemData);
  let compileAndRunTestCases = vscode.commands.registerCommand("extension.compileAndRunTestCases", fetchDataToExecute);
  let addCustomTestCaseCommand = vscode.commands.registerCommand("extension.addCustomTestCase", addCustomTestCase);

  context.subscriptions.push(runProblemCommand, compileAndRunTestCases, addCustomTestCaseCommand);
}

function deactivate() {
  if (state.outputChannel) {
    state.outputChannel.dispose();
  }
  console.log("Extension deactivated.");
}

module.exports = { activate, deactivate };
