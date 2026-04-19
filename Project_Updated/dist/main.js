// tsc to compile
// npx http-server . -c-1 to run server
import { Lexer } from "./lexer.js";
function startCompilation() {
    let program = document.getElementById("alert-input");
    let output = document.getElementById("alert-output");
    let message = program === null || program === void 0 ? void 0 : program.value.trim();
    if (output.value.length > 0) {
        output.value += "\n";
    }
    output.value += "Starting compilation...\n";
    output.value += "LEXER - begin lex\n";
    let newLexer = new Lexer();
    let lexTest = newLexer.generateTokens(message);
    output.value += lexTest;
    output.value += "\nLEXER - lex complete";
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