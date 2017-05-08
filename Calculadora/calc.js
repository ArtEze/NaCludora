// Objetos
function NumberNode(value) {
	this.value = value
    this.eval = function() {
    	return this.value
    };
    return this
}
function NegNumberNode(value) {
	this.value = value
    this.eval = function() {
    	return -(this.value.eval())
    };
}

function BinOpNode(left, op, right) {
	this.left = left
    this.right = right
    this.operator = op
    this.eval = function () {
        var leftValue = left.eval()
        var rightValue = right.eval()
    	switch (this.operator) {
        	case '+': 
            	return leftValue + rightValue
            case '-':
            	return leftValue - rightValue
            case '*':
            	return leftValue * rightValue
            case '/': {
            	if (rightValue === 0) {
                	alert('Division entre CERO! Devuelve cero, segun mis leyes de matematica.')
                    return 0
                }
                return leftValue / rightValue
            }
            case '^': 
            	return Math.pow(leftValue, rightValue)
        }
        return value
    };
}


// Determina si es un simbolo.
function isCustom(c) {
	var arith = (c == '+' || c == '-' || c == '*' || c == '/')
    var brace = (c == '(' || c == ')' || c == '[' || c == ']' 
              || c == '{' || c == '}' || c == '%' || c == '^')
	return (arith || brace)
}

// Convierte la entrada en muchos tokens
function tokenize(text) {
	var tokens = []
    var index  = 0
    var tindex = 0
    while (index < text.length) {
    	// Solo pongo los mas comunes, mientras tanto.
    	if (text[index] == ' ' || text[index] == '\t') 
        	++index
    	else if (isFinite(text[index])) {
        	var t = ''
        	while (isFinite(text[index])) 
            	t += text[index++]
            tokens[tindex++] = parseInt(t)
        }
        else if (isCustom(text[index])) {
        	tokens[tindex++] = text[index++]
        }
    }
    return tokens
}
function eatToken() { return Tokens[++t_index] }
function eof() { return t_index >= Tokens.length }
function factor() {
	if (isFinite(Tokens[t_index])) {
    	var value = Tokens[t_index]
        eatToken()
    	return new NumberNode(value)
    }
    else if (Tokens[t_index] == '(') {
    	eatToken() // Come el (
        var h = expression()
        eatToken() // Come el )
        return h
    }
    return null
}

function notfactor() {
	if (Tokens[t_index] == '-') {
    	eatToken()
        return new NegNumberNode(factor())
    } 
    return factor()
}

function pwr() {
	var left = notfactor()
    while (Tokens[t_index] == '^') {
    	eatToken()
        left = new BinOpNode(left, '^', notfactor())
    }
    return left
}

function term() {
	var left = pwr()
    while (Tokens[t_index] == '*' || Tokens[t_index] == '/') {
    	var op = Tokens[t_index]
        eatToken()
        left = new BinOpNode(left, op, pwr())
    }
    return left
}

function expression() {
	var left = term()
    while (Tokens[t_index] == '+' || Tokens[t_index] == '-') {
    	var op = Tokens[t_index]
        eatToken()
        left = new BinOpNode(left, op, term())
    }
    return left
}

// Parsea esos tokens.
function parse(tokens) {
	t_index = 0
	Tokens = tokens
	var tmp = expression().eval()
    return tmp
}
window.onload=function ininio()
{
	Tokens  = []
	t_index = 0

	// Olvidemonos de estos seniores.
	btnClear.addEventListener("click", function() {
		expresion.value = '' 
		lblResultado.innerHTML = ''
		Tokens = null
		t_index = 0
	})
	btnParse.addEventListener("click", function () {
		lblResultado.innerHTML = parse(tokenize(expresion.value))
	})
}
