export class SymbolEntry {
    constructor(id, type) {
        this.id = id;
        this.type = type;
        this.isInitialized = false;
        this.isUsed = false;
    }
}
export class Scope {
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
        this.children = [];
        this.table = new Map();
    }
    // Adds a new entry to this scope's hash table
    addEntry(id, type) {
        const entry = new SymbolEntry(id, type);
        this.table.set(id, entry);
        return entry;
    }
    // Looks up an entry in this scope only
    lookup(id) {
        var _a;
        return (_a = this.table.get(id)) !== null && _a !== void 0 ? _a : null;
    }
    // Looks up an entry in this scope and all parent scopes
    lookupAll(id) {
        const entry = this.table.get(id);
        if (entry) {
            return entry;
        }
        if (this.parent) {
            return this.parent.lookupAll(id);
        }
        return null;
    }
}
export class SymbolTable {
    constructor() {
        this.stepTracer = [];
        this.root = null;
        this.current = null;
        this.scopeCounter = 0;
        this.errors = [];
        this.warnings = [];
    }
    // Open a new scope
    openScope() {
        const scope = new Scope(this.scopeCounter++, this.current);
        if (this.root === null) {
            this.root = scope;
        }
        if (this.current !== null) {
            this.current.children.push(scope);
        }
        this.current = scope;
        // this.stepTracer.push(`SYMBOL TABLE - Scope ${scope.name} opened`);
    }
    // Close the current scope and move up to parent
    closeScope() {
        if (this.current !== null) {
            // this.stepTracer.push(`SYMBOL TABLE - Scope ${this.current.name} closed`);
            this.current = this.current.parent;
        }
    }
    printTable() {
        if (this.root === null) {
            return "";
        }
        return this.traverseScopes(this.root, 0);
    }
    traverseScopes(scope, depth) {
        let output = "";
        const indent = "  ".repeat(depth);
        output += `${indent}Scope ${scope.name}:\n`;
        for (const [id, entry] of scope.table) {
            output += `${indent}  ${id} | type: ${entry.type} | initialized: ${entry.isInitialized} | used: ${entry.isUsed}\n`;
        }
        for (const child of scope.children) {
            output += this.traverseScopes(child, depth + 1);
        }
        return output;
    }
}
//# sourceMappingURL=SymbolTable.js.map