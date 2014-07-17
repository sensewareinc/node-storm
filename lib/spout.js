var Storm = require('./storm').Storm
var util = require('util')

function Spout() {
	var self = this
	Storm.call(self)
	self.on('command', function(data) {
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

exports.Spout = Spout
