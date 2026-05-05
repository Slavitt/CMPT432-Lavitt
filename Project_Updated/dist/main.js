// tsc to compile
// npx http-server . -c-1 to run server
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { Semantic } from "./semantic_analysis.js";
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
    let _Lexer = new Lexer();
    // LEX ---------------------------------------------------------------------------------------
    let tokenStream = _Lexer.generateTokens(message);
    let lexSuccess = false;
    // Outputs the token stream 
    for (let i = 0; i < tokenStream.length; i++) {
        output.value += `\nLEX - ${tokenStream[i].type} [  ${tokenStream[i].value} ] found at (${tokenStream[i].line},${tokenStream[i].index})`;
    }
    // Outputs the warnings, if there are any
    if (_Lexer.warningStream.length > 0) {
        for (let i = 0; i < _Lexer.warningStream.length; i++) {
            output.value += `\n${_Lexer.warningStream[i]}`;
        }
    }
    // Outputs the errors, if there are any ------------------------------
    // If there are errors, the lex fails and the compilation halts
    if (_Lexer.errorStream.length > 0) {
        for (let i = 0; i < _Lexer.errorStream.length; i++) {
            output.value += `\n${_Lexer.errorStream[i]}`;
        }
        output.value += `\n\nLEX COMPLETE with ${_Lexer.errorStream.length} errors and ${_Lexer.warningStream.length} warnings`;
        output.value += `\nLex Failed - error(s) detected`;
    }
    else // if the lex succeeds, it moves onto the parse!
     {
        output.value += "\nLEXER - lex success -----------------";
        lexSuccess = true;
    }
    // PARSE ------------------------------------------------------------------------------------
    let _Parser = new Parser();
    let parseSuccess = false;
    // Begins the parse if the lex was successful
    if (lexSuccess == true) {
        output.value += "\n\nPARSER - beginning parse... -----------------";
        console.log("let's parse!");
        _Parser.parseProgram(tokenStream);
        // Prints the traversal of the production rules used to generate the CST
        for (let i = 0; i < _Parser.parseTree.length; i++) {
            output.value += `\n${_Parser.parseTree[i]}`;
        }
        if (_Parser.errorStream.length > 0) {
            for (let i = 0; i < _Parser.errorStream.length; i++) {
                output.value += `\n${_Parser.errorStream[i]}`;
            }
            // output.value += `\n\nPARSE COMPLETE with ${_Parser.errorStream.length} errors`;
            output.value += `\nParse Failed - ${_Parser.errorStream.length} error(s) detected`;
        }
        else {
            output.value += "\n\nPARSER - parse success";
            // Prints the parse tree after the parse succeeds
            output.value += "\n\nCONCRETE SYNTAX TREE";
            output.value += `\n${_Parser.cst.printTree()}`;
            parseSuccess = true;
        }
        // SEMANTIC ANALYSIS -------------------------------------------------------------
        if (parseSuccess == true) {
            output.value += "\n\nSEMANTIC - beginning semantic analysis... -------------";
            // create semantic analysis object and initialize success variable
            let _Sem = new Semantic(_Parser.cst);
            let semanticSuccess = false;
            _Sem.startSem();
            console.log(_Sem.ast);
            console.log(_Sem.symbolTable.printTable());
            // Checks for any errors and prints them out
            if (_Sem.symbolTable.errors.length > 0) {
                for (let i = 0; i < _Sem.symbolTable.errors.length; i++) {
                    output.value += `\n${_Sem.symbolTable.errors[i]}`;
                }
                output.value += `\Semantic Analysis Failed - ${_Sem.symbolTable.errors.length} error(s) detected`;
            }
            else // if there are no errors, proceed to code gen!
             {
                output.value += "\nSEMANTIC - success -----------------";
                semanticSuccess = true;
                output.value += "\nAST - \n" + _Sem.ast.printTree();
                output.value += "\n\nSYMBOL TABLE - \n" + _Sem.symbolTable.printTable();
            }
        }
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