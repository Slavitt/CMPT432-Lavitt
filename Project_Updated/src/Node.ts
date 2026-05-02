export class Node
{
    name: string;
    kind: string;
    parent: Node | null;
    children: Node[];

    constructor(name: string, kind: string, parent: Node | null)
    {
        this.name = name;
        this.kind = kind;
        this.parent = parent;
        this.children = [];
    }
}