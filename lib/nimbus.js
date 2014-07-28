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
		var connection = thrift.createConnection(this._host, this._port, {
			transport: thrift.TFramedTransport
		})
		//TODO - handle connection.on('error')?
		var client = thrift.createClient(NimbusClient, connection)
		return q.npost(client, method, arguments).then(function(result) {
			connection.end()
			return result
		})
	}
})
