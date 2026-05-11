// tsc to compile
// npx http-server . -c-1 to run server
import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { Semantic } from "./semantic_analysis.js";
import { CodeGen } from "./codeGen.js";
let verbose = true;
function startCompilation() {
    let srcInput = document.getElementById("alert-input");
    let output = document.getElementById("alert-output");
    let message = srcInput === null || srcInput === void 0 ? void 0 : srcInput.value.trim();
    if (output.value.length > 0) {
        output.value += "\n";
        output.value = "";
    }
    // Split the input string into programs
    let programs = message.split("$");
    console.log(programs);
    for (let i = 0; i < programs.length; i++) {
        if (i != programs.length - 1) {
            programs[i] += "$";
        }
    }
    programs.pop();
    output.value += "Starting compilation...\n";
    for (let i = 0; i < programs.length; i++) {
        output.value += `\n\nPROGRAM #${i + 1}\n`;
        output.value += "LEXER - begin lex --------------------\n";
        let lexSuccess = false;
        let parseSuccess = false;
        let semanticSuccess = false;
        // LEX ---------------------------------------------------------------------------------------
        let _Lexer = new Lexer();
        let tokenStream = _Lexer.generateTokens(programs[i]);
        // Prints the token stream if verbose functionality is enabled
        if (verbose) {
            for (let i = 0; i < tokenStream.length; i++) {
                output.value += `\nLEX - ${tokenStream[i].type} [  ${tokenStream[i].value} ] found at (${tokenStream[i].line},${tokenStream[i].index})`;
            }
        }
        // Outputs the warnings, if there are any
        if (_Lexer.warningStream.length > 0) {
            for (let i = 0; i < _Lexer.warningStream.length; i++) {
                output.value += `\n${_Lexer.warningStream[i]}`;
            }
        }
        // Outputs the errors, if there are any
        if (_Lexer.errorStream.length > 0) {
            for (let i = 0; i < _Lexer.errorStream.length; i++) {
                output.value += `\n${_Lexer.errorStream[i]}`;
            }
            // If there are errors, the lex fails and the compilation halts
            output.value += `\n\nLEX COMPLETE with ${_Lexer.errorStream.length} errors and ${_Lexer.warningStream.length} warnings`;
            output.value += `\nLex Failed - error(s) detected`;
        }
        // if the lex succeeds, it moves onto the parse!
        else {
            output.value += `\nLEXER - lex successful with ${_Lexer.errorStream.length} errors and ${_Lexer.warningStream.length} warnings`;
            lexSuccess = true;
        }
        // PARSE ------------------------------------------------------------------------------------
        let _Parser = new Parser();
        if (lexSuccess == true) {
            output.value += "\n\n\nPARSER - beginning parse... -----------------";
            _Parser.parseProgram(tokenStream);
            // Prints the traversal of the production rules used to generate the CST
            if (verbose) {
                for (let i = 0; i < _Parser.cstStepTracer.length; i++) {
                    output.value += `\n${_Parser.cstStepTracer[i]}`;
                }
            }
            if (_Parser.errorStream.length > 0) {
                for (let i = 0; i < _Parser.errorStream.length; i++) {
                    output.value += `\n${_Parser.errorStream[i]}`;
                }
                // output.value += `\n\nPARSE COMPLETE with ${_Parser.errorStream.length} errors`;
                output.value += `\nParse Failed - ${_Parser.errorStream.length} error(s) detected`;
            }
            else {
                output.value += `\n\nPARSER - parse successful with ${_Parser.errorStream.length} errors detected`;
                // Prints the parse tree after the parse succeeds
                output.value += "\n\nCONCRETE SYNTAX TREE";
                output.value += `\n${_Parser.cst.printTree()}`;
                parseSuccess = true;
            }
        }
        // SEMANTIC ANALYSIS ------------------------------------------------------------------------
        if (parseSuccess == true) {
            output.value += "\n\nSEMANTIC - beginning semantic analysis... -------------";
            // create semantic analysis object and initialize success variable
            let _Sem = new Semantic(_Parser.cst);
            _Sem.startSem();
            console.log(_Sem.ast);
            console.log(_Sem.symbolTable.printTable());
            // Prints the traversal of the production rules used to generate the CST
            if (verbose) {
                for (let i = 0; i < _Sem.astStepTracer.length; i++) {
                    output.value += `\n${_Sem.astStepTracer[i]}`;
                }
            }
            // Checks for any errors and prints them out
            if (_Sem.symbolTable.errors.length > 0) {
                for (let i = 0; i < _Sem.symbolTable.errors.length; i++) {
                    output.value += `\n${_Sem.symbolTable.errors[i]}`;
                }
                output.value += `\nSemantic Analysis Failed - ${_Sem.symbolTable.errors.length} error(s) detected`;
            }
            else // if there are no errors, proceed to code gen!
             {
                output.value += "\n\nSEMANTIC - success\n";
                semanticSuccess = true;
                output.value += "\nABSTRACT SYNTAX TREE\n" + _Sem.ast.printTree();
                for (let i = 0; i < _Sem.symbolTable.stepTracer.length; i++) {
                    output.value += `\n${_Sem.symbolTable.stepTracer[i]}`;
                }
                output.value += "\nSYMBOL TABLE\n" + _Sem.symbolTable.printTable();
                console.log(_Sem.symbolTable.errors);
            }
            // CODE GEN ---------------------------------------------------------------------------------
            if (semanticSuccess == true) {
                output.value += "\n\nCODE GEN - beginning code generation... -------------";
                console.log("call me brian gormanly the way i 65 this 02");
                let _codeGen = new CodeGen(_Sem.ast, _Sem.symbolTable);
                let machineCode = _codeGen.generateMachineCode();
                if (_codeGen.errors.length > 0) {
                    for (let i = 0; i < _codeGen.errors.length; i++) {
                        output.value += `\n${_codeGen.errors[i]}`;
                        output.value += `\nCode Generation Failed - ${_codeGen.errors.length} error(s) detected`;
                    }
                }
                else {
                    output.value += "\n\nPROGRAM\n\n";
                    output.value += machineCode;
                    output.value += "\n\nCode Generation successful with 0 errors detected.";
                    output.value += `\n\nCompilation of Program #${i + 1} successful.\n\n`;
                }
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
    const verboseBtn = document.getElementById("verbose-btn");
    const verboseLabel = document.getElementById("verbose-label");
    if (verboseBtn) {
        verboseBtn.addEventListener("click", () => {
            verbose = !verbose;
            verboseBtn.textContent = verbose ? "Verbose Functionality: ON" : "Verbose Functionality: OFF";
            verboseBtn.className = verbose ? "toggle-on" : "toggle-off";
        });
    }
}
init();
//# sourceMappingURL=main.js.map