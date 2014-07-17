var Transform = require('stream').Transform
var util = require('util')

function OutputProtocol() {
	Transform.call(this, {objectMode:true})
}

util.inherits(OutputProtocol, Transform)

OutputProtocol.prototype._transform = function(data, encoding, callback) {
	this.push(JSON.stringify(data) + '\nend\n')
	callback()
}

exports.OutputProtocol = OutputProtocol
