var parser = require('./parser')
var formatter = require('./formatter')
var prepare = require('./prepare')
var fs = require('fs')
var path = require('path')
var es = require('event-stream')

module.exports = function(topology) {
	var front = parser()
	var back = formatter()
	var duplex = es.duplex(front, back)

	var frontmatter = front.pipe(prepare())
		.on('prepare', function(handshake) {
			//Query the topology context to figure out which task to run
			var id = handshake.context['task->component'][handshake.context.taskid]
			var task = topology.tasks[id]
			if (task == null) {
				duplex.emit('error', new Error('Task with id ' + id + ' not found'))
			} else {
				//Finish piping the stream
				frontmatter.pipe(task)
					.on('prepare', function(handshake) {
						var pid = process.pid
						fs.writeFileSync(path.join(handshake.pidDir, '' + pid), '')
						task.queue({pid:pid})
					})
					.pipe(back)
			}
		})

	return duplex
		
}
