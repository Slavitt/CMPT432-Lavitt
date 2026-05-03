import { Node } from "./Node.js";
import { CST } from "./parser.js";

// AST Class - pretty much the same thing as the CST
// if you have time: create Tree.ts?
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

    // Uses the CST from parse as an attribute
    constructor(cst: CST)
    {
        this.cst = cst;
        this.ast = new AST();
    }

    // begins traversing the CST to pick out the "good parts"
    startSem(): AST
    {
        console.log("time for semantic analysis!");
        if (this.cst.root != null)
        {
            this.visit(this.cst.root);
        }
        return this.ast;
    }

    // Recursively parses through the CST starting at the root
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

            // If the node is not one of the above statements,
            // it is skipped over
            default:
                for (const c of node.children)
                {
                    this.visit(c);
                }
                break;
        }
    }

    // Creates a Block node in the AST
    private abstractBlock(n: Node) 
    {
        console.log("SEMANTIC - abstractBlock()");

        this.ast.addNode("branch", "Block");

        // visits each child node of the Block node from the CST
        for (const c of n.children)
        {
            this.visit(c);
        }

        this.ast.moveUp();
    }
    
    // Creates a VarDecl node in the AST and leaf nodes for Type and Id
    private abstractVarDecl(n: Node) 
    {
        this.ast.addNode("branch", "VarDecl");

        let typeNode = n.children[0];
        let idNode = n.children[1].children[0];
        
        this.ast.addNode("leaf", typeNode.name);
        this.ast.addNode("leaf", idNode.name);

        this.ast.moveUp();
    }

    // Creates an AssignmentStatement node in the AST and leaf nodes for Id and Value
    private abstractAssignmentStatement(n: Node) 
    {
        this.ast.addNode("branch", "AssignmentStatement");

        let idNode = n.children[0].children[0];
        this.ast.addNode("leaf", idNode.name);

        this.findExpr(n.children[2]);

        this.ast.moveUp();
    }

    // Creates a PrintStatement node in the AST and a leaf node for Id
    private abstractPrintStatement(n: Node) 
    {
        this.ast.addNode("branch", "PrintStatement");

        this.findExpr(n.children[2]);

        this.ast.moveUp();
    }

    // Creates an IfStatement node in the AST and branch nodes for isEq and a Block
    private abstractIfStatement(n: Node) 
    {
        console.log("abstractIf()");

        this.ast.addNode("branch", "if");
        this.findBooleanExpr(n.children[1]);

        this.abstractBlock(n.children[2]);  

        this.ast.moveUp();
    }

    // Creates an WhileStatement node in the AST and branch nodes for isEq and a Block
    private abstractWhileStatement(n: Node) 
    {
        console.log("abstractWhile()");

        this.ast.addNode("branch", "while");

        this.findExpr(n.children[1]);

        this.ast.moveUp();

        this.abstractBlock(n.children[2]);  

        this.ast.moveUp();
    }

    // Helper Functions---------------------------------------------------------------------------------------------

    // Searches for and returns the correct Expr type
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

    // Assembles a string from the children of a CharList
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

    // Helper function to the helper function findExpr()
    // (help-ception?)
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