var protocol = require('./protocol')

module.exports = function(process) {
	var bolt = protocol()
	bolt.on('tuple', function(data) {
		process.call(bolt.collector, data)
		//TODO - each call to emitTuple should anchor to the input tuple
		bolt.collector.ack(data)
	})
	return bolt
}
