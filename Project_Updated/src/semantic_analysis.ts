import { Node } from "./Node.js";
import { CST } from "./parser.js";

export class AST
{
    root: Node | null;
    current: Node | null;

    constructor()
    {
        this.root = null;
        this.current = null;
    }

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

    moveUp(): void
    {
        if (this.current != null && this.current.parent != null)
        {
            this.current = this.current.parent;
        }
    }

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

export class Semantic
{
    cst: CST;
    ast: AST;

    constructor(cst: CST)
    {
        this.cst = cst;
        this.ast = new AST();
    }

    startSem(): AST
    {
        console.log("time for semantic analysis!");
        if (this.cst.root != null)
        {
            this.visit(this.cst.root);
        }
        return this.ast;
    }

    // Recursively parses through the CST
    // starting at the root
    private visit(node: Node): void
    {
        switch(node.name)
        {
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
                for (const c of node.children)
                {
                    console.log(`Visiting node: ${c.name}`);
                    this.visit(c);
                }
                break;
        }
    }

    private abstractBlock(n: Node) 
    {
        console.log("SEMANTIC - abstractBlock()");

        this.ast.addNode("branch", "Block");

        for (const c of n.children)
        {
            this.visit(c);
        }

        this.ast.moveUp();
    }
    
    // DONE with VarDecl
    private abstractVarDecl(n: Node) 
    {
        this.ast.addNode("branch", "VarDecl");

        let typeNode = n.children[0];
        let idNode = n.children[1].children[0];
        
        this.ast.addNode("leaf", typeNode.name);
        this.ast.addNode("leaf", idNode.name);

        this.ast.moveUp();
    }


    private abstractAssignmentStatement(n: Node) 
    {
        this.ast.addNode("branch", "AssignmentStatement");

        let idNode = n.children[0].children[0];
        let valNode = this.findChild(n, "value");

        if (idNode) {this.ast.addNode("leaf", idNode.name);}
        if (valNode) {this.ast.addNode("leaf", valNode.name);}

        this.ast.moveUp();
    }

    // DONE with PrintStatement
    private abstractPrintStatement(n: Node) 
    {
        this.ast.addNode("branch", "PrintStatement");

        let idNode = n.children[2];

        if (idNode) {this.ast.addNode("leaf", idNode.name);}

        this.ast.moveUp();
    }

    private abstractIfStatement(n: Node) 
    {
        console.log("abstractIf()");
 
        this.ast.addNode("branch", "IfStatement");

        const boolExpr = this.findChildByKind(n, "BooleanExpr");

        if (boolExpr) 
        {
            const typeNode = this.findChild(boolExpr, "type");
            const idNode   = this.findChild(boolExpr, "id");
 
            if (typeNode && idNode) 
            {
                this.ast.addNode("branch", "isEq");
                if (typeNode) {this.ast.addNode("leaf", typeNode.name);}
                if (idNode)   {this.ast.addNode("leaf", idNode.name);}
                this.ast.moveUp();
            }
        }

        const blockNode = this.findChildByKind(n, "Block");
       
        if (blockNode) 
        {
            this.abstractBlock(blockNode);
        }

        this.ast.moveUp();
    }

    private abstractWhileStatement(n: Node) 
    {
        console.log("abstractWhile()");
 
        this.ast.addNode("branch", "IfStatement");

        const boolExpr = this.findChildByKind(n, "BooleanExpr");

        if (boolExpr) 
        {
            const typeNode = this.findChild(boolExpr, "type");
            const idNode   = this.findChild(boolExpr, "id");
 
            if (typeNode && idNode) 
            {
                this.ast.addNode("branch", "isEq");
                if (typeNode) {this.ast.addNode("leaf", typeNode.name);}
                if (idNode)   {this.ast.addNode("leaf", idNode.name);}
                this.ast.moveUp();
            }
        }

        const blockNode = this.findChildByKind(n, "Block");
       
        if (blockNode) 
        {
            this.abstractBlock(blockNode);
        }

        this.ast.moveUp();
    }

    // Helper Functions
    private findChild(node: Node, name: string): Node | null 
    {
        return node.children.find(c => c.name === name) ?? null;
    }

    private findChildByKind(node: Node, kind: string): Node | null 
    {
        return node.children.find(c => c.kind === kind) ?? null;
    }

    

    
}

/*
VarDecl: [type, id]
AssignmentStatement: [id, "=", Expr]
PrintStatement: ["print", "(", id, ")"]
BooleanExpr: []
 */