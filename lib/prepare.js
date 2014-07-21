var through = require('event-stream').through

// Ensures the handshake is at the beginning of the stream
module.exports = function() {
	var _queue = []
	var _handshakeReceived = false

	return through(function(data) {
		if (data.conf) {
			this.emit('prepare', data)

			this.queue(data)

			_handshakeReceived = true

			var len = _queue.length
			while(len--) {
				var queued = _queue.shift()
				this.queue(queued)
			}
		} else if (_handshakeReceived) {
			this.queue(data)
		} else {
			_queue.push(data)
		}
	})
}
