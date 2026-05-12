import { AST } from "./semantic_analysis.js";
import { SymbolTable, Scope } from "./structures/SymbolTable.js";
import { Node } from "./structures/Node.js";
import { StaticEntry, JumpEntry } from "./structures/StaticTableEntries.js";

/* // --- Static Table Entry -------------------------------------------------------

class StaticEntry
{
    tempLabel: string;
    varName: string;
    scope: number;
    offset: number;

    constructor(tempLabel: string, varName: string, scope: number, offset: number)
    {
        this.tempLabel = tempLabel;
        this.varName = varName;
        this.scope = scope;
        this.offset = offset;
    }
}

// --- Jump Table Entry -----------------------------------------------------------

class JumpEntry
{
    tempLabel: string;
    distance: number;

    constructor(tempLabel: string, distance: number)
    {
        this.tempLabel = tempLabel;
        this.distance = distance;
    }
}

// --- Code Gen ----------------------------------------------------------------- */

export class CodeGen
{
    ast: AST;
    symbolTable: SymbolTable;

    codeArr: string[] = new Array(256).fill("00");;
    codePointer: number = 0x00;
    heapPointer: number = 0xFF;
    currentScope: Scope | null = null;
    scopeChildIndex: number[] = [];
    staticTable: StaticEntry[] = [];
    jumpTable: JumpEntry[] = [];
    tempCounter: number = 0;
    jumpCounter: number = 0;
    staticOffset: number = 0;
    errors: string[] = [];
    memError: boolean = false;
    codeGenStepTracker: string[] = [];
    heapStrings: {str: string, addr: number}[] = [];

    constructor(ast: AST, symbolTable: SymbolTable)
    {
        this.ast = ast;
        this.symbolTable = symbolTable;
    }

    // -- Public Entry Point ----------------------------------------------------

    generateMachineCode(): string
    {
        if (this.ast.root !== null)
        {
            this.visit(this.ast.root);
        }

        if (this.memError == false)
        {
            // Write BRK at end of code
            this.emit("00");

            // Backpatch
            this.backpatch();
        }
        
        console.log(this.codeArr);
        console.log(this.codeGenStepTracker);
        return this.codeArr.join(' ');
    }

    // -- Emit Helpers ----------------------------------------------------------

    private emit(byte: string): void
    {
        if (this.codePointer > this.heapPointer && this.memError == false)
        {
            this.errors.push("CODE GEN - Error: program exceeds 256 bytes");
            this.memError = true;
        }
        this.codeArr[this.codePointer] = byte.toUpperCase();
        this.codePointer++;
    }

    private emitTempLabel(tempLabel: string): void
    {
        this.emit(`${tempLabel}XX`);
        this.emit("00");
    }

    private emitJumpLabel(jumpLabel: string): void
    {
        this.emit(jumpLabel);
    }

    // -- Scope Helpers ---------------------------------------------------------

    private openScope(): void
    {
        if (this.currentScope === null)
        {
            this.currentScope = this.symbolTable.root;
            this.scopeChildIndex.push(0);
        }
        else
        {
            const idx = this.scopeChildIndex[this.scopeChildIndex.length - 1];
            this.currentScope = this.currentScope.children[idx];
            this.scopeChildIndex[this.scopeChildIndex.length - 1]++;
            this.scopeChildIndex.push(0);
        }
    }

    private closeScope(): void
    {
        this.currentScope = this.currentScope!.parent;
        this.scopeChildIndex.pop();
    }

    // -- Static Table Helpers --------------------------------------------------

    private addStaticEntry(varName: string, scope: number): string
    {
        const tempLabel = `T${this.tempCounter}`;
        this.staticTable.push(new StaticEntry(tempLabel, varName, scope, this.staticOffset));
        this.tempCounter++;
        this.staticOffset++;
        return tempLabel;
    }

    private lookupStatic(varName: string, scope: Scope | null): StaticEntry | null
    {
        if (scope === null) { return null; }
        const entry = this.staticTable.find(e => e.varName === varName && e.scope === scope.name);
        if (entry) { return entry; }
        return this.lookupStatic(varName, scope.parent);
    }

    // -- Jump Table Helpers ----------------------------------------------------

    private addJumpEntry(jumpLabel: string, distance: number): void
    {
        this.jumpTable.push(new JumpEntry(jumpLabel, distance));
    }

    // -- Visitor ---------------------------------------------------------------

    private visit(node: Node): void
    {
        switch (node.name)
        {
            case "Block":
                this.genBlock(node);
                break;
            case "VarDecl":
                this.genVarDecl(node);
                break;
            case "AssignmentStatement":
                this.genAssignmentStatement(node);
                break;
            case "PrintStatement":
                this.genPrintStatement(node);
                break;
            case "if":
                this.genIf(node);
                break;
            case "while":
                this.genWhile(node);
                break;
            default:
                for (const c of node.children)
                {
                    this.visit(c);
                }
                break;
        }
    }

    // -- Block -----------------------------------------------------------------

    private genBlock(node: Node): void
    {
        this.codeGenStepTracker.push("CODE GEN - Block (Scope Down)");
        this.openScope();

        for (const c of node.children)
        {
            this.visit(c);
        }

        this.closeScope();
        this.codeGenStepTracker.push("CODE GEN - End Block (Scope Up)");
    }

    // -- VarDecl ---------------------------------------------------------------

    private genVarDecl(node: Node): void
    {
        this.codeGenStepTracker.push("CODE GEN - Variable Declaration");

        const type    = node.children[0].name;
        const varName = node.children[1].name;
        const scope   = this.currentScope!.name;

        const tempLabel = this.addStaticEntry(varName, scope);

        if (type === "int" || type === "boolean")
        {
            // LDA #$00
            this.emit("A9");
            this.emit("00");
            // STA temp
            this.emit("8D");
            this.emitTempLabel(tempLabel);
        }
        // string: static table entry only
    }

    // -- AssignmentStatement ---------------------------------------------------

    private genAssignmentStatement(node: Node): void
    {
        this.codeGenStepTracker.push("CODE GEN - Assignment");

        const idName = node.children[0].name;
        const entry  = this.lookupStatic(idName, this.currentScope)!;

        if (node.children.length === 2)
        {
            const valNode  = node.children[1];
            const valEntry = this.lookupStatic(valNode.name, this.currentScope);

            if (valEntry !== null)
            {
                // Var to var: LDA from source, STA to dest
                this.emit("AD");
                this.emitTempLabel(valEntry.tempLabel);
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else if (valNode.name === "true")
            {
                this.emit("A9");
                this.emit("01");
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else if (valNode.name === "false")
            {
                this.emit("A9");
                this.emit("00");
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else if (this.isStringLiteral(valNode.name))
            {
                const heapAddr = this.writeStringToHeap(valNode.name);
                this.emit("A9");
                this.emit(heapAddr.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else
            {
                // Int literal
                const val = parseInt(valNode.name, 10);
                this.emit("A9");
                this.emit(val.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
        }
        else
        {
            // Int expression: evaluate at compile time
            /*
            const result = this.evalIntExpr(node.children.slice(1));
            this.emit("A9");
            this.emit(result.toString(16).toUpperCase().padStart(2, '0'));
            this.emit("8D");
            this.emitTempLabel(entry.tempLabel);
            */
            this.codeGenStepTracker.push("CODE GEN - Addition");
            this.genIntExpr(node.children.slice(1), entry.tempLabel);
        }
    }

    // -- PrintStatement --------------------------------------------------------

    private genPrintStatement(node: Node): void
    {
        this.codeGenStepTracker.push("CODE GEN - Print Statement");

        if (node.children.length === 1)
        {
            const valNode  = node.children[0];
            const valEntry = this.lookupStatic(valNode.name, this.currentScope);

            if (valEntry !== null)
            {
                // Variable — look up type from symbol table
                const symEntry = this.currentScope!.lookupAll(valNode.name)!;

                if (symEntry.type === "string")
                {
                    // LDY from temp, LDX #$02, SYS
                    this.emit("AC");
                    this.emitTempLabel(valEntry.tempLabel);
                    this.emit("A2");
                    this.emit("02");
                    this.emit("FF");
                }
                else
                {
                    // int or bool: LDY from temp, LDX #$01, SYS
                    this.emit("AC");
                    this.emitTempLabel(valEntry.tempLabel);
                    this.emit("A2");
                    this.emit("01");
                    this.emit("FF");
                }
            }
            else if (valNode.name === "true" || valNode.name === "false")
            {
                // Bool literal: print as string
                const heapAddr = this.writeStringToHeap(valNode.name);
                this.emit("A0");
                this.emit(heapAddr.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("A2");
                this.emit("02");
                this.emit("FF");
            }
            else if (this.isStringLiteral(valNode.name))
            {
                // String literal
                const heapAddr = this.writeStringToHeap(valNode.name);
                this.emit("A0");
                this.emit(heapAddr.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("A2");
                this.emit("02");
                this.emit("FF");
            }
            else
            {
                // Int literal
                const val = parseInt(valNode.name, 10);
                this.emit("A0");
                this.emit(val.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("A2");
                this.emit("01");
                this.emit("FF");
            }
        }
        else
        {
            // Int expression: evaluate at compile time
            this.codeGenStepTracker.push("CODE GEN - Addition");
            const result = this.evalIntExpr(node.children);
            this.emit("A0");
            this.emit(result.toString(16).toUpperCase().padStart(2, '0'));
            this.emit("A2");
            this.emit("01");
            this.emit("FF");
        }
    }

    // -- If Statement ----------------------------------------------------------
    private genIf(node: Node): void
    {
        this.codeGenStepTracker.push("CODE GEN - If Statement");

        const firstChild = node.children[0];
        const blockNode  = node.children[1];

        // ADDED: handle boolval case (if (true) or if (false))
        if (firstChild.kind === "leaf")
        {
            const boolTempLabel = this.addStaticEntry(`__bool${this.tempCounter}`, -1);
            const val = firstChild.name === "true" ? "01" : "00";

            // Store boolval in temp
            this.emit("A9");
            this.emit(val);
            this.emit("8D");
            this.emitTempLabel(boolTempLabel);

            // Compare against 01 — if false (00), Z=0, BNE skips body
            const oneTempLabel = this.addStaticEntry(`__one${this.tempCounter}`, -1);
            this.emit("A9");
            this.emit("01");
            this.emit("8D");
            this.emitTempLabel(oneTempLabel);

            this.emit("AE");
            this.emitTempLabel(boolTempLabel);
            this.emit("EC");
            this.emitTempLabel(oneTempLabel);
        }
        else
        {
            const isNotEqual = firstChild.name === "isNeq";
            this.genComparison(firstChild, isNotEqual);
        }

        const jumpLabel = `J${this.jumpCounter}`;
        this.jumpCounter++;
        this.emit("D0");
        this.emitJumpLabel(jumpLabel);

        const bodyStart = this.codePointer;
        this.genBlock(blockNode);
        const distance = this.codePointer - bodyStart;

        this.addJumpEntry(jumpLabel, distance);
    }

    // -- While Statement -------------------------------------------------------
    private genWhile(node: Node): void
    {
        this.codeGenStepTracker.push("CODE GEN - While Statement");

        const firstChild = node.children[0];
        const blockNode  = node.children[1];
        const compStart  = this.codePointer;

        // ADDED: handle boolval case
        if (firstChild.kind === "leaf")
        {
            const boolTempLabel = this.addStaticEntry(`__bool${this.tempCounter}`, -1);
            const val = firstChild.name === "true" ? "01" : "00";

            this.emit("A9");
            this.emit(val);
            this.emit("8D");
            this.emitTempLabel(boolTempLabel);

            const oneTempLabel = this.addStaticEntry(`__one${this.tempCounter}`, -1);
            this.emit("A9");
            this.emit("01");
            this.emit("8D");
            this.emitTempLabel(oneTempLabel);

            this.emit("AE");
            this.emitTempLabel(boolTempLabel);
            this.emit("EC");
            this.emitTempLabel(oneTempLabel);
        }
        else
        {
            const isNotEqual = firstChild.name === "isNeq";
            this.genComparison(firstChild, isNotEqual);
        }

        const jumpLabel = `J${this.jumpCounter}`;
        this.jumpCounter++;
        this.emit("D0");
        this.emitJumpLabel(jumpLabel);

        const bodyStart = this.codePointer;
        this.genBlock(blockNode);

        const forceTempLabel = this.addStaticEntry(`__force${this.tempCounter}`, -1);

        this.emit("A9");
        this.emit("01");
        this.emit("8D");
        this.emitTempLabel(forceTempLabel);

        this.emit("A2");
        this.emit("00");
        this.emit("EC");
        this.emitTempLabel(forceTempLabel);

        const jumpBack = (0x100 - (this.codePointer - compStart + 2)) & 0xFF;
        this.emit("D0");
        this.emit(jumpBack.toString(16).toUpperCase().padStart(2, '0'));

        const distance = this.codePointer - bodyStart;
        this.addJumpEntry(jumpLabel, distance);
    }

    // -- Comparison ------------------------------------------------------------

    private genComparison(isEqNode: Node, isNotEqual: boolean): void
    {
        this.codeGenStepTracker.push("CODE GEN - Equality");

        const left  = isEqNode.children[0];

        const leftEntry  = this.resolveOperand(left);
        let rightEntry: string;

        if (isEqNode.children.length > 2)
        {
            // Right side is an int expression — evaluate and store in temp
            const exprTempLabel = this.addStaticEntry(`__cmp${this.tempCounter}`, -1);
            this.genIntExpr(isEqNode.children.slice(1), exprTempLabel);
            rightEntry = exprTempLabel;
        }
        else
        {
            rightEntry = this.resolveOperand(isEqNode.children[1]);
        }

        // LDX left's temp address
        this.emit("AE");
        this.emitTempLabel(leftEntry);

        // CPX right's temp address
        this.emit("EC");
        this.emitTempLabel(rightEntry);

        if (isNotEqual)
        {
            // Invert Z-flag
            const invTempLabel = this.addStaticEntry(`__inv${this.tempCounter}`, -1);

            this.emit("A9");
            this.emit("01");
            this.emit("D0");
            this.emit("02");
            this.emit("A9");
            this.emit("00");
            this.emit("8D");
            this.emitTempLabel(invTempLabel);
            this.emit("A2");
            this.emit("01");
            this.emit("EC");
            this.emitTempLabel(invTempLabel);
        }
    }

    // -- Heap Helpers ----------------------------------------------------------

    private writeStringToHeap(str: string): number
    {
        // Strip the quotes from the string
        let str2 = str.replace(/"/g, '');

        // Check if string already exists in heap
        const existing = this.heapStrings.find(e => e.str === str2);
        if (existing !== undefined) 
        { 
            return existing.addr; 
        }

        // Write null terminator if the string isn't in the heap
        this.codeArr[this.heapPointer] = "00";
        this.heapPointer--;


        // Write characters in reverse
        for (let i = str2.length - 1; i >= 0; i--)
        {
            this.codeArr[this.heapPointer] = str2.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
            this.heapPointer--;
        }

        const addr = this.heapPointer + 1;
        this.heapStrings.push({ str: str2, addr });
        return addr;
    }

    private isStringLiteral(val: string): boolean
    {
        return isNaN(Number(val)) && val !== "true" && val !== "false";
    }

    // -- Compile-time Int Expression Evaluator ---------------------------------

    private evalIntExpr(nodes: Node[]): number
    {
        return nodes.reduce((sum, n) =>
        {
            const val = parseInt(n.name, 10);
            return isNaN(val) ? sum : sum + val;
        }, 0);
    }

    // -- Backpatching ----------------------------------------------------------

    private backpatch(): void
    {
        const codeLength = this.codePointer;

        this.codeArr = this.codeArr.map(byte =>
        {
            // Static temp label placeholder e.g. "T0XX"
            if (byte.endsWith("XX"))
            {
                const tempLabel = byte.slice(0, -2);
                const entry = this.staticTable.find(e => e.tempLabel === tempLabel);
                if (entry)
                {
                    const actualAddr = codeLength + entry.offset;
                    return actualAddr.toString(16).toUpperCase().padStart(2, '0');
                }
            }

            // Jump label placeholder e.g. "J0"
            const jumpEntry = this.jumpTable.find(e => e.tempLabel === byte);
            if (jumpEntry)
            {
                return jumpEntry.distance.toString(16).toUpperCase().padStart(2, '0');
            }

            return byte;
        });
    }

    private resolveOperand(node: Node): string
    {
        // Check if it's a known variable
        const staticEntry = this.lookupStatic(node.name, this.currentScope);
        if (staticEntry !== null)
        {
            return staticEntry.tempLabel;
        }

        // It's a literal — create a temp entry and store the value
        const tempLabel = this.addStaticEntry(`__lit${this.tempCounter}`, -1);

        let val: number;

        if (node.name === "true")
        {
            val = 0x01;
        }
        else if (node.name === "false")
        {
            val = 0x00;
        }
        else if (!isNaN(parseInt(node.name, 10)))
        {
            // Int literal
            val = parseInt(node.name, 10);
        }
        else
        {
            // String literal: store heap address
            val = this.writeStringToHeap(node.name);
        }

        // Store the value into the temp address
        this.emit("A9");
        this.emit(val.toString(16).toUpperCase().padStart(2, '0'));
        this.emit("8D");
        this.emitTempLabel(tempLabel);

        return tempLabel;
    }

    private genIntExpr(nodes: Node[], destTempLabel: string): void
    {
        // Load first operand into accumulator
        const first = nodes[0];
        const firstEntry = this.lookupStatic(first.name, this.currentScope);

        if (firstEntry !== null)
        {
            // Variable: LDA from memory
            this.emit("AD");
            this.emitTempLabel(firstEntry.tempLabel);
        }
        else
        {
            // Int literal: LDA with constant
            const val = parseInt(first.name, 10);
            this.emit("A9");
            this.emit(val.toString(16).toUpperCase().padStart(2, '0'));
        }

        // Add each subsequent operand using ADC
        for (let i = 1; i < nodes.length; i++)
        {
            const operand      = nodes[i];
            const operandEntry = this.lookupStatic(operand.name, this.currentScope);

            if (operandEntry !== null)
            {
                // Variable: ADC directly from memory
                this.emit("6D");
                this.emitTempLabel(operandEntry.tempLabel);
            }
            else if (!isNaN(parseInt(operand.name, 10)))
            {
                // Int literal: store acc in temp, load literal, ADC from temp
                const addTempLabel = this.addStaticEntry(`__add${this.tempCounter}`, -1);
                this.emit("8D");
                this.emitTempLabel(addTempLabel);
                this.emit("A9");
                this.emit(parseInt(operand.name, 10).toString(16).toUpperCase().padStart(2, '0'));
                this.emit("6D");
                this.emitTempLabel(addTempLabel);
            }
        }

        // Store result in destination
        this.emit("8D");
        this.emitTempLabel(destTempLabel);
    }
}

