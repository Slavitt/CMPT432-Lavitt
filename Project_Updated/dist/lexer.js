import { Token } from "./Token.js";
/* REMEMBER TO DO THIS
- Implement a Warning class and an Error class.
    - Both should include the message and the coordinates of where the Warning or Error took place.
- String handling
    - start by identifying the open quote
    - while pos < length of program:
        - check for end of string first
        - make sure the next character is either a lowercase letter or a number
            - if yes, make an id token for that letter or a digit token for that number and advance
            - if no, push an error onto the error stack and advance
    - if the program ends, throw a warning onto the stack for an unterminated quote AND unterminated program
- Digit handling
    - if char in [0-9], create a digit token and advance
    
- ID handling and keywords [COME BACK TO THIS LATER]
    - create temp array for holding tokens
    - create string to hold
    - add currentChar into array
    - compare it to the
        
*/
export class Lexer {
    constructor() {
        this.tokenStream = [];
        this.errorStream = [];
        this.warningStream = [];
    }
    generateTokens(input) {
        console.log("hello from lexer.ts");
        console.log("test");
        let program = input + " ";
        // Variables -----------------
        let pos = 0;
        // token position is as follows: [line:index]
        let line = 1;
        let index = 1;
        // Tokens, Errors and Warnings
        let tokenStream = [];
        let errorStream = [];
        let warningStream = [];
        // Dictionaries (courtesy of Aidan Carr, slightly modified by me)
        let tokenList = ["int", "string", "boolean", "while", "if", "false", "true", "print", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "+", "=", "==", "!=", "\"", "(", ")", "{", "}", "/*", "*/", "$", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        let types = ["VARIABLE TYPE", "VARIABLE TYPE", "VARIABLE TYPE", "WHILE", "IF", "BOOL_VAL", "BOOL_VAL", "PRINT", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ADD", "ASSIGN", "BOOL_OP", "BOOL_OP", "QUOTE", "O-PAREN", "C-PAREN", "O-BRACE", "C-BRACE", "OPEN COMMENT", "CLOSE COMMENT", "EOP", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT"];
        // Condition checks
        let inComment = false;
        //
        while (pos < program.length) {
            let currentChar = program[pos];
            let dictRef = tokenList.indexOf(currentChar);
            console.log(this.nextToken(program, pos) == '=');
            if (dictRef < 0) {
                dictRef = 0;
            }
            // Ignore whitespace and tabs (getting rid of that pesky IDE formatting)
            // Move on in the program string and advance the index number for the next token
            if (currentChar == ' ' || currentChar == '\t') {
                console.log("pos + 1: space or tab");
                pos++;
                index++;
            }
            else if (currentChar == '\n') {
                console.log("pos + 1: new line");
                pos++;
                line++;
                index = 1;
            }
            // Comments! Ignore whatever's in them! -------------------------------------------
            else if (currentChar == '/' && this.nextToken(program, pos) == '*') {
                console.log(`pos + 2: comment detected at line ${line}, index ${index}`);
                // Add comment start token
                inComment = true;
                pos += 2;
                index += 2;
                while (inComment && pos + 1 <= program.length) {
                    currentChar = program[pos];
                    if (currentChar == '*' && this.nextToken(program, pos) == '/') {
                        inComment = false;
                        console.log(`pos + 2: comment ended at line ${line}, index ${index}`);
                        // Add comment end token
                        pos += 2;
                        index += 2;
                    }
                    else if (currentChar == '/n') {
                        console.log(`new line in comment at line ${line}, index ${index}`);
                        line++;
                        index = 1;
                    }
                    if (pos + 1 >= program.length) {
                        this.warningStream.push("WARNING: Unterminated comment. Fix this!");
                        console.log("infinite loop - eop check");
                        inComment = false;
                    }
                    pos++;
                    index++;
                }
                console.log(pos + ` ${program[pos]}`);
            }
            // End comment code -----------------------------------------------
            // Single character tokens () and boolean operators
            else if (currentChar == '+') {
                let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                console.log(`\nLEX - ${t.type} [  ${t.value} ] found at (${t.line},${t.index})`);
                tokenStream.push(t);
                pos++;
                index++;
            }
            else if (currentChar == '\"') {
                let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                tokenStream.push(t);
                pos++;
                index++;
            }
            else if (currentChar == '(') {
                let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                tokenStream.push(t);
                pos++;
                index++;
            }
            else if (currentChar == ')') {
                let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                tokenStream.push(t);
                pos++;
                index++;
            }
            else if (currentChar == '{') {
                let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                console.log(`\nLEX - ${t.type} [  ${t.value} ] found at (${t.line},${t.index})`);
                tokenStream.push(t);
                pos++;
                index++;
            }
            else if (currentChar == '}') {
                let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                console.log(`\nLEX - ${t.type} [  ${t.value} ] found at (${t.line},${t.index})`);
                tokenStream.push(t);
                pos++;
                index++;
            }
            // Equals: operator or boolean?
            else if (currentChar == '=') {
                if (this.nextToken(program, pos) == '=') {
                    dictRef = tokenList.indexOf("==");
                    let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                    console.log(`\nLEX - ${t.type} [  ${t.value} ] found at (${t.line},${t.index})`);
                    tokenStream.push(t);
                    pos += 2;
                    index += 2;
                }
                else // next char in the program isn't '='
                 {
                    let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                    console.log(`\nLEX - ${t.type} [  ${t.value} ] found at (${t.line},${t.index})`);
                    tokenStream.push(t);
                    pos++;
                    index++;
                }
            }
            // Not Equals: operator or boolean?
            else if (currentChar == '!') {
                if (this.nextToken(program, pos) == '=') {
                    // add the boolop token
                    dictRef = tokenList.indexOf("!=");
                    let t = new Token(types[dictRef], tokenList[dictRef], line, index);
                    console.log(`\nLEX - ${t.type} [  ${t.value} ] found at (${t.line},${t.index})`);
                    tokenStream.push(t);
                    pos += 2;
                    index += 2;
                }
                else // next char in the program isn't '='
                 {
                    // throw an error and advance
                    errorStream.push(`ERROR: Invalid character [ ${currentChar} ] found at (${line},${index})`);
                    pos++;
                    index++;
                }
            }
            /*
                KEYWORDS: "print"
                elif currentChar is 'i':
                    if nextToken is 'n':
                        int token
                    elif nextToken is 'f':
                        if token
                    else:
                        id token for 'i'

                elif currentChar is 'b':
                    if nextToken is 'o':
                        boolean token
                    else:
                        id token for 'b'

                elif currentChar is 'f':
                    if nextToken is 'a':
                        false token
                    else:
                        id token for 'f'
                
                elif currentChar is 't':
                    if nextToken is 'r':
                        true token
                    else:
                        id token for 't'

                elif currentChar is 's':
                    if nextToken is 't':
                        string token
                    else:
                        id token for 's'
                
                elif currentChar is 'w':
                    if nextToken is 'h':
                        while token
                    else:
                        id token for 'w'

                elif currentChar is 'p':
                    if nextToken is 'r':
                        print token
                    else:
                        id token for 'p'
            */
            // EOP check
            else {
                console.log(pos);
                pos++;
            }
        }
        console.log(`output is ${input}`);
        return tokenStream;
    }
    // Helper functions
    nextToken(program, position) {
        return program[position + 1];
    }
}
//# sourceMappingURL=lexer.js.map