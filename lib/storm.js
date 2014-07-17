var Transform = require('stream').Transform
var util = require('util')
var fs = require('fs')

// Base input/output stream for bolts and spouts
function Storm() {
	Transform.call(this, {objectMode: true})
	this._queue = []
}

util.inherits(Storm, Transform)

Storm.prototype.ack = function(tuple) {
	this.push({command: 'ack', id: tuple.id})
}

Storm.prototype.emitTuple = function(tuple, options) {
	var msg = {command: 'emit', tuple: tuple}
	for (var key in options) {
		if (options.hasOwnProperty(key)) {
			msg[key] = options[key]
		}
	}
	this.push(msg)
}

Storm.prototype.fail = function(tuple) {
	this.push({"command": "fail", "id": tuple.id})
}

Storm.prototype.log = function(msg) {
	this.push({"command": "log", "msg": msg})
}

Storm.prototype.sync = function() {
	this.push({command:'sync'})
}

Storm.prototype.sendpid = function(heartbeatdir) {
	pid = process.pid
	this.push({pid:pid})
	fs.writeFileSync(heartbeatdir + '/' + pid, '')
}

Storm.prototype._transform = function(data, encoding, callback) {
	if (data.conf) {
		this.handshake = data
		this.sendpid(data.pidDir)
		this.emit('handshake', data)

		var len = this._queue.length
		while(len--) {
			var queued = this._queue.shift()
			this._process(queued)
		}
	} else if (this.handshake) {
		this._process(data)
	} else {
		this._queue.push(data)
	}
	callback()
}

Storm.prototype._process = function(data) {
	if (data instanceof Array) { //Ignore task id list, until there's something to do with it...
		//TODO - Track calls to emit (non-direct) that have a callback, and call the callbacks with the task id lists as they come in
		return
	}
	this.emit((data.command ? 'command' : 'tuple'), data)
}

exports.Storm = Storm
