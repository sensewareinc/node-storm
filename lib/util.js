var net = require('net')

exports.waitForPortListener = function waitForPortListener(port, timeout, callback) {
	var delay = 1000
	function retryOrFail(err) {
		if (timeout > delay) {
			setTimeout(function() {
				waitForPortListener(port, timeout - delay, callback)
			}, delay)
		} else {
			callback(err)
		}
	}
	try {
		var client = net.connect({port:port}, function(err) {
			if (err) {
				retryOrFail(err)
			} else {
				client.end()
				callback()
			}
		}).on('error', retryOrFail)
	} catch (err) {
		retryOrFail(err)
	}
}