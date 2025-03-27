const vscode = require("vscode");
const { fetchProblemData } = require("./commands/fetchProblemData");
const { fetchDataToExecute } = require("./commands/executeTestCases");
const { addCustomTestCase } = require("./commands/addCustomTestCase");
const state = require("./state");
const { startServer, stopServer } = require("./server");

async function activate(context) {
  state.outputChannel.show();
  console.log("Extension activated.");

  try {
    await startServer();
    console.log(`Local server started on port 10042`);
    vscode.window.showInformationMessage(
      `CodeAide: Local server started successfully on port 10042`,
      { modal: false }
    );
  } catch (err) {
    console.error("Error starting local server:", err);
    vscode.window.showErrorMessage(
      `CodeAide: Failed to start local server: ${err.message}`,
      { modal: false }
    );
  }

  // Register commands
  let runProblemCommand = vscode.commands.registerCommand("extension.runProblem", fetchProblemData);
  let compileAndRunTestCases = vscode.commands.registerCommand("extension.compileAndRunTestCases", fetchDataToExecute);
  let addCustomTestCaseCommand = vscode.commands.registerCommand("extension.addCustomTestCase", addCustomTestCase);

  context.subscriptions.push(
    runProblemCommand,
    compileAndRunTestCases,
    addCustomTestCaseCommand,
    new vscode.Disposable(() => stopServer().catch(console.error))
  );
}

async function deactivate() {
  if (state.outputChannel) {
    state.outputChannel.dispose();
  }

  try {
    await stopServer();
    console.log("Server stopped during deactivation");
  } catch (err) {
    console.error("Error stopping server during deactivation:", err);
    vscode.window.showErrorMessage(
      "CodeAide: Error stopping local server during deactivation",
      { modal: false }
    );
  }

  console.log("Extension deactivated.");
}

module.exports = { activate, deactivate };
