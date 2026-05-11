import { Node } from "./structures/Node.js";
import { SymbolTable } from "./structures/SymbolTable.js";
// AST Class - pretty much the same thing as the CST
// if you have time: create Tree.ts?
export class AST {
    constructor() {
        this.root = null;
        this.current = null;
    }
    addNode(kind, name) {
        let n = new Node(name, kind, this.current);
        if (this.root == null) {
            this.root = n;
            n.parent = null;
        }
        else {
            n.parent = this.current;
            this.current.children.push(n);
        }
        if (kind != "leaf") {
            this.current = n;
        }
    }
    moveUp() {
        if (this.current != null && this.current.parent != null) {
            this.current = this.current.parent;
        }
    }
    printTree() {
        if (this.root != null) {
            return this.traverse(this.root, 0);
        }
        return "";
    }
    traverse(node, depth) {
        let outputTree = "";
        let dashDepth = "";
        for (let i = 0; i < depth; i++) {
            dashDepth += "-";
        }
        if (node.kind == "leaf") {
            outputTree += `${dashDepth}[${node.name}]\n`;
        }
        else {
            outputTree += `${dashDepth}{${node.name}}\n`;
        }
        for (let n of node.children) {
            outputTree += this.traverse(n, depth + 1);
        }
        return outputTree;
    }
}
export class Semantic {
    // Uses the CST from parse as an attribute
    constructor(cst) {
        this.astStepTracer = [];
        this.cst = cst;
        this.ast = new AST();
        this.symbolTable = new SymbolTable();
    }
    // begins traversing the CST to pick out the "good parts"
    startSem() {
        console.log("time for semantic analysis!");
        if (this.cst.root != null) {
            this.abstractVisit(this.cst.root);
        }
        this.genSymbolTable();
        console.log(this.symbolTable);
    }
    // AST GENERATION ---------------------------------------------------------------------------------
    // Recursively parses through the CST starting at the root
    abstractVisit(node) {
        switch (node.name) {
            case "Block":
                // console.log("block detected");
                this.abstractBlock(node);
                break;
            case "VarDecl":
                // console.log("vardecl detected");
                this.abstractVarDecl(node);
                break;
            case "AssignmentStatement":
                // console.log("AssignmentStatement detected");
                this.abstractAssignmentStatement(node);
                break;
            case "PrintStatement":
                // console.log("PrintStatement detected");
                this.abstractPrintStatement(node);
                break;
            case "IfStatement":
                // console.log("IfStatement detected");
                this.abstractIfStatement(node);
                break;
            case "WhileStatement":
                // console.log("WhileStatement detected");
                this.abstractWhileStatement(node);
                break;
            // If the node is not one of the above statements, it is skipped
            default:
                for (const c of node.children) {
                    this.abstractVisit(c);
                }
                break;
        }
    }
    // Creates a Block node in the AST
    abstractBlock(n) {
        this.astStepTracer.push("AST - abstractBlock()");
        this.ast.addNode("branch", "Block");
        // abstractVisits each child node of the Block node from the CST
        for (const c of n.children) {
            this.abstractVisit(c);
        }
        this.ast.moveUp();
    }
    // Creates a VarDecl node in the AST and leaf nodes for Type and Id
    abstractVarDecl(n) {
        this.astStepTracer.push("AST - abstractVarDecl()");
        this.ast.addNode("branch", "VarDecl");
        let typeNode = n.children[0];
        let idNode = n.children[1].children[0];
        this.ast.addNode("leaf", typeNode.name);
        this.ast.addNode("leaf", idNode.name);
        this.ast.moveUp();
    }
    // Creates an AssignmentStatement node in the AST and leaf nodes for Id and Value
    abstractAssignmentStatement(n) {
        this.astStepTracer.push("AST - abstractAssignmentStatement()");
        this.ast.addNode("branch", "AssignmentStatement");
        let idNode = n.children[0].children[0];
        this.ast.addNode("leaf", idNode.name);
        this.findExpr(n.children[2]);
        this.ast.moveUp();
    }
    // Creates a PrintStatement node in the AST and a leaf node for Id
    abstractPrintStatement(n) {
        this.astStepTracer.push("AST - abstractPrintStatement()");
        this.ast.addNode("branch", "PrintStatement");
        this.findExpr(n.children[2]);
        this.ast.moveUp();
    }
    // Creates an IfStatement node in the AST and branch nodes for isEq and a Block
    abstractIfStatement(n) {
        this.astStepTracer.push("AST - abstractIfStatement()");
        this.ast.addNode("branch", "if");
        this.findBooleanExpr(n.children[1]);
        this.abstractBlock(n.children[2]);
        this.ast.moveUp();
    }
    // Creates an WhileStatement node in the AST and branch nodes for isEq and a Block
    abstractWhileStatement(n) {
        this.astStepTracer.push("AST - abstractWhileStatement()");
        this.ast.addNode("branch", "while");
        this.findExpr(n.children[1]);
        this.ast.moveUp();
        this.abstractBlock(n.children[2]);
        this.ast.moveUp();
    }
    // Helper Functions for AST Generation
    // Searches for and returns the correct Expr type
    findExpr(n) {
        this.astStepTracer.push("AST - findExpr()");
        // IntExpr ----------------------------------------------
        if (n.name == "IntExpr") {
            for (const c of n.children) {
                if (c.kind == "leaf" && c.name != "+") {
                    this.ast.addNode("leaf", c.name);
                }
                else if (c.name == "Expr") {
                    this.findExpr(c);
                }
            }
        }
        // StringExpr ----------------------------------------------
        else if (n.name == "StringExpr") {
            const charList = n.children[1];
            const str = this.concatCharList(charList);
            this.ast.addNode("leaf", `"${str}"`);
        }
        // BooleanExpr ----------------------------------------------
        else if (n.name == "BooleanExpr") {
            this.findBooleanExpr(n);
        }
        // Id ----------------------------------------------
        else if (n.name == "Id") {
            this.ast.addNode("leaf", n.children[0].name);
        }
        // Expr ----------------------------------------------
        else if (n.name == "Expr") {
            this.findExpr(n.children[0]);
        }
    }
    // Assembles a string from the children of a CharList
    concatCharList(n) {
        this.astStepTracer.push("AST - abstractCharList()");
        let result = "";
        for (const c of n.children) {
            if (c.kind == "leaf") {
                result += c.name;
            }
            else {
                result += this.concatCharList(c);
            }
        }
        return result;
    }
    // Helper function to the helper function findExpr()
    // (help-ception?)
    findBooleanExpr(n) {
        this.astStepTracer.push("AST - abstractBlock()");
        if (n.children[0].name === "(") {
            // Check boolop: children[2] is the boolop node (==  or !=)
            const boolop = n.children[2].name; // "==" or "!="
            const nodeLabel = boolop === "==" ? "isEq" : "isNeq";
            this.ast.addNode("branch", nodeLabel);
            this.findExpr(n.children[1]); // left Expr
            this.findExpr(n.children[3]); // right Expr
            this.ast.moveUp();
        }
        else {
            this.ast.addNode("leaf", n.children[0].name);
        }
    }
    // SYMBOL TABLE GENERATION -------------------------------------------------------------------
    genSymbolTable() {
        console.log("building symbol table!");
        if (this.ast.root !== null) {
            this.symbolVisit(this.ast.root);
        }
        this.symbolCheckWarnings();
        return this.symbolTable;
    }
    symbolVisit(node) {
        switch (node.name) {
            case "Block":
                this.symbolVisitBlock(node);
                break;
            case "VarDecl":
                this.symbolVisitVarDecl(node);
                break;
            case "AssignmentStatement":
                this.symbolVisitAssignmentStatement(node);
                break;
            case "PrintStatement":
                this.symbolVisitPrintStatement(node);
                break;
            case "if":
            case "while":
                this.symbolVisitIfWhile(node);
                break;
            case "isEq":
            case "isNeq":
                this.symbolVisitIsEq(node);
                break;
            default:
                for (const c of node.children) {
                    this.symbolVisit(c);
                }
                break;
        }
    }
    symbolVisitBlock(node) {
        this.symbolTable.stepTracer.push("SYMBOL TABLE - visitBlock()");
        this.symbolTable.openScope();
        for (const c of node.children) {
            this.symbolVisit(c);
        }
        this.symbolTable.closeScope();
    }
    symbolVisitVarDecl(node) {
        this.symbolTable.stepTracer.push("SYMBOL TABLE - visitVarDecl()");
        const type = node.children[0].name;
        const id = node.children[1].name;
        if (this.symbolTable.current.lookup(id) !== null) {
            this.symbolThrowError(`Error: variable '${id}' already declared in this scope`);
            console.log(`Error: variable '${id}' already declared in this scope`);
        }
        this.symbolTable.current.addEntry(id, type);
    }
    symbolVisitAssignmentStatement(node) {
        this.symbolTable.stepTracer.push("SYMBOL TABLE - visitAssignmentStatement()");
        const id = node.children[0].name;
        const entry = this.symbolTable.current.lookupAll(id);
        if (entry === null) {
            this.symbolThrowError(`Error: variable '${id}' used before declaration`);
            console.log(`Error: variable '${id}' used before declaration`);
        }
        for (let i = 1; i < node.children.length; i++) {
            const valueNode = node.children[i];
            const valueEntry = this.symbolTable.current.lookupAll(valueNode.name);
            if (valueEntry !== null) {
                if (valueEntry.type !== entry.type) {
                    this.symbolThrowError(`Error: type mismatch — cannot assign '${valueEntry.type}' to '${entry.type}' for variable '${id}'`);
                    console.log("Error: type mismatch");
                }
                valueEntry.isUsed = true;
            }
            else {
                const literalType = this.inferType(valueNode.name);
                if (literalType !== null && literalType !== entry.type) {
                    this.symbolThrowError(`Error: type mismatch — cannot assign '${literalType}' value to '${entry.type}' variable '${id}'`);
                    console.log("Error: type mismatch");
                }
            }
        }
        entry.isInitialized = true;
    }
    symbolVisitPrintStatement(node) {
        this.symbolTable.stepTracer.push("SYMBOL TABLE - visitPrintStatement()");
        const valueNode = node.children[0];
        const entry = this.symbolTable.current.lookupAll(valueNode.name);
        if (entry !== null) {
            entry.isUsed = true;
        }
        else if (this.inferType(valueNode.name) !== null) {
            // Do nothing (input is a literal)
        }
        else {
            this.symbolThrowError(`Error: variable '${valueNode.name}' used before declaration`);
            console.log(`Error: variable '${valueNode.name}' used before declaration`);
        }
    }
    symbolVisitIfWhile(node) {
        for (const c of node.children) {
            this.symbolVisit(c);
        }
    }
    symbolVisitIsEq(node) {
        this.symbolTable.stepTracer.push("SYMBOL TABLE - visitIsEq()");
        const types = [];
        for (const c of node.children) {
            if (c.name === "isEq" || c.name === "isNeq") {
                this.symbolVisitIsEq(c);
            }
            else if (c.kind === "leaf") {
                const entry = this.symbolTable.current.lookupAll(c.name);
                if (entry !== null) {
                    entry.isUsed = true;
                    types.push(entry.type);
                }
                else {
                    types.push(this.inferType(c.name));
                }
            }
        }
        if (types.length === 2 && types[0] !== null && types[1] !== null) {
            if (types[0] !== types[1]) {
                this.symbolThrowError(`Error: type mismatch — cannot compare '${types[0]}' with '${types[1]}'`);
                return;
            }
        }
    }
    symbolCheckWarnings() {
        if (this.symbolTable.root !== null) {
            this.symbolCheckScopeWarnings(this.symbolTable.root);
        }
    }
    symbolCheckScopeWarnings(scope) {
        for (const [id, entry] of scope.table) {
            if (!entry.isInitialized && !entry.isUsed) {
                this.symbolTable.warnings.push(`Warning: variable '${id}' declared but never used`);
            }
            else if (!entry.isInitialized) {
                this.symbolTable.warnings.push(`Warning: variable '${id}' used without being initialized`);
            }
            else if (!entry.isUsed) {
                this.symbolTable.warnings.push(`Warning: variable '${id}' declared and initialized but never used elsewhere`);
            }
        }
        for (const child of scope.children) {
            this.symbolCheckScopeWarnings(child);
        }
    }
    symbolThrowError(message) {
        this.symbolTable.errors.push(message);
    }
    inferType(value) {
        console.log(value);
        // Int: is a number
        if (!isNaN(parseInt(value, 10))) {
            return "int";
        }
        // Boolean: is true or false
        if (value === "true" || value === "false") {
            return "boolean";
        }
        // String: anything else that isn't a variable name (single char would
        // be caught by lookupAll already, so if we're here it's a string literal)
        if (value.startsWith('"')) {
            return "string";
        }
        // Single char could be an undeclared variable — can't infer
        return null;
    }
}
//# sourceMappingURL=semantic_analysis.js.map