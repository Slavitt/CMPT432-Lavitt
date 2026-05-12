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
export class CodeGen {
    ;
    constructor(ast, symbolTable) {
        this.codeArr = new Array(256).fill("00");
        this.codePointer = 0x00;
        this.heapPointer = 0xFF;
        this.currentScope = null;
        this.scopeChildIndex = [];
        this.staticTable = [];
        this.jumpTable = [];
        this.tempCounter = 0;
        this.jumpCounter = 0;
        this.staticOffset = 0;
        this.errors = [];
        this.memError = false;
        this.codeGenStepTracker = [];
        this.heapStrings = [];
        this.ast = ast;
        this.symbolTable = symbolTable;
    }
    // -- Public Entry Point ----------------------------------------------------
    generateMachineCode() {
        if (this.ast.root !== null) {
            this.visit(this.ast.root);
        }
        if (this.memError == false) {
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
    emit(byte) {
        if (this.codePointer > this.heapPointer && this.memError == false) {
            this.errors.push("CODE GEN - Error: program exceeds 256 bytes");
            this.memError = true;
        }
        this.codeArr[this.codePointer] = byte.toUpperCase();
        this.codePointer++;
    }
    emitTempLabel(tempLabel) {
        this.emit(`${tempLabel}XX`);
        this.emit("00");
    }
    emitJumpLabel(jumpLabel) {
        this.emit(jumpLabel);
    }
    // -- Scope Helpers ---------------------------------------------------------
    openScope() {
        if (this.currentScope === null) {
            this.currentScope = this.symbolTable.root;
            this.scopeChildIndex.push(0);
        }
        else {
            const idx = this.scopeChildIndex[this.scopeChildIndex.length - 1];
            this.currentScope = this.currentScope.children[idx];
            this.scopeChildIndex[this.scopeChildIndex.length - 1]++;
            this.scopeChildIndex.push(0);
        }
    }
    closeScope() {
        this.currentScope = this.currentScope.parent;
        this.scopeChildIndex.pop();
    }
    // -- Static Table Helpers --------------------------------------------------
    addStaticEntry(varName, scope) {
        const tempLabel = `T${this.tempCounter}`;
        this.staticTable.push(new StaticEntry(tempLabel, varName, scope, this.staticOffset));
        this.tempCounter++;
        this.staticOffset++;
        return tempLabel;
    }
    lookupStatic(varName, scope) {
        if (scope === null) {
            return null;
        }
        const entry = this.staticTable.find(e => e.varName === varName && e.scope === scope.name);
        if (entry) {
            return entry;
        }
        return this.lookupStatic(varName, scope.parent);
    }
    // -- Jump Table Helpers ----------------------------------------------------
    addJumpEntry(jumpLabel, distance) {
        this.jumpTable.push(new JumpEntry(jumpLabel, distance));
    }
    // -- Visitor ---------------------------------------------------------------
    visit(node) {
        switch (node.name) {
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
                for (const c of node.children) {
                    this.visit(c);
                }
                break;
        }
    }
    // -- Block -----------------------------------------------------------------
    genBlock(node) {
        this.codeGenStepTracker.push("CODE GEN - Block (Scope Down)");
        this.openScope();
        for (const c of node.children) {
            this.visit(c);
        }
        this.closeScope();
        this.codeGenStepTracker.push("CODE GEN - End Block (Scope Up)");
    }
    // -- VarDecl ---------------------------------------------------------------
    genVarDecl(node) {
        this.codeGenStepTracker.push("CODE GEN - Variable Declaration");
        const type = node.children[0].name;
        const varName = node.children[1].name;
        const scope = this.currentScope.name;
        const tempLabel = this.addStaticEntry(varName, scope);
        if (type === "int" || type === "boolean") {
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
    genAssignmentStatement(node) {
        this.codeGenStepTracker.push("CODE GEN - Assignment");
        const idName = node.children[0].name;
        const entry = this.lookupStatic(idName, this.currentScope);
        if (node.children.length === 2) {
            const valNode = node.children[1];
            const valEntry = this.lookupStatic(valNode.name, this.currentScope);
            if (valEntry !== null) {
                // Var to var: LDA from source, STA to dest
                this.emit("AD");
                this.emitTempLabel(valEntry.tempLabel);
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else if (valNode.name === "true") {
                this.emit("A9");
                this.emit("01");
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else if (valNode.name === "false") {
                this.emit("A9");
                this.emit("00");
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else if (this.isStringLiteral(valNode.name)) {
                const heapAddr = this.writeStringToHeap(valNode.name);
                this.emit("A9");
                this.emit(heapAddr.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
            else {
                // Int literal
                const val = parseInt(valNode.name, 10);
                this.emit("A9");
                this.emit(val.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("8D");
                this.emitTempLabel(entry.tempLabel);
            }
        }
        else {
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
    genPrintStatement(node) {
        this.codeGenStepTracker.push("CODE GEN - Print Statement");
        if (node.children.length === 1) {
            const valNode = node.children[0];
            const valEntry = this.lookupStatic(valNode.name, this.currentScope);
            if (valEntry !== null) {
                // Variable — look up type from symbol table
                const symEntry = this.currentScope.lookupAll(valNode.name);
                if (symEntry.type === "string") {
                    // LDY from temp, LDX #$02, SYS
                    this.emit("AC");
                    this.emitTempLabel(valEntry.tempLabel);
                    this.emit("A2");
                    this.emit("02");
                    this.emit("FF");
                }
                else {
                    // int or bool: LDY from temp, LDX #$01, SYS
                    this.emit("AC");
                    this.emitTempLabel(valEntry.tempLabel);
                    this.emit("A2");
                    this.emit("01");
                    this.emit("FF");
                }
            }
            else if (valNode.name === "true" || valNode.name === "false") {
                // Bool literal: print as string
                const heapAddr = this.writeStringToHeap(valNode.name);
                this.emit("A0");
                this.emit(heapAddr.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("A2");
                this.emit("02");
                this.emit("FF");
            }
            else if (this.isStringLiteral(valNode.name)) {
                // String literal
                const heapAddr = this.writeStringToHeap(valNode.name);
                this.emit("A0");
                this.emit(heapAddr.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("A2");
                this.emit("02");
                this.emit("FF");
            }
            else {
                // Int literal
                const val = parseInt(valNode.name, 10);
                this.emit("A0");
                this.emit(val.toString(16).toUpperCase().padStart(2, '0'));
                this.emit("A2");
                this.emit("01");
                this.emit("FF");
            }
        }
        else {
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
    genIf(node) {
        this.codeGenStepTracker.push("CODE GEN - If Statement");
        const isEqNode = node.children[0];
        const blockNode = node.children[1];
        const isNotEqual = isEqNode.name === "isNeq";
        this.genComparison(isEqNode, isNotEqual);
        // BNE with jump placeholder
        const jumpLabel = `J${this.jumpCounter}`;
        this.jumpCounter++;
        this.emit("D0");
        this.emitJumpLabel(jumpLabel);
        // Generate body and measure distance
        const bodyStart = this.codePointer;
        this.genBlock(blockNode);
        const distance = this.codePointer - bodyStart;
        this.addJumpEntry(jumpLabel, distance);
    }
    // -- While Statement -------------------------------------------------------
    genWhile(node) {
        this.codeGenStepTracker.push("CODE GEN - While Statement");
        const isEqNode = node.children[0];
        const blockNode = node.children[1];
        const compStart = this.codePointer;
        const isNotEqual = isEqNode.name === "isNeq";
        this.genComparison(isEqNode, isNotEqual);
        // BNE with jump placeholder (jump over body if condition false)
        const jumpLabel = `J${this.jumpCounter}`;
        this.jumpCounter++;
        this.emit("D0");
        this.emitJumpLabel(jumpLabel);
        // Generate body
        const bodyStart = this.codePointer;
        this.genBlock(blockNode);
        // Unconditional branch back to comparison
        // Force Z=0: store 1 in temp, LDX #0, CPX temp -> Z=0, BNE back
        const forceTempLabel = this.addStaticEntry(`__force${this.tempCounter}`, -1);
        this.emit("A9");
        this.emit("01");
        this.emit("8D");
        this.emitTempLabel(forceTempLabel);
        this.emit("A2");
        this.emit("00");
        this.emit("EC");
        this.emitTempLabel(forceTempLabel);
        // Jump back: 256 - (current position - compStart + 2)
        const jumpBack = (0x100 - (this.codePointer - compStart + 2)) & 0xFF;
        this.emit("D0");
        this.emit(jumpBack.toString(16).toUpperCase().padStart(2, '0'));
        // Forward jump distance
        const distance = this.codePointer - bodyStart;
        this.addJumpEntry(jumpLabel, distance);
    }
    // -- Comparison ------------------------------------------------------------
    genComparison(isEqNode, isNotEqual) {
        this.codeGenStepTracker.push("CODE GEN - Equality");
        const left = isEqNode.children[0];
        const leftEntry = this.resolveOperand(left);
        let rightEntry;
        if (isEqNode.children.length > 2) {
            // Right side is an int expression — evaluate and store in temp
            const exprTempLabel = this.addStaticEntry(`__cmp${this.tempCounter}`, -1);
            this.genIntExpr(isEqNode.children.slice(1), exprTempLabel);
            rightEntry = exprTempLabel;
        }
        else {
            rightEntry = this.resolveOperand(isEqNode.children[1]);
        }
        // LDX left's temp address
        this.emit("AE");
        this.emitTempLabel(leftEntry);
        // CPX right's temp address
        this.emit("EC");
        this.emitTempLabel(rightEntry);
        if (isNotEqual) {
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
    writeStringToHeap(str) {
        // Strip the quotes from the string
        let str2 = str.replace(/"/g, '');
        // Check if string already exists in heap
        const existing = this.heapStrings.find(e => e.str === str2);
        if (existing !== undefined) {
            return existing.addr;
        }
        // Write null terminator if the string isn't in the heap
        this.codeArr[this.heapPointer] = "00";
        this.heapPointer--;
        // Write characters in reverse
        for (let i = str2.length - 1; i >= 0; i--) {
            this.codeArr[this.heapPointer] = str2.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
            this.heapPointer--;
        }
        const addr = this.heapPointer + 1;
        this.heapStrings.push({ str: str2, addr });
        return addr;
    }
    isStringLiteral(val) {
        return isNaN(Number(val)) && val !== "true" && val !== "false";
    }
    // -- Compile-time Int Expression Evaluator ---------------------------------
    evalIntExpr(nodes) {
        return nodes.reduce((sum, n) => {
            const val = parseInt(n.name, 10);
            return isNaN(val) ? sum : sum + val;
        }, 0);
    }
    // -- Backpatching ----------------------------------------------------------
    backpatch() {
        const codeLength = this.codePointer;
        this.codeArr = this.codeArr.map(byte => {
            // Static temp label placeholder e.g. "T0XX"
            if (byte.endsWith("XX")) {
                const tempLabel = byte.slice(0, -2);
                const entry = this.staticTable.find(e => e.tempLabel === tempLabel);
                if (entry) {
                    const actualAddr = codeLength + entry.offset;
                    return actualAddr.toString(16).toUpperCase().padStart(2, '0');
                }
            }
            // Jump label placeholder e.g. "J0"
            const jumpEntry = this.jumpTable.find(e => e.tempLabel === byte);
            if (jumpEntry) {
                return jumpEntry.distance.toString(16).toUpperCase().padStart(2, '0');
            }
            return byte;
        });
    }
    resolveOperand(node) {
        // Check if it's a known variable
        const staticEntry = this.lookupStatic(node.name, this.currentScope);
        if (staticEntry !== null) {
            return staticEntry.tempLabel;
        }
        // It's a literal — create a temp entry and store the value
        const tempLabel = this.addStaticEntry(`__lit${this.tempCounter}`, -1);
        let val;
        if (node.name === "true") {
            val = 0x01;
        }
        else if (node.name === "false") {
            val = 0x00;
        }
        else if (!isNaN(parseInt(node.name, 10))) {
            // Int literal
            val = parseInt(node.name, 10);
        }
        else {
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
    genIntExpr(nodes, destTempLabel) {
        // Load first operand into accumulator
        const first = nodes[0];
        const firstEntry = this.lookupStatic(first.name, this.currentScope);
        if (firstEntry !== null) {
            // Variable: LDA from memory
            this.emit("AD");
            this.emitTempLabel(firstEntry.tempLabel);
        }
        else {
            // Int literal: LDA with constant
            const val = parseInt(first.name, 10);
            this.emit("A9");
            this.emit(val.toString(16).toUpperCase().padStart(2, '0'));
        }
        // Add each subsequent operand using ADC
        for (let i = 1; i < nodes.length; i++) {
            const operand = nodes[i];
            const operandEntry = this.lookupStatic(operand.name, this.currentScope);
            if (operandEntry !== null) {
                // Variable: ADC directly from memory
                this.emit("6D");
                this.emitTempLabel(operandEntry.tempLabel);
            }
            else if (!isNaN(parseInt(operand.name, 10))) {
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
//# sourceMappingURL=codeGen.js.map