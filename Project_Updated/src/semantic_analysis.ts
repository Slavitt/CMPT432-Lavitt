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
                for (const c of node.children)
                {
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
    
    // VarDecl ------------------------------------------------
    private abstractVarDecl(n: Node) 
    {
        this.ast.addNode("branch", "VarDecl");

        let typeNode = n.children[0];
        let idNode = n.children[1].children[0];
        
        this.ast.addNode("leaf", typeNode.name);
        this.ast.addNode("leaf", idNode.name);

        this.ast.moveUp();
    }

    // AssignmentStatement ------------------------------------------------
    private abstractAssignmentStatement(n: Node) 
    {
        this.ast.addNode("branch", "AssignmentStatement");

        let idNode = n.children[0].children[0];
        this.ast.addNode("leaf", idNode.name);

        this.findExpr(n.children[2]);

        this.ast.moveUp();
    }

    // DONE with PrintStatement
    private abstractPrintStatement(n: Node) 
    {
        this.ast.addNode("branch", "PrintStatement");

        this.findExpr(n.children[2]);

        this.ast.moveUp();
    }

    // If Statement
    private abstractIfStatement(n: Node) 
    {
        console.log("abstractIf()");

        this.ast.addNode("branch", "if");
        this.findBooleanExpr(n.children[1]);

        this.abstractBlock(n.children[2]);  

        this.ast.moveUp();
    }

    // While Statement
    private abstractWhileStatement(n: Node) 
    {
        console.log("abstractWhile()");

        this.ast.addNode("branch", "while");

        this.findExpr(n.children[1]);

        this.ast.moveUp();

        this.abstractBlock(n.children[2]);  

        this.ast.moveUp();
    }

    // Helper Functions-------------------------------

    private findExpr(n: Node)
    {
        console.log("findExpr()");

        // IntExpr ----------------------------------------------
        if (n.name == "IntExpr")
        {
            for (const c of n.children)
            {
                if (c.kind == "leaf"  && c.name != "+")
                {
                    this.ast.addNode("leaf", c.name); 
                }
                else if (c.name == "Expr")
                { 
                    this.findExpr(c);
                }
            }
        }

        // StringExpr ----------------------------------------------
        else if (n.name == "StringExpr")
        {
            const charList = n.children[1];
            const str = this.concatCharList(charList);
            this.ast.addNode("leaf", str);
        }

        // BooleanExpr ----------------------------------------------
        else if (n.name == "BooleanExpr")
        {
            /*if (n.children[0].kind == "leaf")
            {
                this.ast.addNode("leaf", n.children[0].name);
            }
            else
            {
                this.findExpr(n.children[1]); // left Expr
                this.findExpr(n.children[3]); // right Expr
            }*/

            this.findBooleanExpr(n);
        }

        // Id ----------------------------------------------
        else if (n.name == "Id")
        {
            this.ast.addNode("leaf", n.children[0].name);
        }

        // Expr ----------------------------------------------
        else if (n.name == "Expr")
        {
            this.findExpr(n.children[0]);
        }
}

    private concatCharList(n: Node): string
    {
        let result = "";
        for (const c of n.children)
        {
            if (c.kind == "leaf") 
            { 
                result += c.name; 
            }
            else                   
            { 
                result += this.concatCharList(c); 
            }
        }

        return result;
    }

    private findBooleanExpr(n: Node)
    {
        console.log("abstractBooleanExpr()");

        if (n.children[0].name === "(") 
        {
            this.ast.addNode("branch", "isEq");
            this.findExpr(n.children[1]); // left Expr
            this.findExpr(n.children[3]); // right Expr
            this.ast.moveUp();
        }
        else if (n.children[0].kind === "leaf")
        {
            this.ast.addNode("leaf", n.children[0].name);
        }
    }
}

/*
VarDecl: [type, id]
AssignmentStatement: [id, "=", Expr]
PrintStatement: ["print", "(", id, ")"]
BooleanExpr: []

    private findExpr(n: Node): Node
    {
        let ex: Node = n.children[0];

        if (ex.name == "IntExpr")
        {
            if (ex.children.length == 3)
            {
                
            }
        }
        else if (ex.name == "StringExpr")
        {

        }
        else if (ex.name == "BooleanExpr")
        {

        }
        else if (ex.name == "Id")
        {

        }
        else
        {
            return ex;
        }
    }
 */