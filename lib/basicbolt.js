var bolt = require('./bolt')

//basic bolts are synchronous only, for async support
//use bolt and do your own anchoring and acking
module.exports = function(process) {
	var basicbolt = bolt(function(data) {
		//Wrap the default emit to anchor to the input tuple
		this.emit = function(tuple, options) {
			if (options == null) {
				options = {}
			}
			options.anchors = [data.id]
			return emit.call(this, tuple, options)
		}
		process.call(this, data)
		this.emit = emit
		this.ack(data)
	})
	var emit = basicbolt.collector.emit
	return basicbolt
}
