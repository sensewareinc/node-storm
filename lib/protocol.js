var through = require('event-stream').through

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
	})

	protocol.ack = function(tuple) {
		this.queue({command: 'ack', id: tuple.id})
	}

	protocol.emitTuple = function(tuple, options) {
		var msg = {command: 'emit', tuple: tuple}
		for (var key in options) {
			if (options.hasOwnProperty(key)) {
				msg[key] = options[key]
			}
		}
		this.queue(msg)
	}

	protocol.fail = function(tuple) {
		this.queue({command: 'fail', id: tuple.id})
	}

	protocol.log = function(msg) {
		this.queue({command: 'log', msg: msg})
	}

	return protocol
}
