var parser = require('./parser')
var formatter = require('./formatter')
var handshake = require('./handshake')
var fs = require('fs')
var path = require('path')

module.exports = function(tasks, topologySpec) {
	return {
		submit: function(name) {
			throw new Error('not implemented')
		},

		runTask: function(id) {
			var task = tasks[id]
			if (task == null) {
				throw new Error('Task with id ' + id + ' not found')
			}
			process.stdin.pipe(parser())
				.pipe(handshake())
				.pipe(task)
				.on('handshake', function(handshake) {
					var pid = process.pid
					task.queue({pid:pid})
					fs.writeFileSync(path.join(handshake.pidDir, '' + pid), '')
				})
				.pipe(formatter())
				.pipe(process.stdout)
		}
	}	
}
