exports.basicbolt = require('./basicbolt')
exports.bolt = require('./bolt')
exports.drpc = require('./drpc')
exports.spout = require('./spout')
exports.topologybuilder = require('./topologybuilder')
exports.localcluster = require('./localcluster')
exports.submit = require('./submitter').submit

var worker = require('./worker')
exports.run = function(topology) {
	process.stdin
		.pipe(worker(topology))
		.pipe(process.stdout)
}
