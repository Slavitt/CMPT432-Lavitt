import { Node } from "./Node.js";
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
}
export class Semantic {
    constructor(cst) {
        this.cst = cst;
        this.ast = new AST();
    }
    startSem() {
        if (this.cst.root != null) {
            this.visit(this.cst.root);
        }
        return this.ast;
    }
    // Recursively parses through the CST
    // starting at the root
    visit(node) {
        switch (node.kind) {
            case "Block":
                this.abstractBlock(node);
                break;
            case "VarDecl":
                this.abstractVarDecl(node);
                break;
            case "AssignmentStatement":
                this.abstractAssignmentStatement(node);
                break;
            case "PrintStatement":
                this.abstractPrintStatement(node);
                break;
            case "IfStatement":
                this.abstractIfStatement(node);
                break;
            case "WhileStatement":
                this.abstractWhileStatement(node);
                break;
            default:
                for (const c of node.children) {
                    this.visit(c);
                }
                break;
        }
    }
    abstractBlock(n) {
        console.log("SEMANTIC - abstractBlock()");
        this.ast.addNode("branch", "Block");
        for (const c of n.children) {
            this.visit(c);
        }
        this.ast.moveUp();
    }
    abstractVarDecl(n) {
        this.ast.addNode("branch", "VarDecl");
        let typeNode = this.findChild(n, "type");
        let idNode = this.findChild(n, "id");
        if (typeNode) {
            this.ast.addNode("leaf", typeNode.name);
        }
        if (idNode) {
            this.ast.addNode("leaf", idNode.name);
        }
        this.ast.moveUp();
    }
    abstractAssignmentStatement(n) {
        this.ast.moveUp();
    }
    abstractPrintStatement(n) {
        this.ast.moveUp();
    }
    abstractIfStatement(n) {
        this.ast.moveUp();
    }
    abstractWhileStatement(n) {
        this.ast.moveUp();
    }
    // Helper Functions
    findChild(node, name) {
        var _a;
        return (_a = node.children.find(c => c.name === name)) !== null && _a !== void 0 ? _a : null;
    }
}
//# sourceMappingURL=semantic_analysis.js.map