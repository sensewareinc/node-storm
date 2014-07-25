exports.basicbolt = require('./basicbolt')
exports.bolt = require('./bolt')
exports.spout = require('./spout')
exports.topologybuilder = require('./topologybuilder')
exports.localcluster = require('./localcluster')

exports.submitTopology = function(name, topology, options, callback) {
	if (typeof options == 'function') {
		callback = options
		options = {}
	}
	var argv = options.argv
	if (argv == null) {
		argv = process.argv
	} else {
		delete options.argv
	}
	var submitArgs = argv.slice(2)
	if (submitArgs.length) {
		//We were run with storm shell, so submit the topology
		topology.submit({
			name: name,
			nimbusHost: submitArgs[0],
			nimbusPort: parseInt(submitArgs[1], 10),
			uploadedJarLocation: submitArgs[2],
			config: options
		}, callback)
	} else {
		//Else we were run from a ShellComponent
		topology.runTask()
	}
}
