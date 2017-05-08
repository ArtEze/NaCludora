window.onLoad = function inicio() {
	// Carga los eventos y esas weas.
    btnLimpiar.addEventListener("click", function() {
    	txtInput.value = ''
        txtOutput.value = ''
    })
    btnEjecutar.addEventListener("click", function() {
    	if (txtInput.value == '')
        	error('Introduzca algo en el input.')
        else 
        	Exec(Parse(Tokenize(txtInput.value)))
            // Oh kiddo.
    })
}

// Mensaje de error
function error(msg) {
	txtOutput.value += ('[X] - ' + msg + '\n')
}
function warn(msg) {
	txtOutput.value += ('[!] - ' + msg + '\n')
}

// Nodos
function GenericNode(value) {
	this.Value = value
    this.Eval = function() {
    	return this.Value
    };
};

function NegateNode(negNode) {
	this.Value = negNode
    this.Eval = function() {
    	var tmpValue = this.Value.Eval()
    	if (tmpValue === true || tmpValue === false)
        	return !tmpValue
        return -tmpValue
    }
}

function BinOpNode(LeftNode, op, RightNode) {
	this.Left = LeftNode
    this.Right = RightNode
    this.Op = op
    this.Eval = function() { 
        var left = this.Left.Eval()
        var right = this.Right.Eval()
        switch (this.Op) {
        	case '+': return left + right; 
            case '-': return left - right;
            case '*': return left * right;
            case '/': {
            	if (right === 0) {
                	warn('Division entre cero, invirtiendo.')
                    return right / left;
                }
                return left / right
            }
            case '%': {
            	if (right === 0) {
                	warn('Division entre cero, invirtiendo.')
                    return right % left;
                }
                return left % right
            }
            case '**': return Math.pow(left, right);
            case '<=': return left <= right;
            case '<': return left < right;
            case '==': return left == right
            case '!=': return left != right
            case '>': return left > right
            case '>=': return left >= right
            case '&&': return left && right
            case '||': return left || right
        }
    }
}
// Si, el underscore es considerado una letra.
function IsLetter(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c == '_'); }
function IsDigit(c)  { return isFinite(c) }
function IsQuote(c)  { return (c === '\'' || c === '\"' || c === '\`'); }
function IsSymbol(c) { 
    var cadena="+-*/%={}()[]<>&|!^;:?.,$~@"+"\\"
    return cadena.indexOf(c) != -1
}
function IsLF(c) { return (c == '\t' || c == '\r' || c == '\n'); }

function Tokenize(input) {
	var tokens = []
    var tindex = 0
    var current = ''
    var i = 0
    function CurrentChar() { return input[i] }
	function NextChar() { return input[++i] }
    
    while (i < input.length) {
    	if (IsLF(CurrentChar()) || CurrentChar() == ' ') 
        	NextChar()
        else if (IsQuote(CurrentChar())) {
        	var quote = CurrentChar()
            NextChar()
        	while (CurrentChar() != quote) {
            	current += CurrentChar()
                NextChar()
            }
            if (CurrentChar() != quote) {
            	error('String sin terminar.')
                return undefined
            }
            tokens[tindex++] = current
            NextChar() // Come la comilla que queda.
        }
        else if (IsLetter(CurrentChar())) {
        	// a-zA-Z0-9+
        	while (!IsLF(CurrentChar()) && CurrentChar() != ' ' && 
                  (IsLetter(CurrentChar()) || IsDigit(CurrentChar()))) {
            	current += CurrentChar()
            	NextChar()
            }
            tokens[tindex++] = current
        }
        else if (IsDigit(CurrentChar())) {
        	while (IsDigit(CurrentChar())) {
            	current += CurrentChar()
                NextChar()
            }
            if (CurrentChar() == '.') {
            	current += '.'
                NextChar()
                while (IsDigit(CurrentChar())) {
                    current += CurrentChar()
                    NextChar()
                }
                tokens[tindex++] = parseFloat(current)
            }
            else tokens[tindex++] = parseInt(current)
        }
        else if (IsSymbol(CurrentChar())) {
        	current = CurrentChar()
            var operadores = [ 
            	"<=", ">=", "==", "!=", "&&", "||",
                "->", "~>", "=>",
                "++", "--", 
                "+=", "-=", "*=", "/=", "%=", "**", // Potencia.
                "<<", ">>", "^=" // Xor.
            ]
            if (IsSymbol(NextChar())) {
            	var tmp = current + CurrentChar()
            	if (operadores.indexOf(tmp) != -1) {
                	NextChar()
                    current = tmp
                }
            }
            tokens[tindex++] = current
        }
        else if (CurrentChar() == '#') {
        	while (i < input.length && CurrentChar() != '\n') NextChar()
        }
        else {
        	warn('Caracter desconocido: ' + CurrentChar() + ', saltando.')
            NextChar()
        }
        current = ''
    }
    return tokens
}

function Parse(tokens) {
	var CTokPos = 0
	function EatToken() {
        return tokens[++CTokPos]
    }
    function CurrentToken() {
    	return tokens[CTokPos]
    }
	function Factor() {
    	var rtn = null
        if (isFinite(CurrentToken()) || typeof(CurrentToken()) == 'string') {
        	rtn = new GenericNode(CurrentToken())
            EatToken()
        }
        else if (CurrentToken() == 'false' || CurrentToken() == 'true') 
        	rtn = new GenericNode(CurrentToken() == 'false' ? false : true)
        else if (CurrentToken() == '(') {
        	EatToken()
            rtn = Expression()
            EatToken()
        }
        return rtn
    }
    function NotFactor() {
    	if (CurrentToken() == '-') {
        	EatToken()
            return new NegateNode(Factor())
        }
        return Factor()
    }
    function Pwr() {
    	var left = NotFactor()
        while (CurrentToken() == '**') {
        	EatToken()
        	left = new BinOpNode(left, '**', NotFactor())
        }
        return left
    }
	function Term() {
    	var left = Pwr()
        while (CurrentToken() == '*' || CurrentToken() == '/' || CurrentToken() == '%') {
        	var op = CurrentToken()
            EatToken()
            left = new BinOpNode(left, op, Pwr())
        }
        return left
    }
	function ArithExpression() {
    	var left = Term()
        while (CurrentToken() == '+' || CurrentToken() == '-') {
        	var op = CurrentToken()
            EatToken()
            left = new BinOpNode(left, op, Term())
        }
        return left
    }
    function Relation() {
    	var left = ArithExpression()
        var ops = [ "<=", "<", "==", "!=", ">", ">=" ]
        if (ops.indexOf(CurrentToken()) != -1) {
        	var op = CurrentToken()
            EatToken()
            left = new BinOpNode(left, op, ArithExpression())
        }
        return left
    }
    function NotRelation() {
    	if (CurrentToken() == '!') {
        	EatToken()
            return new NegateNode(Relation())
        }
    	return Relation()
    }
    function BoolFactor() {
    	var left = NotRelation() 
        while (CurrentToken() == '&&') {
        	EatToken()
            left = new BinOpNode(left, '&&', NotRelation())
        }
        return left
    }
    function BoolTerm() {
    	var left = NotRelation() 
        while (CurrentToken() == '||') {
        	EatToken()
            left = new BinOpNode(left, '||', NotRelation())
        }
        return left
    }
    function Expression() {
    	return BoolTerm()
    }
    return Expression()
}

function Exec(NodeList) {
	var tmp = 0
    tmp = NodeList.Eval()
    
    txtOutput.value += 'Resultado: ' + tmp + '\n'
    return tmp
}
