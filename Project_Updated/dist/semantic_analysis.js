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
    constructor(cst) {
        this.cst = cst;
        this.ast = new AST();
    }
    startSem() {
        console.log("time for semantic analysis!");
        if (this.cst.root != null) {
            this.visit(this.cst.root);
        }
        return this.ast;
    }
    // Recursively parses through the CST
    // starting at the root
    visit(node) {
        switch (node.name) {
            case "Block":
                console.log("block detected");
                this.abstractBlock(node);
                break;
            case "VarDecl":
                console.log("vardecl detected");
                this.abstractVarDecl(node);
                break;
            case "AssignmentStatement":
                console.log("AssignmentStatement detected");
                this.abstractAssignmentStatement(node);
                break;
            case "PrintStatement":
                console.log("PrintStatement detected");
                this.abstractPrintStatement(node);
                break;
            case "IfStatement":
                console.log("IfStatement detected");
                this.abstractIfStatement(node);
                break;
            case "WhileStatement":
                console.log("WhileStatement detected");
                this.abstractWhileStatement(node);
                break;
            default:
                console.log(`Other node detected: ${node.name}`);
                for (const c of node.children) {
                    console.log(`Visiting node: ${c.name}`);
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
    // DONE with VarDecl
    abstractVarDecl(n) {
        this.ast.addNode("branch", "VarDecl");
        let typeNode = n.children[0];
        let idNode = n.children[1].children[0];
        this.ast.addNode("leaf", typeNode.name);
        this.ast.addNode("leaf", idNode.name);
        this.ast.moveUp();
    }
    abstractAssignmentStatement(n) {
        this.ast.addNode("branch", "AssignmentStatement");
        let idNode = n.children[0].children[0];
        let valNode = this.findChild(n, "value");
        if (idNode) {
            this.ast.addNode("leaf", idNode.name);
        }
        if (valNode) {
            this.ast.addNode("leaf", valNode.name);
        }
        this.ast.moveUp();
    }
    // DONE with PrintStatement
    abstractPrintStatement(n) {
        this.ast.addNode("branch", "PrintStatement");
        let idNode = n.children[2];
        if (idNode) {
            this.ast.addNode("leaf", idNode.name);
        }
        this.ast.moveUp();
    }
    abstractIfStatement(n) {
        console.log("abstractIf()");
        this.ast.addNode("branch", "IfStatement");
        const boolExpr = this.findChildByKind(n, "BooleanExpr");
        if (boolExpr) {
            const typeNode = this.findChild(boolExpr, "type");
            const idNode = this.findChild(boolExpr, "id");
            if (typeNode && idNode) {
                this.ast.addNode("branch", "isEq");
                if (typeNode) {
                    this.ast.addNode("leaf", typeNode.name);
                }
                if (idNode) {
                    this.ast.addNode("leaf", idNode.name);
                }
                this.ast.moveUp();
            }
        }
        const blockNode = this.findChildByKind(n, "Block");
        if (blockNode) {
            this.abstractBlock(blockNode);
        }
        this.ast.moveUp();
    }
    abstractWhileStatement(n) {
        console.log("abstractWhile()");
        this.ast.addNode("branch", "IfStatement");
        const boolExpr = this.findChildByKind(n, "BooleanExpr");
        if (boolExpr) {
            const typeNode = this.findChild(boolExpr, "type");
            const idNode = this.findChild(boolExpr, "id");
            if (typeNode && idNode) {
                this.ast.addNode("branch", "isEq");
                if (typeNode) {
                    this.ast.addNode("leaf", typeNode.name);
                }
                if (idNode) {
                    this.ast.addNode("leaf", idNode.name);
                }
                this.ast.moveUp();
            }
        }
        const blockNode = this.findChildByKind(n, "Block");
        if (blockNode) {
            this.abstractBlock(blockNode);
        }
        this.ast.moveUp();
    }
    // Helper Functions
    findChild(node, name) {
        var _a;
        return (_a = node.children.find(c => c.name === name)) !== null && _a !== void 0 ? _a : null;
    }
    findChildByKind(node, kind) {
        var _a;
        return (_a = node.children.find(c => c.kind === kind)) !== null && _a !== void 0 ? _a : null;
    }
}
/*
VarDecl: [type, id]
AssignmentStatement: [id, "=", Expr]
PrintStatement: ["print", "(", id, ")"]
BooleanExpr: []
 */ 
//# sourceMappingURL=semantic_analysis.js.map