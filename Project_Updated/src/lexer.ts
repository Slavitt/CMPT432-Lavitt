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
    line: number = 1;

    tokenList: string[] = ["int",           "string",        "boolean",      "while", "if",  "false",     "true",   "print", "a",  "b",  "c",  "d",  "e",  "f",  "g",  "h",  "i",  "j",  "k",  "l",  "m",  "n",  "o",  "p",  "q",  "r",  "s",  "t",  "u",  "v",  "w",  "x",  "y",  "z", "+",      "=",     "==",      "!=",       "\"",       "(",       ")",       "{",       "}",       "/*",          "*/",         "$",    "0",     "1",     "2",      "3",    "4",     "5",     "6",     "7",     "8",     "9",    '"'];
    types: string[] =    ["VARIABLE TYPE", "VARIABLE TYPE", "VARIABLE TYPE", "WHILE", "IF", "BOOL_VAL", "BOOL_VAL", "PRINT", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ID", "ADD", "ASSIGN", "BOOL_OP", "BOOL_OP", "QUOTE", "O-PAREN", "C-PAREN", "O-BRACE", "C-BRACE",  "OPEN COMMENT", "CLOSE COMMENT", "EOP", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "DIGIT", "QUOTE"];
    
    constructor() { }

    generateTokens(input: string): Token[]
    {
        console.log("hello from lexer.ts");
        let program = input + " ";

        // Condition checks
        let inComment: boolean = false;
        let inQuote: boolean = false;

        while (this.pos < program.length)
        {
            let currentChar = program[this.pos];
            console.log(currentChar);

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
                this.line++;
            }

            // Comments! Ignore whatever's in them! -------------------------------------------
            else if (currentChar == '/' && this.nextToken(program, this.pos) == '*')
            {
                this.generateToken("/*");
                inComment = true;
                this.advance();
                this.advance();

                while (inComment && this.pos + 1 <= program.length)
                {
                    currentChar = program[this.pos];
                    if (currentChar == '*' && this.nextToken(program, this.pos) == '/')
                    {
                        inComment = false;
                        this.generateToken("*/");
                        this.advance();
                        this.advance();
                    }
                    else if (currentChar == '\n')
                    {
                        console.log(`new line in comment at line ${this.line}, index ${this.index}`);
                        this.line++;
                        this.index = 1;
                    }

                    if (this.pos >= program.length)
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
                this.generateToken("+");
                this.advance();
            }
            else if (currentChar == '(')
            {
                this.generateToken("(");
                this.advance();
            }
            else if (currentChar == ')')
            {
                this.generateToken(")");
                this.advance();
            }
            else if (currentChar == '{')
            {
                this.generateToken("{");
                this.advance();
            }
            else if (currentChar == '}')
            {
                this.generateToken("}");
                this.advance();
            }

            // Equals: operator or boolean?
            else if (currentChar == '=')
            {
                if (this.nextToken(program, this.pos) == '=')
                {
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
            else if (currentChar == '!')
            {
                if (this.nextToken(program, this.pos) == '=')
                {
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
            else if (this.isDigit(currentChar))
            {
                this.generateToken(currentChar);
                this.advance();
            }

            // Character?
            else if (this.isChar(currentChar))
            {
                let charString = "";
                let currentIndex = this.index;

                while (this.pos < program.length && this.isChar(currentChar))
                {
                    charString += currentChar;
                    this.advance();
                    currentChar = program[this.pos];
                }

                let charsLeft = charString.length;

                while (charsLeft > 0)
                {
                    if (charsLeft == 1)
                    {
                        this.generateKeywordToken(charString, currentIndex);
                        charString = "";
                    }

                    // int keyword
                    else if (charString.substring(0, 3) == "int")
                    {
                        this.generateKeywordToken("int", currentIndex);
                        currentIndex += 3;
                        charString = charString.substring(3, charsLeft);
                    }

                    // string keyword
                    else if (charString.substring(0, 6) == "string")
                    {
                        this.generateKeywordToken("string", currentIndex);
                        currentIndex += 6;
                        charString = charString.substring(6, charsLeft);
                    }

                    // boolean keyword
                    else if (charString.substring(0, 7) == "boolean")
                    {
                        this.generateKeywordToken("boolean", currentIndex);
                        currentIndex += 7;
                        charString = charString.substring(7, charsLeft);
                    }

                    // false
                    else if (charString.substring(0, 5) == "false")
                    {
                        this.generateKeywordToken("false", currentIndex);
                        currentIndex += 5;
                        charString = charString.substring(5, charsLeft);
                    }

                    // true
                    else if (charString.substring(0, 4) == "true")
                    {
                        this.generateKeywordToken("true", currentIndex);
                        currentIndex += 4;
                        charString = charString.substring(4, charsLeft);
                    }

                    // while
                    else if (charString.substring(0, 5) == "while")
                    {
                        this.generateKeywordToken("while", currentIndex);
                        currentIndex += 5;
                        charString = charString.substring(5, charsLeft);
                    }

                    // if
                    else if (charString.substring(0, 2) == "if")
                    {
                        this.generateKeywordToken("if", currentIndex);
                        currentIndex += 2;
                        charString = charString.substring(2, charsLeft);
                    }

                    // print
                    else if (charString.substring(0, 5) == "print")
                    {
                        this.generateKeywordToken("print", currentIndex);
                        currentIndex += 5;
                        charString = charString.substring(5, charsLeft);
                    }

                    // if there isn't a keyword at the beginning of the string,
                    // generate an id token with the first character
                    else
                    {
                        let charToken = charString.substring(0, 1);
                        this.generateKeywordToken(charToken, currentIndex);
                        currentIndex++;

                        charString = charString.substring(1, charsLeft);
                    }

                    charsLeft = charString.length;
                }
            }

            // Quote?
            else if (currentChar == '"')
            {
                this.generateToken(currentChar);
                this.advance();

                inQuote = true;
                
                while (inQuote == true)
                {
                    currentChar = program[this.pos];
                    if (this.isDigit(currentChar) || this.isChar(currentChar))
                    {
                        this.generateToken(currentChar);
                        this.advance();
                    }
                    else if (currentChar == '"')
                    {
                        this.generateToken(currentChar);
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

            // EOP check
            else if (currentChar == '$')
            {
                this.generateToken(currentChar);
                this.pos++;
                this.index++;
                this.line++;
            }
        }

        
        console.log(`output is ${input}`);
       
        console.log(this.tokenStream);
        return this.tokenStream;
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

    public generateToken(s: string): void
    {
        let ref: number = this.tokenList.indexOf(s);
        let t: Token = new Token(this.types[ref], this.tokenList[ref], this.line, this.index);
        this.tokenStream.push(t);

        console.log(`\nLEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
    }

    public generateKeywordToken(s: string, i: number): void
    {
        let ref: number = this.tokenList.indexOf(s);
        let t: Token = new Token(this.types[ref], this.tokenList[ref], this.line, i);
        this.tokenStream.push(t);

        console.log(`\nLEX - ${t.type} [ ${t.value} ] found at (${t.line},${t.index})`);
    }
}