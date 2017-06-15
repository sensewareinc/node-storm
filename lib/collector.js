var q = require('q')

module.exports = function(task) {
	var receivedCount = 0
	var ackedOrFailedCount = 0
	var ended = false

	var collector = {

		context: function(){
			return task.context;
		},

		ack: function(data, skipAckMessage) {
			ackedOrFailedCount++
			if(!skipAckMessage){
				task.queue({command: 'ack', id: data.id})
			}
			_tryEnd()
		},

		emit: function(tuple, options) {
			var msg = {command: 'emit', tuple: tuple, 'need_task_ids':false}
			for (var key in options) {
				if (options.hasOwnProperty(key)) {
					msg[key] = options[key]
				}
			}
			task.queue(msg)
		},

		fail: function(data) {
			ackedOrFailedCount++
			task.queue({command: 'fail', id: data.id})
			_tryEnd()
		},

		log: function(msg) {			
			task.queue({command: 'log', msg: msg})
		},

		debug: function(msg){
			if(this.context().config('topology.debug')){				
				return this.log(msg);
			}
		},

		sync: function() {
			ackedOrFailedCount++
			task.queue({command:'sync'})
			_tryEnd()
		},

		end: function() {
			//Track received vs. acked+failed count, do not end until they match up
			task.removeListener('tuple', _incrementReceivedCount)
			task.removeListener('next', _incrementReceivedCount)
			task.removeListener('tasks', _returnTaskArray)
			ended = true
			_tryEnd()
		}
	}

	function _tryEnd() {
		if (ended && ackedOrFailedCount >= receivedCount) {
			task.queue(null)
		}
	}

	function _incrementReceivedCount() {
		receivedCount++
	}

	function _returnTaskArray(tasks) {}


	function _syncAfterHeartbeat(){
		_incrementReceivedCount();
		collector.sync();
	}

	task.on('__heartbeat', _syncAfterHeartbeat) //Bolt keep-alive
		.on('tuple', _incrementReceivedCount) //Bolt mode
		.on('next', _incrementReceivedCount)  //Spout mode
		.on('activate', _syncAfterHeartbeat)  //Spout was activated and needs to sync
		.on('tasks', _returnTaskArray);

	return collector
}
