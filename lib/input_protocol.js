var Transform = require('stream').Transform
var util = require('util')

function InputProtocol() {
	Transform.call(this, {objectMode: true})
	this.text = ''
}

util.inherits(InputProtocol, Transform)

InputProtocol.prototype._transform = function(data, encoding, callback) {
	this._process(data)
	callback()
}

InputProtocol.prototype._flush = function(callback) {
	this._process('', true)
	callback()
}

InputProtocol.prototype._process = function(data, end) {
	this.text += data
	commands = this.text.split('\nend\n')

	var len = commands.length
	if (!end) {
		len--
		this.text = commands[len]
	}

	for (var i = 0; i < len; ++i) {
		var command = commands[i].trim()
		if (command) {
			this.push(JSON.parse(command))
		}
	}
}

exports.InputProtocol = InputProtocol
