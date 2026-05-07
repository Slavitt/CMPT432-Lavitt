// tsc to compile
// npx http-server . -c-1 to run server

import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { Semantic } from "./semantic_analysis.js";
import { CodeGen } from "./codeGen.js";

function startCompilation(): void 
{
	let program = document.getElementById("alert-input") as HTMLInputElement;
	let output = document.getElementById("alert-output") as HTMLTextAreaElement;
	
	let message = program?.value.trim();

	if (output.value.length > 0) 
	{
		output.value += "\n";
		output.value = "";
	}

	output.value += "Starting compilation...\n";
	output.value += "LEXER - begin lex --------------------\n";

	let lexSuccess = false;
	let parseSuccess = false;
	let semanticSuccess = false;

	// LEX ---------------------------------------------------------------------------------------
	let _Lexer = new Lexer();
	let tokenStream = _Lexer.generateTokens(message);

	// Prints the token stream
	for (let i = 0; i < tokenStream.length; i++)
	{
		output.value += `\nLEX - ${tokenStream[i].type} [  ${tokenStream[i].value} ] found at (${tokenStream[i].line},${tokenStream[i].index})`;
	}

	// Outputs the warnings, if there are any
	if (_Lexer.warningStream.length > 0)
	{
		for (let i = 0; i < _Lexer.warningStream.length; i++)
		{
			output.value += `\n${_Lexer.warningStream[i]}`;
		}
	}

	// Outputs the errors, if there are any
	if (_Lexer.errorStream.length > 0)
	{
		for (let i = 0; i < _Lexer.errorStream.length; i++)
		{
			output.value += `\n${_Lexer.errorStream[i]}`;
		}

		// If there are errors, the lex fails and the compilation halts
		output.value += `\n\nLEX COMPLETE with ${_Lexer.errorStream.length} errors and ${_Lexer.warningStream.length} warnings`
		output.value += `\nLex Failed - error(s) detected`;
	}

	// if the lex succeeds, it moves onto the parse!
	else
	{
		output.value += "\nLEXER - lex success";
		lexSuccess = true;
	}


	// PARSE ------------------------------------------------------------------------------------
	let _Parser = new Parser();

	if (lexSuccess == true)
	{
		output.value += "\n\n\nPARSER - beginning parse... -----------------";
		_Parser.parseProgram(tokenStream);

		// Prints the traversal of the production rules used to generate the CST
		for (let i = 0; i < _Parser.cstStepTracer.length; i++)
		{
			output.value += `\n${_Parser.cstStepTracer[i]}`;
		}

		if (_Parser.errorStream.length > 0)
		{
			for (let i = 0; i < _Parser.errorStream.length; i++)
			{
				output.value += `\n${_Parser.errorStream[i]}`;
			}
			// output.value += `\n\nPARSE COMPLETE with ${_Parser.errorStream.length} errors`;
			output.value += `\nParse Failed - ${_Parser.errorStream.length} error(s) detected`;
		}
		else
		{
			output.value += "\n\nPARSER - parse success";
			
			// Prints the parse tree after the parse succeeds
			output.value += "\n\nCONCRETE SYNTAX TREE"
			output.value += `\n${_Parser.cst.printTree()}`;
			
			parseSuccess = true;
		}
	}

	// SEMANTIC ANALYSIS ------------------------------------------------------------------------
	if (parseSuccess == true)
	{
		output.value += "\n\nSEMANTIC - beginning semantic analysis... -------------";
		
		// create semantic analysis object and initialize success variable
		let _Sem: Semantic = new Semantic(_Parser.cst);

		_Sem.startSem();

		console.log(_Sem.ast);
		console.log(_Sem.symbolTable.printTable());

		// Prints the traversal of the production rules used to generate the CST
		for (let i = 0; i < _Sem.astStepTracer.length; i++)
		{
			output.value += `\n${_Sem.astStepTracer[i]}`;
		}

		// Checks for any errors and prints them out
		if (_Sem.symbolTable.errors.length > 0)
		{
			for (let i = 0; i < _Sem.symbolTable.errors.length; i++)
			{
				output.value += `\n${_Sem.symbolTable.errors[i]}`;
			}
			
			output.value += `\nSemantic Analysis Failed - ${_Sem.symbolTable.errors.length} error(s) detected`;
		}
		else // if there are no errors, proceed to code gen!
		{
			output.value += "\n\nSEMANTIC - success\n";
			semanticSuccess = true;
			output.value += "\nABSTRACT SYNTAX TREE\n" + _Sem.ast.printTree();
			output.value += "\nSYMBOL TABLE\n" + _Sem.symbolTable.printTable();
		}




		// CODE GEN ---------------------------------------------------------------------------------
		if (semanticSuccess == true)
		{
			output.value += "\n\nCODE GEN - beginning code generation... -------------";

			console.log("call me brian gormanly the way i 65 this 02");

			let _codeGen: CodeGen = new CodeGen(_Sem.ast, _Sem.symbolTable);
			let machineCode = _codeGen.generateMachineCode();

			output.value += "\n\nPROGRAM\n\n";
			output.value += machineCode;
			
			/* for (let i = 0; i < machineCode.length; i++)
			{
				output.value += `${machineCode[i]}`;
				if (i % 16 == 0)
				{
					output.value += "\n";
				}
			} */
			
		}




	}

	








	output.scrollTop = output.scrollHeight;
}
 
function init(): void {
	const button = document.getElementById("hello-btn") as HTMLButtonElement;
	if (button) 
	{
		button.addEventListener("click", startCompilation);
	}
}
 
init();