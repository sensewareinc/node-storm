var q = require('q')

module.exports = function(protocol) {
	var receivedCount = 0
	var ackedOrFailedCount = 0
	var ended = false
	var deferredQueue = []

	var collector = {
		ack: function(data) {
			ackedOrFailedCount++
			protocol.queue({command: 'ack', id: data.id})
			_tryEnd()
		},

		emit: function(tuple, options) {
			var msg = {command: 'emit', tuple: tuple}
			for (var key in options) {
				if (options.hasOwnProperty(key)) {
					msg[key] = options[key]
				}
			}
			protocol.queue(msg)

			var deferred = q.defer()
			deferredQueue.push(deferred)
			return deferred.promise
		},

		fail: function(data) {
			ackedOrFailedCount++
			protocol.queue({command: 'fail', id: data.id})
			_tryEnd()
		},

		log: function(msg) {
			protocol.queue({command: 'log', msg: msg})
		},

		sync: function() {
			protocol.queue({command:'sync'})
			_tryEnd()
		},

		end: function() {
			//Track received vs. acked+failed count, do not end until they match up
			//TODO - need to account for unhandled errors...
			protocol.removeListener('tuple', _incrementReceivedCount)
			protocol.removeListener('next', _incrementReceivedCount)
			ended = true
			_tryEnd()
		}
	}

	function _tryEnd() {
		if (ended && ackedOrFailedCount >= receivedCount) {
			protocol.queue(null)
		}
	}

	function _incrementReceivedCount() {
		receivedCount++
	}

	protocol.on('tuple', _incrementReceivedCount) //Bolt mode
		.on('next', _incrementReceivedCount)      //Spout mode
		.on('tasks', function(tasks) {
			var deferred = deferredQueue.shift()
			deferred.resolve(tasks)
		})

	return collector
}
