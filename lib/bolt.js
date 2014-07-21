var task = require('./task')

module.exports = function(process) {
	var bolt = task()
	bolt.on('tuple', function(data) {
		process.call(bolt.collector, data)
	})
	return bolt
}
