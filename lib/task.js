var through = require('event-stream').through
var createCollector = require('./collector')

module.exports = function() {
	var task = through(function(data) {
		if (data.conf) {
			this.config = data.conf
			this.context = data.context
			this.emit('prepare', data)
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

	var collector = createCollector(task)
	task.collector = collector

	task.declareOutputFields = function(fields) {
		return this.declareStream('default', false, fields)
	}

	task.declareStream = function(streamId, direct, fields) {
		if (this.streams == null) {
			this.streams = {}
		}
		if (this.streams[streamId] != null) {
			throw new Error('Stream with id \"' + streamId + '\" is already defined')
		}
		this.streams[streamId] = {
			direct: direct,
			output_fields: fields
		}
		return this
	}

	return task
}
