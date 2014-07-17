var Transform = require('stream').Transform
var util = require('util')
var fs = require('fs')

// Input protocol transformation
function InputProtocol() {
	Transform.call(this, {objectMode: true})
	this.text = ''
}

util.inherits(InputProtocol, Transform)

InputProtocol.prototype._transform = function(data, encoding, callback) {
	this._process(data)
	callback()
}

InputProtocol.prototype._flush = function(callback) {
	this._process('', true)
	callback()
}

InputProtocol.prototype._process = function(data, end) {
	this.text += data
	commands = this.text.split('\nend\n')

	var len = commands.length
	if (!end) {
		len--
		this.text = commands[len]
	}

	for (var i = 0; i < len; ++i) {
		var command = commands[i].trim()
		if (command) {
			this.push(JSON.parse(command))
		}
	}
}

// Output protocol transformation
function OutputProtocol() {
	Transform.call(this, {objectMode:true})
}

util.inherits(OutputProtocol, Transform)

OutputProtocol.prototype._transform = function(data, encoding, callback) {
	this.push(JSON.stringify(data) + '\nend\n')
	callback()
}

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

// Basic bolt
function BasicBolt() {
	Storm.call(this)
}

util.inherits(BasicBolt, Storm)

BasicBolt.prototype.process = function(tuple) {
}

BasicBolt.prototype.run = function() {
	var self = this
	process.stdin.pipe(new InputProtocol())
		.pipe(this)
		.on('tuple', function(data) {
			self.process(data.tuple, data)
			//TODO - each call to emitTuple should anchor to the input tuple
			self.ack(data)
		})
		.pipe(new OutputProtocol())
		.pipe(process.stdout)
}

// Spout
function Spout() {
	Storm.call(this)
}

util.inherits(Spout, Storm)

Spout.prototype.nextTuple = function() {
}

Spout.prototype.async = function() {
	//TODO - need to pause the stream....
	var self = this
	self.isAsync = true
	return function() {
		delete self.isAsync
		self.sync()
	}
}

Spout.prototype.run = function() {
	var self = this
	process.stdin.pipe(new InputProtocol())
		.pipe(this)
		.on('command', function(data) {
			if (data["command"] == "next") {
				self.nextTuple()
			} else if (data["command"] == "ack") {
				self.emit('ack', data.id)
			} else if (data["command"] == "fail") {
				self.emit('fail', data.id)
			}
			if (!self.isAsync) {
				self.sync()
			}
		})
		.pipe(new OutputProtocol())
		.pipe(process.stdout)
}

exports.BasicBolt = BasicBolt
exports.Spout = Spout
