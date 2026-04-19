// tsc to compile
// npx http-server . -c-1 to run server

import { Lexer } from "./lexer.js";

function startCompilation(): void {
  let program = document.getElementById("alert-input") as HTMLInputElement;
  let output = document.getElementById("alert-output") as HTMLTextAreaElement;
  
  let message = program?.value.trim();

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
 
function init(): void {
  const button = document.getElementById("hello-btn") as HTMLButtonElement;
  if (button) {
    button.addEventListener("click", startCompilation);
  }
}
 
init();