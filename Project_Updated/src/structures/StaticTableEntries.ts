export class StaticEntry
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

export class JumpEntry
{
    tempLabel: string;
    distance: number;

    constructor(tempLabel: string, distance: number)
    {
        this.tempLabel = tempLabel;
        this.distance = distance;
    }
}