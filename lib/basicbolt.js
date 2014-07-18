var protocol = require('./protocol')

module.exports = function(process) {
	var bolt = protocol()
	bolt.on('tuple', function(data) {
		process.call(bolt, data.tuple, data)
		//TODO - each call to emitTuple should anchor to the input tuple
		bolt.ack(data)
	})
	return bolt
}
