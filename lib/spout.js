var protocol = require('./protocol')

module.exports = function (nextTuple) {
	var spout = protocol()
	var sync = function() {
		spout.queue({command:'sync'})
		spout.resume()
	}
	spout.on('next', function() {
		spout.pause()
		nextTuple.call(spout, sync)
	})
	//To handle ack or fail:
	//.on('ack', function(data) {})
	//.on('fail', function(data) {})
	return spout
}
