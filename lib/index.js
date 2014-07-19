var parser = require('./parser')
var formatter = require('./formatter')
var handshake = require('./handshake')
var fs = require('fs')
var path = require('path')

exports.bolt = require('./bolt')
exports.basicbolt = require('./basicbolt')
exports.spout = require('./spout')

exports.run = function(protocol) {
	process.stdin.pipe(parser())
		.pipe(handshake())
		.pipe(protocol)
		.on('handshake', function(handshake) {
			var pid = process.pid
			protocol.queue({pid:pid})
			fs.writeFileSync(path.join(handshake.pidDir, '' + pid), '')
		})
		.pipe(formatter())
		.pipe(process.stdout)
}
