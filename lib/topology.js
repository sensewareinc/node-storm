var parser = require('./parser')
var formatter = require('./formatter')
var prepare = require('./prepare')
var fs = require('fs')
var path = require('path')

exports.run = function(topology) {
	var frontmatter = process.stdin.pipe(parser())
		.pipe(prepare())
		.on('prepare', function(handshake) {
			//Query the topology context to figure out which task to run
			var id = handshake.context['task->component'][handshake.context.taskid]
			var task = topology.tasks[id]
			if (task == null) {
				throw new Error('Task with id ' + id + ' not found')
			}

			//Finish piping the stream
			frontmatter.pipe(task)
				.on('prepare', function(handshake) {
					var pid = process.pid
					fs.writeFileSync(path.join(handshake.pidDir, '' + pid), '')
					task.queue({pid:pid})
				})
				.pipe(formatter())
				.pipe(process.stdout)
		})
}
