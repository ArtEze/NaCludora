btn={
	limpiar:function(tipo){
		switch (tipo) {
			case 'entrada':txtInput.value = '';break
			case 'salida':txtOutput.value = '';break
			case 'todo':
				txtInput.value = ''
				txtOutput.value = ''
				break
		}
	},
	ejecutar:function() {
		if (txtInput.value == '')
			error('Introduzca algo en el input.')
		else 
			ejecutar_sentencias(analizar(tokenizar(txtInput.value)))
			// Oh kiddo.
	}
}

function variables_varias()
{
	var acceptedSymbols = [
		// Language specifics
		'->', '$', '@', '~', '.', ',', ':', ';', '?', '\\',
		// Arithmethic
		'+', '-', '*', '/', '%', '^', '=',
		// Booleans
		'<=', '<', '==', '!=', '>', '>=', '&&', '||', '!',
		// Braces
		'[', ']', '{', '}', '(', ')',
		// Fractions and special notations
		"frac"
	];
	return acceptedSymbols
}

// Mensaje de error
function error(msg) {
	txtOutput.value += ('[X] - ' + msg + '\n')
}
function warn(msg) {
	txtOutput.value += ('[!] - ' + msg + '\n')
}

// Nodos
function Nodo_genérico(value) {
	this.Value = value
	this.Eval = function() {
		return this.Value
	};
};
function Nodo_negado(negNode) {
	this.Value = negNode
	this.Eval = function() {
		var tmpValue = this.Value.Eval()
		if (tmpValue === true || tmpValue === false)
			return !tmpValue
		return -tmpValue
	}
}
function Nodo_operador_binario(LeftNode, op, RightNode) {
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
function es_letra(c) { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c == '_'); }
function es_dígito(c)  { return isFinite(c) }
function es_comilla(c)  { return (c === '\'' || c === '\"' || c === '\`'); }
function es_símbolo(c) {
	var cadena="+-*/%={}()[]<>&|!^;:?.,$~@"+"\\"
	return cadena.indexOf(c) != -1
}
function es_salto_línea(c) { return (c == '\t' || c == '\r' || c == '\n'); }

function tokenizar(input) {
	var tokens = []
	var tindex = 0
	var current = ''
	var i = 0
	function CurrentChar() { return input[i] }
	function NextChar() { return input[++i] }
	
	while (i < input.length) {
		if (es_salto_línea(CurrentChar()) || CurrentChar() == ' ') 
			NextChar()
		else if (es_comilla(CurrentChar())) {
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
		else if (es_letra(CurrentChar())) {
			// a-zA-Z0-9+
			while (!es_salto_línea(CurrentChar()) && CurrentChar() != ' ' && 
				  (es_letra(CurrentChar()) || es_dígito(CurrentChar()))) {
				current += CurrentChar()
				NextChar()
			}
			tokens[tindex++] = current
		}
		else if (es_dígito(CurrentChar())) {
			while (es_dígito(CurrentChar())) {
				current += CurrentChar()
				NextChar()
			}
			if (CurrentChar() == '.') {
				current += '.'
				NextChar()
				while (es_dígito(CurrentChar())) {
					current += CurrentChar()
					NextChar()
				}
				tokens[tindex++] = parseFloat(current)
			}
			else tokens[tindex++] = parseInt(current)
		}
		else if (es_símbolo(CurrentChar())) {
			current = CurrentChar()
			var operadores = [ 
				"<=", ">=", "==", "!=", "&&", "||",
				"->", "~>", "=>",
				"++", "--", 
				"+=", "-=", "*=", "/=", "%=", "**", // Potencia.
				"<<", ">>", "^=" // Xor.
			]
			if (es_símbolo(NextChar())) {
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

function analizar(tokens) {
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
			rtn = new Nodo_genérico(CurrentToken())
			EatToken()
		}
		else if (CurrentToken() == 'false' || CurrentToken() == 'true') 
			rtn = new Nodo_genérico(CurrentToken() == 'false' ? false : true)
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
			return new Nodo_negado(Factor())
		}
		return Factor()
	}
	function Pwr() {
		var left = NotFactor()
		while (CurrentToken() == '**') {
			EatToken()
			left = new Nodo_operador_binario(left, '**', NotFactor())
		}
		return left
	}
	function Term() {
		var left = Pwr()
		while (CurrentToken() == '*' || CurrentToken() == '/' || CurrentToken() == '%') {
			var op = CurrentToken()
			EatToken()
			left = new Nodo_operador_binario(left, op, Pwr())
		}
		return left
	}
	function ArithExpression() {
		var left = Term()
		while (CurrentToken() == '+' || CurrentToken() == '-') {
			var op = CurrentToken()
			EatToken()
			left = new Nodo_operador_binario(left, op, Term())
		}
		return left
	}
	function Relation() {
		var left = ArithExpression()
		var ops = [ "<=", "<", "==", "!=", ">", ">=" ]
		if (ops.indexOf(CurrentToken()) != -1) {
			var op = CurrentToken()
			EatToken()
			left = new Nodo_operador_binario(left, op, ArithExpression())
		}
		return left
	}
	function NotRelation() {
		if (CurrentToken() == '!') {
			EatToken()
			return new Nodo_negado(Relation())
		}
		return Relation()
	}
	function BoolFactor() {
		var left = NotRelation() 
		while (CurrentToken() == '&&') {
			EatToken()
			left = new Nodo_operador_binario(left, '&&', NotRelation())
		}
		return left
	}
	function BoolTerm() {
		var left = NotRelation() 
		while (CurrentToken() == '||') {
			EatToken()
			left = new Nodo_operador_binario(left, '||', NotRelation())
		}
		return left
	}
	function Expression() {
		return BoolTerm()
	}
	return Expression()
}

function ejecutar_sentencias(NodeList) {
	var tmp = 0
	tmp = NodeList.Eval()
	
	txtOutput.value += 'Resultado: ' + tmp + '\n'
	return tmp
}
