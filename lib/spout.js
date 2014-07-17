var InputProtocol = require('./input_protocol').InputProtocol
var OutputProtocol = require('./output_protocol').OutputProtocol
var Storm = require('./storm').Storm
var util = require('util')

function Spout() {
	Storm.call(this)
}

util.inherits(Spout, Storm)

Spout.prototype.nextTuple = function() {
}

Spout.prototype.async = function() {
	//TODO - need to pause the stream....
	var self = this
	self.isAsync = true
	return function() {
		delete self.isAsync
		self.sync()
	}
}

Spout.prototype.run = function() {
	var self = this
	process.stdin.pipe(new InputProtocol())
		.pipe(this)
		.on('command', function(data) {
			if (data["command"] == "next") {
				self.nextTuple()
			} else if (data["command"] == "ack") {
				self.emit('ack', data.id)
			} else if (data["command"] == "fail") {
				self.emit('fail', data.id)
			}
			if (!self.isAsync) {
				self.sync()
			}
		})
		.pipe(new OutputProtocol())
		.pipe(process.stdout)
}

exports.Spout = Spout
