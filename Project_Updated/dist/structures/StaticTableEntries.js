export class StaticEntry {
    constructor(tempLabel, varName, scope, offset) {
        this.tempLabel = tempLabel;
        this.varName = varName;
        this.scope = scope;
        this.offset = offset;
    }
}
export class JumpEntry {
    constructor(tempLabel, distance) {
        this.tempLabel = tempLabel;
        this.distance = distance;
    }
}
//# sourceMappingURL=StaticTableEntries.js.map