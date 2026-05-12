import { Token } from "./structures/Token.js";
import {Node} from "./structures/Node.js";
/*
TO DO: 
    - error recovery
    - displaying the CST in the textbox
*/

export class CST
{
    root: Node | null;
    current: Node | null;

    constructor()
    {
        this.root = null;
        this.current = null;
    }

    // As seen from the Parse slide deck
    addNode(kind: string, name: string): void
    {
        let n = new Node(name, kind, this.current);

        if (this.root == null)
        {
            this.root = n;
            n.parent = null;
        }
        else
        {
            n.parent = this.current;
            this.current!.children.push(n);
        }

        if (kind != "leaf")
        {
            this.current = n;
        }
    }

    // As seen from the Parse slide deck
    moveUp(): void
    {
        if (this.current != null && this.current.parent != null)
        {
            this.current = this.current.parent;
        }
    }

    // printTree() and traverse(): recursively prints the CST
    printTree(): string
    {
        if (this.root != null)
        {
            return this.traverse(this.root, 0);
        }
        return "";
    }

    traverse(node: Node, depth: number): string
    {
        let outputTree: string = "";
        let dashDepth: string = "";

        for (let i = 0; i < depth; i++)
        {
            dashDepth += "-";
        }

        if (node.kind == "leaf")
        {
            outputTree += `${dashDepth}[${node.name}]\n`
        }
        else
        {
            outputTree += `${dashDepth}{${node.name}}\n`
        }

        for (let n of node.children)
        {
            outputTree += this.traverse(n, depth + 1);
        }

        return outputTree;
    }
}

// Parser Class - recursive descent parser
// Follows the structure from the Parse slide deck
export class Parser
{
    cst: CST = new CST();
    tokenStream: Token[] = [];
    errorStream: string[] = [];
    pos: number = 0;
    cstStepTracer: string[] = [];
    
    constructor() { }

    // Program production
    parseProgram(tokenStream: Token[]): void
    {   
        console.log("let's parse!");
        this.cstStepTracer.push("PARSE - parseProgram()");
        this.tokenStream = tokenStream;
        this.cst.addNode("root", "Program");
        this.parseBlock();
        this.match(["$"]);
        this.cst.moveUp();

        console.log(this.cst);
    }

    // Block production
    parseBlock(): void
    {
        this.cstStepTracer.push("PARSE - parseBlock()");
        this.cst.addNode("branch", "Block");
        this.match(["{"]);
        this.parseStatementList();
        this.match(["}"]);
        this.cst.moveUp();
    }

    // StatementList productions
    parseStatementList(): void
    {
        this.cstStepTracer.push("PARSE - parseStatementList()");
        this.cst.addNode("branch", "StatementList");
        let currentToken = this.tokenStream[this.pos];

        if (["print", "if", "while", "{"].includes(currentToken.value)
            || currentToken.type == "ID"
            || currentToken.type == "VARIABLE TYPE")
        {
            this.parseStatement();
            this.parseStatementList();
        }

        this.cst.moveUp();
    }

    // Statement productions
    parseStatement(): void
    {
        this.cstStepTracer.push("PARSE - parseStatement()");
        this.cst.addNode("branch", "Statement");
        let currentToken = this.tokenStream[this.pos];

        if (currentToken.value == "print")
        {
            this.parsePrintStatement();
        }
        else if (currentToken.type == "ID")
        {
            this.parseAssignmentStatement();
        }
        else if (currentToken.type == "VARIABLE TYPE")
        {
            this.parseVarDecl();
        }
        else if (currentToken.value == "while")
        {
            this.parseWhileStatement();
        }
        else if (currentToken.value == "if")
        {
            this.parseIfStatement();
        }
        else if (currentToken.value == "{")
        {
            this.parseBlock();
        }
        else
        {
            this.errorStream.push(`PARSE ERROR: Unexpected token [ ${currentToken.value} ] at (${currentToken.line}, ${currentToken.index})`);
        }

        this.cst.moveUp();
    }

    // PrintStatement production
    parsePrintStatement(): void
    {
        this.cstStepTracer.push("PARSE - parsePrintStatement()");
        this.cst.addNode("branch", "PrintStatement");
        this.match(["print"]);
        this.match(["("]);
        this.parseExpr();
        this.match([")"]);
        this.cst.moveUp();
    }

    // AssignmentStatement production
    parseAssignmentStatement(): void
    {
        this.cstStepTracer.push("PARSE - parseAssignmentStatement()");
        this.cst.addNode("branch", "AssignmentStatement");
        this.parseId();
        this.match(["="]);
        this.parseExpr();
        this.cst.moveUp();
    }

    // VarDecl production
    parseVarDecl(): void
    {
        this.cstStepTracer.push("PARSE - parseVarDecl()");
        this.cst.addNode("branch", "VarDecl");
        this.match(["int", "string", "boolean"]);
        this.parseId();
        this.cst.moveUp();
    }

    // WhileStatement production
    parseWhileStatement(): void
    {
        this.cstStepTracer.push("PARSE - parseWhileStatement()");
        this.cst.addNode("branch", "WhileStatement");
        this.match(["while"]);
        this.match(["("]);
        this.parseBooleanExpr();
        this.match([")"]);
        this.parseBlock();
        this.cst.moveUp();
    }

    // IfStatement production
    parseIfStatement(): void
    {
        this.cstStepTracer.push("PARSE - parseIfStatement()");
        this.cst.addNode("branch", "IfStatement");
        this.match(["if"]);
        this.match(["("]);
        this.parseBooleanExpr();
        this.match([")"]);
        this.parseBlock();
        this.cst.moveUp();
    }

    // Expr productions
    parseExpr(): void
    {
        this.cstStepTracer.push("PARSE - parseExpr()");
        this.cst.addNode("branch", "Expr");
        let currentToken = this.tokenStream[this.pos];

        if (currentToken.type == "DIGIT")
        {
            this.parseIntExpr();
        }
        else if (currentToken.type == "QUOTE")
        {
            this.parseStringExpr();
        }
        else if (currentToken.value == "(" || currentToken.type == "BOOL_VAL")
        {
            this.parseBooleanExpr();
        }
        else if (currentToken.type == "ID")
        {
            this.parseId();
        }
        else
        {
            this.errorStream.push(`PARSE ERROR: Unexpected token [ ${currentToken.value} ] at (${currentToken.line}, ${currentToken.index})`);
        }

        this.cst.moveUp();
    }

    // IntExpr productions
    parseIntExpr(): void
    {
        this.cstStepTracer.push("PARSE - parseIntExpr()");
        this.cst.addNode("branch", "IntExpr");
        this.match(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

        if (this.tokenStream[this.pos].value == "+")
        {
            this.match(["+"]);
            this.parseExpr();
        }

        this.cst.moveUp();
    }

    // StringExpr production
    parseStringExpr(): void
    {
        this.cstStepTracer.push("PARSE - parseStringExpr()");
        this.cst.addNode("branch", "StringExpr");
        this.match(["\""]);
        this.parseCharList();
        this.match(["\""]);
        this.cst.moveUp();
    }

    // BooleanExpr productions
    parseBooleanExpr(): void
    {
        this.cstStepTracer.push("PARSE - parseBooleanExpr()");
        this.cst.addNode("branch", "BooleanExpr");
        let currentToken = this.tokenStream[this.pos];

        if (currentToken.value == "(")
        {
            this.match(["("]);
            this.parseExpr();
            this.match(["==", "!="]);
            this.parseExpr();
            this.match([")"]);
        }
        else if (currentToken.type == "BOOL_VAL")
        {
            this.match(["true", "false"]);
        }
        else
        {
            this.errorStream.push(`PARSE ERROR: Unexpected token [ ${currentToken.value} ] at (${currentToken.line}, ${currentToken.index})`);
        }

        this.cst.moveUp();
    }

    // Id production
    parseId(): void
    {
        this.cstStepTracer.push("PARSE - parseID()");
        this.cst.addNode("branch", "Id");
        this.match(["a","b","c","d","e","f","g","h","i","j","k","l","m",
                    "n","o","p","q","r","s","t","u","v","w","x","y","z"]);
        this.cst.moveUp();
    }

    // CharList production (change to make recursive)
    parseCharList(): void
    {
        this.cstStepTracer.push("PARSE - parseCharList()");
        this.cst.addNode("branch", "CharList");
        let currentToken = this.tokenStream[this.pos];

        while (currentToken.type == "T_CHAR")
        {
            this.match(["a","b","c","d","e","f","g","h","i","j","k","l","m",
                        "n","o","p","q","r","s","t","u","v","w","x","y","z"," "]);
            currentToken = this.tokenStream[this.pos];
        }


        /* if (currentToken.type == "ID")
        {
            this.match(["a","b","c","d","e","f","g","h","i","j","k","l","m",
                        "n","o","p","q","r","s","t","u","v","w","x","y","z"]);
            this.parseCharList();
        }
        else if (currentToken.type == "SPACE")
        {
            this.match([" "]);
            this.parseCharList();
        } */

        this.cst.moveUp();
    }

    // Match function (processes non-terminals)
    match(expected: string[]): void
    {
        let currentToken = this.tokenStream[this.pos];
        if (expected.includes(currentToken.value))
        {
            this.cst.addNode("leaf", currentToken.value);
            this.pos++;
        }
        else
        {
            this.errorStream.push(`PARSE ERROR: Expected [ ${expected.join(" | ")} ] but found [ ${currentToken.value} ] at (${currentToken.line}, ${currentToken.index})`);
        }
    }
}