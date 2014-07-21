var parser = require('./parser')
var formatter = require('./formatter')
var prepare = require('./prepare')
var fs = require('fs')
var path = require('path')
var thrift = require('thrift')
var NimbusClient = require('./gen-nodejs/Nimbus').Client

module.exports = function(tasks, topologySpec) {
	return {
		submit: function(options, callback) {
			var connection = thrift.createConnection(options.nimbusHost, options.nimbusPort, {
				transport: thrift.TFramedTransport
			})
			//TODO - handle connection.on('error')?
			var client = thrift.createClient(NimbusClient, connection)
			client.submitTopology(options.name, options.uploadedJarLocation, JSON.stringify(options.config), topologySpec, function() {
				connection.end()
				callback.apply(this, arguments)
			})
		},

		runTask: function() {
			var frontmatter = process.stdin.pipe(parser())
				.pipe(prepare())
				.on('prepare', function(handshake) {
					//Query the topology context to figure out which task to run
					var id = handshake.context['task->component'][handshake.context.taskid]
					var task = tasks[id]
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
	}	
}
