const vscode = require("vscode");
const { fetchProblemData } = require("./commands/fetchProblemData");
const { fetchDataToExecute } = require("./commands/executeTestCases");
const { addCustomTestCase } = require("./commands/addCustomTestCase");
const state = require("./state");
const { startServer, stopServer } = require("./server");

function activate(context) {
  state.outputChannel.show();
  console.log("Extension activated.");

  // Start the Express server on port 10042
  startServer()
    .then(() => {
      console.log("Local server started on port 10042");
      vscode.window.showInformationMessage(
        "CodeAide: Local server started successfully on port 10042",
        { modal: false }
      );
    })
    .catch((err) => {
      console.error("Error starting local server:", err);
      
      let errorMessage = `Failed to start local server: ${err.message}`;
      if (err.code === 'EADDRINUSE') {
        errorMessage = `Port 10042 is already in use. Please close the conflicting application or configure CodeAide to use a different port.`;
      }
      
      vscode.window.showErrorMessage(
        `CodeAide: ${errorMessage}`,
        { modal: true, detail: "The extension may not function properly without the local server." }
      ).then(selection => {
        if (selection === 'Configure Port') {
          // You could add logic here to let users change the port
          vscode.window.showInputBox({
            prompt: "Enter alternative port number",
            value: "10042"
          }).then(newPort => {
            // Handle port change logic here
          });
        }
      });
    });

  // Register commands
  let runProblemCommand = vscode.commands.registerCommand("extension.runProblem", fetchProblemData);
  let compileAndRunTestCases = vscode.commands.registerCommand("extension.compileAndRunTestCases", fetchDataToExecute);
  let addCustomTestCaseCommand = vscode.commands.registerCommand("extension.addCustomTestCase", addCustomTestCase);

  context.subscriptions.push(
    runProblemCommand,
    compileAndRunTestCases,
    addCustomTestCaseCommand,
    {
      dispose: () => {
        stopServer()
          .then(() => {
            vscode.window.showInformationMessage(
              "CodeAide: Local server stopped",
              { modal: false }
            );
          })
          .catch((err) => {
            console.error("Error stopping server:", err);
            vscode.window.showErrorMessage(
              "CodeAide: Error stopping local server",
              { modal: false }
            );
          });
      }
    }
  );
}

function deactivate() {
  if (state.outputChannel) {
    state.outputChannel.dispose();
  }
  
  stopServer()
    .then(() => {
      console.log("Server stopped during deactivation");
    })
    .catch((err) => {
      console.error("Error stopping server during deactivation:", err);
      vscode.window.showErrorMessage(
        "CodeAide: Error stopping local server during deactivation",
        { modal: false }
      );
    });
  
  console.log("Extension deactivated.");
}

module.exports = { activate, deactivate };