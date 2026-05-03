// tsc to compile
// npx http-server . -c-1 to run server

import { Lexer } from "./lexer.js";
import { Parser } from "./parser.js";
import { Semantic } from "./semantic_analysis.js";

function startCompilation(): void {
	let program = document.getElementById("alert-input") as HTMLInputElement;
	let output = document.getElementById("alert-output") as HTMLTextAreaElement;
	
	let message = program?.value.trim();

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

	// Outputs the token stream --------------------------
	for (let i = 0; i < tokenStream.length; i++)
	{
		output.value += `\nLEX - ${tokenStream[i].type} [  ${tokenStream[i].value} ] found at (${tokenStream[i].line},${tokenStream[i].index})`;
	}

	// Outputs the warnings, if there are any --------------------------
	if (_Lexer.warningStream.length > 0)
	{
		for (let i = 0; i < _Lexer.warningStream.length; i++)
		{
			output.value += `\n${_Lexer.warningStream[i]}`;
		}
	}

	// Outputs the errors, if there are any ------------------------------
	// If there are errors, the lex fails and the compilation halts
	if (_Lexer.errorStream.length > 0)
	{
		for (let i = 0; i < _Lexer.errorStream.length; i++)
		{
			output.value += `\n${_Lexer.errorStream[i]}`;
		}
		output.value += `\n\nLEX COMPLETE with ${_Lexer.errorStream.length} errors and ${_Lexer.warningStream.length} warnings`
		output.value += `\nLex Failed - error(s) detected`;
	}
	else // if the lex succeeds, it moves onto the parse!
	{
		output.value += "\nLEXER - lex success -----------------";
		lexSuccess = true;
	}


	// PARSE ----------------------------------------------------------------------
	let _Parser = new Parser();
	let parseSuccess = false;

	output.value += "\nPARSER - beginning parse... -----------------";

	if (lexSuccess == true)
	{
		console.log("let's parse!");
		_Parser.parseProgram(tokenStream);
	}

	for (let i = 0; i < _Parser.parseTree.length; i++)
	{
		output.value += `\n${_Parser.parseTree[i]}`;
	}

	output.value += `\n${_Parser.cst.printTree()}`;

	if (_Parser.errorStream.length > 0)
	{
		for (let i = 0; i < _Parser.errorStream.length; i++)
		{
			output.value += `\n${_Parser.errorStream[i]}`;
		}
		output.value += `\n\nPARSE COMPLETE with ${_Parser.errorStream.length} errors`;
		output.value += `\nParse Failed - error(s) detected`;
	}
	else
	{
		output.value += "\nPARSER - parse success -----------------";
		parseSuccess = true;
		console.log(_Parser.cst);
	}

	if (parseSuccess == true)
	{
		let _Sem: Semantic = new Semantic(_Parser.cst);
		_Sem.ast = _Sem.startSem();
		console.log(_Sem.ast);
		output.value += "\nAST TREE - \n" + _Sem.ast.printTree();
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