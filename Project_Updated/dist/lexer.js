import { Token } from "./structures/Token.js";
/* REMEMBER TO DO THIS

- ID handling and keywords [COME BACK TO THIS LATER]
    - create temp array for holding tokens
    - create string to hold
    - add currentChar into array
    - compare it to the

- ID Handling and Keywords
    - create temp array for holding tokens
    - create string to hold chars (INSTANCE VARIABLE FOR LEXER)
    -
*/
export class Lexer {
    constructor() {
        this.tokenStream = [];
        this.errorStream = [];
        this.warningStream = [];
        this.pos = 0;
        this.index = 1;
        this.line = 1;
        this.tokenList = ["int", "string", "boolean", "while", "if", "false", "true", "print", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "+", "=", "==", "!=", "\"", "(", ")", "{", "}", "/*", "*/", "$", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", '"'];
        this.types = ["VARIABLE TYPE", "VARIABLE TYPE", "VARIABLE TYPE", "WHILE", "IF", "BOOL_VAL", "BOOL_VAL", "PRINT", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ADD", "ASSIGN", "BOOL_OP", "BOOL_OP", "QUOTE", "O-PAREN", "C-PAREN", "O-BRACE", "C-BRACE", "OPEN COMMENT", "CLOSE COMMENT", "EOP", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "QUOTE"];
        this.characterList = [" ", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    }
    generateTokens(input) {
        console.log("hello from lexer.ts");
        let program = input + " ";
        // Condition checks
        let inComment = false;
        let inQuote = false;
        while (this.pos < program.length) {
            let currentChar = program[this.pos];
            // Ignore whitespace and tabs (getting rid of that pesky IDE formatting)
            // Move on in the program string and advance the index number for the next token
            if (currentChar == ' ' || currentChar == '\t') {
                this.advance();
            }
            else if (currentChar == '\n') {
                this.advance();
                this.index = 1;
                this.line++;
            }
            // Comments! Ignore whatever's in them! -------------------------------------------
            else if (currentChar == '/' && this.nextToken(program, this.pos) == '*') {
                // this.generateToken("/*");
                inComment = true;
                this.advance();
                this.advance();
                while (inComment && this.pos + 1 <= program.length) {
                    currentChar = program[this.pos];
                    // Detects the end of the comment and advances through it
                    if (currentChar == '*' && this.nextToken(program, this.pos) == '/') {
                        inComment = false;
                        // this.generateToken("*/");
                        this.advance();
                        this.advance();
                    }
                    // Ignores new lines found inside the comment, but prints to the
                    // console just to be safe.
                    else if (currentChar == '\n') {
                        console.log(`new line in comment at line ${this.line}, index ${this.index}`);
                        this.line++;
                        this.index = 1;
                    }
                    // Warning for unterminated comments
                    if (this.pos >= program.length) {
                        this.warningStream.push("WARNING: Unterminated comment. Fix this!");
                        inComment = false;
                    }
                    this.advance();
                }
            }
            // End comment code -----------------------------------------------
            // Single character tokens () and boolean operators
            else if (currentChar == '+') {
                this.generateToken("+");
                this.advance();
            }
            else if (currentChar == '(') {
                this.generateToken("(");
                this.advance();
            }
            else if (currentChar == ')') {
                this.generateToken(")");
                this.advance();
            }
            else if (currentChar == '{') {
                this.generateToken("{");
                this.advance();
            }
            else if (currentChar == '}') {
                this.generateToken("}");
                this.advance();
            }
            // Equals: operator or boolean?
            else if (currentChar == '=') {
                if (this.nextToken(program, this.pos) == '=') {
                    this.generateToken("==");
                    this.advance();
                    this.advance();
                }
                else // next char in the program isn't '='
                 {
                    this.generateToken(currentChar);
                    this.advance();
                }
            }
            // Not Equals: operator or boolean?
            else if (currentChar == '!') {
                if (this.nextToken(program, this.pos) == '=') {
                    // add the boolop token
                    this.generateToken("!=");
                    this.advance();
                    this.advance();
                }
                else // next char in the program isn't '='
                 {
                    // throw an error and advance
                    this.errorStream.push(`ERROR: Invalid character [ ${currentChar} ] found at (${this.line},${this.index})`);
                    this.advance();
                }
            }
            // Digit?
            else if (this.isDigit(currentChar)) {
                this.generateToken(currentChar);
                this.advance();
            }
            // Character?
            else if (this.isChar(currentChar)) {
                let charString = "";
                let currentIndex = this.index;
                while (this.pos < program.length && this.isChar(currentChar)) {
                    charString += currentChar;
                    this.advance();
                    currentChar = program[this.pos];
                }
                let charsLeft = charString.length;
                while (charsLeft > 0) {
                    if (charsLeft == 1) {
                        this.generateKeywordToken(charString, currentIndex);
                        charString = "";
                    }
                    // int keyword
                    else if (charString.substring(0, 3) == "int") {
                        this.generateKeywordToken("int", currentIndex);
                        currentIndex += 3;
                        charString = charString.substring(3, charsLeft);
                    }
                    // string keyword
                    else if (charString.substring(0, 6) == "string") {
                        this.generateKeywordToken("string", currentIndex);
                        currentIndex += 6;
                        charString = charString.substring(6, charsLeft);
                    }
                    // boolean keyword
                    else if (charString.substring(0, 7) == "boolean") {
                        this.generateKeywordToken("boolean", currentIndex);
                        currentIndex += 7;
                        charString = charString.substring(7, charsLeft);
                    }
                    // false
                    else if (charString.substring(0, 5) == "false") {
                        this.generateKeywordToken("false", currentIndex);
                        currentIndex += 5;
                        charString = charString.substring(5, charsLeft);
                    }
                    // true
                    else if (charString.substring(0, 4) == "true") {
                        this.generateKeywordToken("true", currentIndex);
                        currentIndex += 4;
                        charString = charString.substring(4, charsLeft);
                    }
                    // while
                    else if (charString.substring(0, 5) == "while") {
                        this.generateKeywordToken("while", currentIndex);
                        currentIndex += 5;
                        charString = charString.substring(5, charsLeft);
                    }
                    // if
                    else if (charString.substring(0, 2) == "if") {
                        this.generateKeywordToken("if", currentIndex);
                        currentIndex += 2;
                        charString = charString.substring(2, charsLeft);
                    }
                    // print
                    else if (charString.substring(0, 5) == "print") {
                        this.generateKeywordToken("print", currentIndex);
                        currentIndex += 5;
                        charString = charString.substring(5, charsLeft);
                    }
                    // if there isn't a keyword at the beginning of the string,
                    // generate an id token with the first character
                    else {
                        let charToken = charString.substring(0, 1);
                        this.generateKeywordToken(charToken, currentIndex);
                        currentIndex++;
                        charString = charString.substring(1, charsLeft);
                    }
                    charsLeft = charString.length;
                }
            }
            // Quote?
            // MOVE THE CHAR CHECKING TO PARSE
            else if (currentChar == '"') {
                this.generateToken(currentChar);
                this.advance();
                inQuote = true;
                while (inQuote == true) {
                    currentChar = program[this.pos];
                    if (this.isChar(currentChar) || currentChar == ' ') {
                        this.generateCharToken(currentChar);
                        this.advance();
                    }
                    else if (currentChar == '"') {
                        this.generateToken(currentChar);
                        this.advance();
                        inQuote = false;
                    }
                    else if (currentChar == ' ') {
                        this.advance();
                    }
                    else {
                        this.errorStream.push(`ERROR: unidentified character [ ${currentChar} ] in quote at (${this.line},${this.index})`);
                        this.advance();
                    }
                    if (this.pos >= program.length) {
                        this.warningStream.push("WARNING: unterminated string");
                        inQuote = false;
                    }
                }
            }
            // EOP check
            else if (currentChar == '$') {
                this.generateToken(currentChar);
                this.pos++;
                this.index++;
                this.line++;
            }
            // unidentified characters
            else {
                this.errorStream.push(`ERROR: unidentified character [ ${currentChar} ] at (${this.line},${this.index})`);
                console.log(`${currentChar}, (${this.line},${this.index})`);
                this.advance();
            }
        }
        // Checks for an EOP token at the end of the input
        if (input.substring(input.length - 1, input.length) != "$") {
            console.log(input.substring(input.length - 1));
            this.warningStream.push("WARNING: EOP symbol not detected");
            input = input.trim() + " $";
            this.generateToken("$");
        }
        console.log(`output is ${input}`);
        // console.log(this.tokenStream);
        return this.tokenStream;
    }
    // Helper functions -------------------------------------------
    // Look-ahead to the next character in the program
    nextToken(program, position) {
        return program[position + 1];
    }
    // Moves to the next index in the program
    advance() {
        this.pos++;
        this.index++;
    }
    // Checks if the current token is a digit
    isDigit(c) {
        return c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57;
    }
    // Checks if the current token is a character
    isChar(c) {
        return c.charCodeAt(0) >= 97 && c.charCodeAt(0) <= 122;
    }
    // Pushes a token to the stream
    generateToken(s) {
        let ref = this.tokenList.indexOf(s);
        let t = new Token(this.types[ref], this.tokenList[ref], this.line, this.index);
        this.tokenStream.push(t);
        // console.log(`LEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
    }
    // Pushes a keyword token to the stream
    generateKeywordToken(s, i) {
        let ref = this.tokenList.indexOf(s);
        let t = new Token(this.types[ref], this.tokenList[ref], this.line, i);
        this.tokenStream.push(t);
        // console.log(`LEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
    }
    // Pushes a character token to the stream
    generateCharToken(s) {
        let type;
        if (this.isChar(s) || s == " ") {
            type = "T_CHAR";
        }
        else {
            type = "T_DIGIT";
        }
        let t = new Token(type, s, this.line, this.index);
        this.tokenStream.push(t);
        // console.log(`LEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
    }
}
//# sourceMappingURL=lexer.js.map