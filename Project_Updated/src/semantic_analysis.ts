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
        switch(node.kind)
        {
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
                for (const c of node.children)
                {
                    this.visit(c);
                }
                break;
        }
    }

    abstractBlock(n: Node) 
    {
        console.log("SEMANTIC - abstractBlock()");

        this.ast.addNode("branch", "Block");

        for (const c of n.children)
        {
            this.visit(c);
        }

        this.ast.moveUp();
    }
    
    abstractVarDecl(n: Node) 
    {
        this.ast.addNode("branch", "VarDecl");

        let typeNode = this.findChild(n, "type");
        let idNode = this.findChild(n, "id");

        if (typeNode) {this.ast.addNode("leaf", typeNode.name);}
        if (idNode) {this.ast.addNode("leaf", idNode.name);}

        this.ast.moveUp();
    }

    abstractAssignmentStatement(n: Node) 
    {
        

        this.ast.moveUp();
    }

    abstractPrintStatement(n: Node) 
    {
        

        this.ast.moveUp();
    }

    abstractIfStatement(n: Node) 
    {
        

        this.ast.moveUp();
    }

    abstractWhileStatement(n: Node) 
    {
        

        this.ast.moveUp();
    }

    // Helper Functions
    private findChild(node: Node, name: string): Node | null 
    {
        return node.children.find(c => c.name === name) ?? null;
    }

    

    

    
}