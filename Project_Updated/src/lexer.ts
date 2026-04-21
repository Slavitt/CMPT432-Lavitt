import { Token } from "./Token.js";

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

export class Lexer
{
    tokenStream: Token[] = [];
    errorStream: String[] = [];
    warningStream: String[] = [];

    pos: number = 0;
    index: number = 1;

    constructor() { }

    generateTokens(input: string): Token[]
    {
        console.log("hello from lexer.ts");
        let program = input + " ";

        // Variables -----------------
        let line: number = 1;


        // Tokens, Errors and Warnings
        let tokenStream: Token[] = [];
        let errorStream: String[] = [];
        let warningStream: String[] = [];

        // Dictionaries (courtesy of Aidan Carr, slightly modified by me)
        let tokenList = ["int",           "string",        "boolean",       "while", "if",  "false",     "true",   "print", "a",  "b",  "c",  "d",  "e",  "f",  "g",  "h",  "i",  "j",  "k",  "l",  "m",  "n",  "o",  "p",  "q",  "r",  "s",  "t",  "u",  "v",  "w",  "x",  "y",  "z", "+",      "=",     "==",      "!=",       "\"",       "(",       ")",       "{",       "}",       "/*",          "*/",         "$",    "0",     "1",     "2",      "3",    "4",     "5",     "6",     "7",     "8",     "9",    '"'];
        let types =    ["VARIABLE TYPE", "VARIABLE TYPE", "VARIABLE TYPE", "WHILE", "IF", "BOOL_VAL", "BOOL_VAL", "PRINT", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ADD", "ASSIGN", "BOOL_OP", "BOOL_OP", "QUOTE", "O-PAREN", "C-PAREN", "O-BRACE", "C-BRACE",  "OPEN COMMENT", "CLOSE COMMENT", "EOP", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "QUOTE"];

        // Condition checks
        let inComment: boolean = false;
        let inQuote: boolean = false;


        while (this.pos < program.length)
        {
            let currentChar = program[this.pos];
            console.log(currentChar);
            let dictRef: number = tokenList.indexOf(currentChar);

            if (dictRef < 0)
            {
                dictRef = 0;
            }

            // Ignore whitespace and tabs (getting rid of that pesky IDE formatting)
            // Move on in the program string and advance the index number for the next token
            if (currentChar == ' ' || currentChar == '\t')
            {
                console.log("pos + 1: space or tab");
                this.advance();
            }
            else if (currentChar == '\n')
            {
                console.log("pos + 1: new line");
                this.advance();
                this.index = 1;
                line++;
            }

            // Comments! Ignore whatever's in them! -------------------------------------------
            else if (currentChar == '/' && this.nextToken(program, this.pos) == '*')
            {
                dictRef = tokenList.indexOf("/*");
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                tokenStream.push(t);
                inComment = true;
                this.advance();
                this.advance();

                while (inComment && this.pos + 1 <= program.length)
                {
                    currentChar = program[this.pos];
                    if (currentChar == '*' && this.nextToken(program, this.pos) == '/')
                    {
                        inComment = false;
                        dictRef = tokenList.indexOf("*/");
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                        tokenStream.push(t);
                        this.advance();
                        this.advance();
                    }
                    else if (currentChar == '\n')
                    {
                        console.log(`new line in comment at line ${line}, index ${this.index}`);
                        line++;
                        this.index = 1;
                    }

                    if (this.pos + 1 >= program.length)
                    {
                        this.warningStream.push("WARNING: Unterminated comment. Fix this!");
                        inComment = false;
                    }
                    this.advance();
                }
            }
            // End comment code -----------------------------------------------

            // Single character tokens () and boolean operators
            else if (currentChar == '+')
            {
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                tokenStream.push(t);
                this.advance();
            }
            else if (currentChar == '(')
            {
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                tokenStream.push(t);
                this.advance();
            }
            else if (currentChar == ')')
            {
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                tokenStream.push(t);
                this.advance();
            }
            else if (currentChar == '{')
            {
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                tokenStream.push(t);
                this.advance();
            }
            else if (currentChar == '}')
            {
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                tokenStream.push(t);
                this.advance();
            }

            // Equals: operator or boolean?
            else if (currentChar == '=')
            {
                if (this.nextToken(program, this.pos) == '=')
                {
                    dictRef = tokenList.indexOf("==");
                    let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                    tokenStream.push(t);
                    this.advance();
                    this.advance();
                }
                else // next char in the program isn't '='
                {
                    let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                    tokenStream.push(t);
                    this.advance();
                }
            }

            // Not Equals: operator or boolean?
            else if (currentChar == '!')
            {
                if (this.nextToken(program, this.pos) == '=')
                {
                    // add the boolop token
                    dictRef = tokenList.indexOf("!=");
                    let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                    tokenStream.push(t);
                    this.pos += 2;
                    this.index += 2;
                }
                else // next char in the program isn't '='
                {
                    // throw an error and advance
                    errorStream.push(`ERROR: Invalid character [ ${currentChar} ] found at (${line},${this.index})`);
                    this.advance();
                }
            }

            // Digit?
            else if (this.isDigit(currentChar))
            {
                console.log()
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                console.log(`\nLEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
                tokenStream.push(t);
                this.advance();
            }

            // Character?
            else if (this.isChar(currentChar))
            {
                let charString = "";
                let currentIndex = this.index;

                console.log(`${charString}`);

                while (this.pos < program.length && this.isChar(currentChar))
                {
                    charString += currentChar;
                    this.advance();
                    currentChar = program[this.pos];
                }

                let strLength = charString.length;
                console.log(`${charString.substring(0, 2)}`);

                while (strLength > 0)
                {
                    if (strLength == 1)
                    {
                        dictRef = tokenList.indexOf(charString);
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, currentIndex);
                        tokenStream.push(t);

                        charString = "";
                    }
                    else if (charString.substring(0, 3) == "int")
                    {
                        this.generateKeywordToken("int", line, currentIndex)
                        dictRef = tokenList.indexOf("int");
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, currentIndex);
                        tokenStream.push(t);
                        currentIndex += 3;
                        charString = charString.substring(3, strLength);
                    }
                    else
                    {
                        let charToken = charString.substring(0, 1);
                        dictRef = tokenList.indexOf(charToken);
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, currentIndex);
                        tokenStream.push(t);
                        currentIndex++;

                        charString = charString.substring(1, strLength);
                    }
                    strLength = charString.length;
                }
                /* while (strLength > 0)
                {
                    if (strLength == 1)
                    {
                        //id token
                        strLength = 0;
                    }
                    else if (strLength >= 3 && charString.substring(0, 2) == "int")
                    {
                        dictRef = tokenList.indexOf("int");
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, currentIndex);
                        tokenStream.push(t);

                        charString = charString.substring(3, strLength - 1);
                        currentIndex += 3;
                    }
                    else if (strLength >= 6 && charString.substring(0, 5) == "string")
                    {
                        dictRef = tokenList.indexOf("string");
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, currentIndex);
                        tokenStream.push(t);

                        charString = charString.substring(6, strLength - 1);
                        currentIndex += 6;
                    }
                    else if (strLength >= 7 && charString.substring(0, 6) == "boolean")
                    {

                    }
                    else if (strLength >= 5 && charString.substring(0, 4) == "while")
                    {

                    }
                    else if (strLength >= 2 && charString.substring(0, 1) == "if")
                    {

                    }
                    else if (strLength >= 5 && charString.substring(0, 4) == "false")
                    {

                    }
                    else if (strLength >= 4 && charString.substring(0, 3) == "true")
                    {

                    }
                    else if (strLength >= 5 && charString.substring(0, 4) == "print")
                    {

                    }
                    else
                    {
                        // id token
                        charString = charString.substring(1, strLength - 1);
                        strLength--;
                    }
                }*/
            }

            // Quote?
            else if (currentChar == '"')
            {
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                console.log(`\nLEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
                tokenStream.push(t);
                console.log(t);
                inQuote = true;
                this.advance();

                
                while (inQuote == true)
                {
                    currentChar = program[this.pos];
                    dictRef = tokenList.indexOf(currentChar);
                    if (this.isDigit(currentChar) || this.isChar(currentChar))
                    {
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                        console.log(`\nLEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
                        tokenStream.push(t);
                        this.advance();
                    }
                    else if (currentChar == '"')
                    {
                        let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                        console.log(`\nLEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
                        tokenStream.push(t);
                        this.advance();
                        
                        inQuote = false;
                    }
                    else
                    {
                        this.errorStream.push("ERROR: unrecognized character");
                        this.advance();
                        console.log(this.pos);
                    }

                    if (this.pos >= program.length)
                    {
                        this.warningStream.push("WARNING: unterminated string");
                        inQuote = false;

                    }
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
            else if (currentChar == '$')
            {
                let t: Token = new Token(types[dictRef], tokenList[dictRef], line, this.index);
                console.log(`\nLEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
                tokenStream.push(t);
                this.pos++;
                this.index++;
                line++;
            }
        }

        
        console.log(`output is ${input}`);
        
        this.tokenStream = tokenStream;
       
        console.log(this.tokenStream);
        return tokenStream;
    }

    // Helper functions
    public nextToken(program: String, position: number): String
    {
        return program[position + 1];
    }

    public advance(): void
    {
        this.pos++;
        this.index++;
    }

    public isDigit(c: string): boolean
    {
        return c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57;
    }

    public isChar(c: string): boolean
    {  
        console.log(`${c} ${c.charCodeAt(0)}`)
        return c.charCodeAt(0) >= 97 && c.charCodeAt(0) <= 122;
    }

    public handleKeyword(): void
    {

    }

    public generateKeywordToken(t: string, line: number, index: number): void
    {

    }
}