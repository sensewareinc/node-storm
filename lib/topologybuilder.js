var inputdeclarer = require('./inputdeclarer')
var ttypes = require('./gen-nodejs/storm_types')
var util = require('./util')

function createTaskObject(id, task, taskType, script, parallelismHint) {
	var shellComponent = new ttypes.ShellComponent({
		execution_command: 'node', //How to support coffeescript?
		script: script
	})
	var componentObject = new ttypes.ComponentObject({
		shell: shellComponent
	})
	var streams = {}
	for (var streamId in task.streams) {
		if (task.streams.hasOwnProperty(streamId)) {
			streams[streamId] = new ttypes.StreamInfo(task.streams[streamId])
		}
	}
	var componentCommon = new ttypes.ComponentCommon({
		inputs: {},
		streams: streams
	})
	if (parallelismHint != null) {
		componentCommon.parallelism_hint = parallelismHint
	}
	var taskSpec = {
		common: componentCommon
	}
	taskSpec['' + taskType + '_object'] = componentObject
	return taskSpec
}

function validateUnusedId(id, topologySpec) {
	if (topologySpec.bolts[id] != null) {
		throw new Error('Bolt has already been declared for id ' + id)
	}
	if (topologySpec.spouts[id] != null) {
		throw new Error('Spout has already been declared for id ' + id)
	}
}

module.exports = function(script) {
	if (script == null) {
		script = util.topologyScript()
	}

	var tasks = {}
	var topologySpec = new ttypes.StormTopology({
		bolts: {},
		spouts: {},
		state_spouts: {}
	})

	return {
		setBolt: function(id, bolt, parallelismHint) {
			validateUnusedId(id, topologySpec)
			var boltSpec = new ttypes.Bolt(createTaskObject(id, bolt, 'bolt', script, parallelismHint))
			topologySpec.bolts[id] = boltSpec
			tasks[id] = bolt
			return inputdeclarer(boltSpec.common)
		},

		setSpout: function(id, spout, parallelismHint) {
			validateUnusedId(id, topologySpec)
			var spoutSpec = new ttypes.SpoutSpec(createTaskObject(id, spout, 'spout', script, parallelismHint))
			topologySpec.spouts[id] = spoutSpec
			tasks[id] = spout
		},

		createTopology: function() {
			topologySpec.tasks = tasks
			return topologySpec
		}
	}
}
