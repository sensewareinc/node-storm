var task = require('./task')

module.exports = function (nextTuple) {
	var spout = task()
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
