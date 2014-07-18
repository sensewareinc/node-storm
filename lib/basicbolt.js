var bolt = require('./bolt')

module.exports = function(process) {
	return bolt(function(data) {
		process.call(this, data)
		//TODO - each call to emitTuple should anchor to the input tuple
		this.ack(data)
	})
}
