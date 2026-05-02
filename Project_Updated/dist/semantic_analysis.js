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
        }
    }
    abstractWhileStatement(n) {
    }
    abstractIfStatement(n) {
    }
    abstractPrintStatement(n) {
    }
    abstractAssignmentStatement(n) {
    }
    abstractVarDecl(n) {
    }
    abstractBlock(n) {
    }
}
//# sourceMappingURL=semantic_analysis.js.map