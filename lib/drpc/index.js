var component = require('../component')
var types = require('../types')

exports.spout = function(functionName) {
	var spout = component.call({
		spec: types.javaspout('backtype.storm.drpc.DRPCSpout', { string_arg: functionName })
	})
	spout.declareOutputFields(['args', 'return-info'])
	return spout
}

exports.joinresult = function(returnComponent) {
	var joinresult = component.call({
		spec: types.javabolt('backtype.storm.drpc.JoinResult', { string_arg: returnComponent })
	})
	joinresult.declareOutputFields(['result', 'return-info'])
	return joinresult
}

exports.preparerequest = function() {
	var preparerequest = component.call({
		spec: types.javabolt('backtype.storm.drpc.PrepareRequest')
	})
	preparerequest.declareStream('default', ['request', 'args'])
	preparerequest.declareStream('ret', ['request', 'return'])
	preparerequest.declareStream('id', ['request'])
	return preparerequest
}

exports.returnresults = function(returnComponent) {
	return component.call({
		spec: types.javabolt('backtype.storm.drpc.ReturnResults')
	})
}

exports.client = require('./client')
