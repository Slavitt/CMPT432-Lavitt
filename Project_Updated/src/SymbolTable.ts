export class SymbolEntry
{
    id: string;
    type: string;
    isInitialized: boolean;
    isUsed: boolean;

    constructor(id: string, type: string)
    {
        this.id = id;
        this.type = type;
        this.isInitialized = false;
        this.isUsed = false;
    }
}

export class Scope
{
    name: number;
    parent: Scope | null;
    children: Scope[];
    table: Map<string, SymbolEntry>;

    constructor(name: number, parent: Scope | null)
    {
        this.name = name;
        this.parent = parent;
        this.children = [];
        this.table = new Map();
    }

    // Adds a new entry to this scope's hash table
    addEntry(id: string, type: string): SymbolEntry
    {
        const entry = new SymbolEntry(id, type);
        this.table.set(id, entry);
        return entry;
    }

    // Looks up an entry in this scope only
    lookup(id: string): SymbolEntry | null
    {
        return this.table.get(id) ?? null;
    }

    // Looks up an entry in this scope and all parent scopes
    lookupAll(id: string): SymbolEntry | null
    {
        const entry = this.table.get(id);
        if (entry) { return entry; }
        if (this.parent) { return this.parent.lookupAll(id); }
        return null;
    }
}

export class SymbolTable
{
    root: Scope | null;
    current: Scope | null;
    scopeCounter: number;
    errors: string[];
    warnings: string[];

    constructor()
    {
        this.root = null;
        this.current = null;
        this.scopeCounter = 0;
        this.errors = [];
        this.warnings = [];
    }

    // Open a new scope
    openScope(): void
    {
        const scope = new Scope(this.scopeCounter++, this.current);
        if (this.root === null)
        {
            this.root = scope;
        }
        if (this.current !== null)
        {
            this.current.children.push(scope);
        }
        this.current = scope;
    }

    // Close the current scope and move up to parent
    closeScope(): void
    {
        if (this.current !== null)
        {
            this.current = this.current.parent;
        }
    }

    printTable(): string
    {
        if (this.root === null) { return ""; }
        return this.traverseScopes(this.root, 0);
    }

    private traverseScopes(scope: Scope, depth: number): string
    {
        let output = "";
        const indent = "  ".repeat(depth);

        output += `${indent}Scope ${scope.name}:\n`;
        for (const [id, entry] of scope.table)
        {
            output += `${indent}  ${id} | type: ${entry.type} | initialized: ${entry.isInitialized} | used: ${entry.isUsed}\n`;
        }

        for (const child of scope.children)
        {
            output += this.traverseScopes(child, depth + 1);
        }

        return output;
    }
}