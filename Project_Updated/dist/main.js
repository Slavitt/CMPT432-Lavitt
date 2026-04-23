// tsc to compile
// npx http-server . -c-1 to run server
import { Lexer } from "./lexer.js";
function startCompilation() {
    let program = document.getElementById("alert-input");
    let output = document.getElementById("alert-output");
    let message = program === null || program === void 0 ? void 0 : program.value.trim();
    if (output.value.length > 0) {
        output.value += "\n";
        output.value = "";
    }
    output.value += "Starting compilation...\n";
    output.value += "LEXER - begin lex --------------------\n";
    let newLexer = new Lexer();
    let lexTest = newLexer.generateTokens(message);
    for (let i = 0; i < lexTest.length; i++) {
        output.value += `\nLEX - ${lexTest[i].type} [  ${lexTest[i].value} ] found at (${lexTest[i].line},${lexTest[i].index})`;
    }
    output.value += `\n\nLEX COMPLETE with ${newLexer.errorStream.length} errors and ${newLexer.warningStream.length} warnings`;
    if (newLexer.warningStream.length > 0) {
        for (let i = 0; i < newLexer.warningStream.length; i++) {
            output.value += `\n${newLexer.warningStream[i]}`;
        }
    }
    if (newLexer.errorStream.length > 0) {
        for (let i = 0; i < newLexer.errorStream.length; i++) {
            output.value += `\n${newLexer.errorStream[i]}`;
        }
        output.value += `\nLex Failed - error(s) detected`;
    }
    else {
        output.value += "\nLEXER - lex success -----------------";
    }
    output.scrollTop = output.scrollHeight;
}
function init() {
    const button = document.getElementById("hello-btn");
    if (button) {
        button.addEventListener("click", startCompilation);
    }
}
init();
//# sourceMappingURL=main.js.map