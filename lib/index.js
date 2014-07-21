var parseArgs = require('minimist')

exports.basicbolt = require('./basicbolt')
exports.bolt = require('./bolt')
exports.spout = require('./spout')
exports.topologybuilder = require('./topologybuilder')

exports.submitTopology = function(name, topology, argumentArray) {
	var argv = parseArgs(argumentArray || process.argv, {
		alias: {
			task: 't'
		}
	})
	if (argv.task) {
		topology.runTask(argv.task)
	} else {
		topology.submit(name)
	}
}
