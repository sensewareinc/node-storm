var Storm = require('./storm').Storm
var util = require('util')

function BasicBolt() {
	var self = this
	Storm.call(self)
	self.on('tuple', function(data) {
		self.process(data.tuple, data)
		//TODO - each call to emitTuple should anchor to the input tuple
		self.ack(data)
	})
}

util.inherits(BasicBolt, Storm)

BasicBolt.prototype.process = function(tuple) {
}

exports.BasicBolt = BasicBolt
