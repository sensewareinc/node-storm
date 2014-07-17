var InputProtocol = require('./input_protocol').InputProtocol
var OutputProtocol = require('./output_protocol').OutputProtocol
var Storm = require('./storm').Storm
var util = require('util')

function BasicBolt() {
	Storm.call(this)
}

util.inherits(BasicBolt, Storm)

BasicBolt.prototype.process = function(tuple) {
}

BasicBolt.prototype.run = function() {
	var self = this
	process.stdin.pipe(new InputProtocol())
		.pipe(this)
		.on('tuple', function(data) {
			self.process(data.tuple, data)
			//TODO - each call to emitTuple should anchor to the input tuple
			self.ack(data)
		})
		.pipe(new OutputProtocol())
		.pipe(process.stdout)
}

exports.BasicBolt = BasicBolt
