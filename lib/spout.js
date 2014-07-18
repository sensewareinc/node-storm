var protocol = require('./protocol')

module.exports = function (nextTuple) {
	var spout = protocol()
	function sync() {
		spout.collector.sync()
	}
	spout.on('next', function() {
		//TODO - for testing purposes, queue "nexts" until a corresponding sync
		//       for actual runs w/ storm, shouldn't be an issue
		nextTuple.call(spout.collector, sync)
	})
	//To handle ack or fail:
	//.on('ack', function(data) {})
	//.on('fail', function(data) {})
	return spout
}
