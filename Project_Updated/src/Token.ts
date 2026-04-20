export class Token
{
    type: String;
    value: string;
    line: number;
    index: number;

    constructor(type: string, value: string, line: number, index: number)
    {
        this.type = type;
        this.value = value;
        this.line = line;
        this.index = index;
    }
}