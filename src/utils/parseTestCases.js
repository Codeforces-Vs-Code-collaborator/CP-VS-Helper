function parseExtraTestCases(fileContent) {
    const extraTests = [];
    const regex = /Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=(Input:|$))/g;
    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      const inputPart = match[1].trim();
      const outputPart = match[2].trim();
      if (inputPart && outputPart) {
        extraTests.push({ input: inputPart, output: outputPart });
      }
    }
    return extraTests;
  }
  
  function parseTestCaseInput(input) {
    let normalized = input.replace(/\r\n/g, "\n").trim();
    if (!normalized.endsWith("\n")) {
      normalized += "\n";
    }
    return normalized;
  }
  
  module.exports = { parseExtraTestCases, parseTestCaseInput };
  