var through = require('event-stream').through
var createCollector = require('./collector')

module.exports = function() {
	var protocol = through(function(data) {
		if (data.conf) {
			this.config = data.conf
			this.context = data.context
			this.emit('handshake', data)
		} else if (data instanceof Array) {
			this.emit('tasks', data)
		} else if (data.command) {
			this.emit(data.command, data)
		} else {
			this.emit('tuple', data)
		}
	}, function() {
		collector.end()
	})

	var collector = createCollector(protocol)
	protocol.collector = collector

	return protocol
}
