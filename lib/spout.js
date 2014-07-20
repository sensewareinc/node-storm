var protocol = require('./protocol')

module.exports = function (nextTuple) {
	var spout = protocol()
	function sync() {
		spout.collector.sync()
	}
	spout.on('next', function() {
		nextTuple.call(spout.collector, sync)
	})
	//To handle ack or fail:
	//.on('ack', function(data) {})
	//.on('fail', function(data) {})
	return spout
}
