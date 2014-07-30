var NimbusClient = require('./gen-nodejs/Nimbus').Client
var thrift = require('thrift')
var q = require('q')

module.exports = Nimbus

function Nimbus(nimbusHost) {
	if (!(this instanceof Nimbus)) {
		return new Nimbus(nimbusHost)
	}
	//Default to a local nimbus
	if (nimbusHost == null) {
		nimbusHost = 'localhost:6627'
	}
	var hostAndPort = nimbusHost.split(':')
	this._host = hostAndPort[0]
	this._port = parseInt(hostAndPort[1] || 6627, 10)
}

['submitTopology', 'beginFileUpload', 'uploadChunk', 'finishFileUpload', 'killTopology', 'killTopologyWithOpts'].forEach(function(method) {
	Nimbus.prototype[method] = function() {
		var connected = q.defer()
		var connection = thrift.createConnection(this._host, this._port, {
			transport: thrift.TFramedTransport
		}).on('error', function(err) {
			connected.reject(err)
		}).on('timeout', function() {
			connected.reject(new Error('Thrift connection timed out'))
		}).on('connect', function() {
			connected.resolve()
		})
		var client = thrift.createClient(NimbusClient, connection)
		return q.all([
			q.npost(client, method, arguments),
			connected.promise
		]).then(function(result) {
			return result[0]
		}).finally(function() {
			connection.end()
		})
	}
})
