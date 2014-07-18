var protocol = require('./protocol')

module.exports = function(process) {
	var bolt = protocol()
	bolt.on('tuple', function(data) {
		process.call(bolt.collector, data)
	})
	return bolt
}
