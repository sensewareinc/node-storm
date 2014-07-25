var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')

module.exports = LocalCluster

function LocalCluster() {
	if (!(this instanceof LocalCluster)) {
		return new LocalCluster()
	}
	process.stdout.setMaxListeners(0)
	process.stderr.setMaxListeners(0)
	this._stormLogDirectory = this._getLogDirectory()
	this._start()
}

LocalCluster.prototype._start = function() {
	var self = this
	var toRun = [
		'dev-zookeeper',
		'nimbus',
		'supervisor'
	]

	self._servers = toRun.map(function(serverName) {
		return spawn('storm', [serverName, '-c', 'storm.local.dir=/tmp/storm-local'])
	})

	self._servers.forEach(function(server) {
		server.stdout.pipe(process.stdout)
		server.stderr.pipe(process.stderr)
	})

	while (!fs.existsSync(self._stormLogDirectory)) {
		//Waiting for directory if it doesn't exist
	}

	var logFiles = fs.readdirSync(self._stormLogDirectory)

	self._tails = {}
	logFiles.forEach(function(logFile) {
		self._tails[logFile] = self._tailFile(logFile)
	})

	this._logWatcher = fs.watch(self._stormLogDirectory, this._onLogDirectoryChange.bind(self))
}

LocalCluster.prototype._getLogDirectory = function() {
	var searchPaths = process.env.PATH.split(':')
	for (var i = 0, ii = searchPaths.length; i < ii; ++i) {
		var searchPath = searchPaths[i]
		var stormBin = path.join(searchPath, 'storm')
		if (fs.existsSync(stormBin)) {
			return path.resolve(searchPath, '../logs')
		}
	}
	throw new Error('Storm was not found on your $PATH')
}

LocalCluster.prototype._tailFile = function(file) {
	var tail = spawn('tail', ['-n', '0', '-f', path.join(this._stormLogDirectory, file)])
	tail.stdout.pipe(process.stdout)
	tail.stderr.pipe(process.stderr) //Warning about max listeners?
	return tail
}

LocalCluster.prototype._onLogDirectoryChange = function(event, logFile) {
	if (event == 'rename') {
		if (fs.existsSync(path.join(this._stormLogDirectory, logFile))) {
			this._tails[logFile] = this._tailFile(logFile)
		} else {
			this._tails[logFile].kill()
			delete this._tails[logFile]
		}
	}
}

LocalCluster.prototype.shutdown = function(callback) {
	this._logWatcher.close()

	var childProcesses = [].concat(this._servers)

	for (var logFile in this._tails) {
		if (this._tails.hasOwnProperty(logFile)) {
			childProcesses.push(this._tails[logFile])
		}
	}

	var running = childProcesses.length

	function onExit() {
		if (--running == 0) {
			callback()
		}
	}

	for (var i = 0, ii = running; i < ii; ++i) {
		var childProcess = childProcesses[i]
		childProcess.once('exit', onExit)
		childProcess.kill()
	}
}
