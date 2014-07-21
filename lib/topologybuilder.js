var ttypes = require('./gen-nodejs/storm_types')

//Extend with toString, so GlobalStreamId can be used as a hash key
ttypes.GlobalStreamId.prototype.toString = function() {
	return '' + this.componentId + '/' + this.streamId
}

//Track a separate map for global stream ids
//Also have to modify the generated code for ComponentCommon
//to serialize the input map correctly
ttypes.ComponentCommon.prototype.addInput = function(globalStreamId, grouping) {
	if (this.globalStreamIds == null) {
		this.globalStreamIds = {}
	}
	if (this.inputs == null) {
		this.inputs = {}
	}
	this.inputs[globalStreamId] = grouping
	this.globalStreamIds[globalStreamId] = globalStreamId
}

ttypes.ComponentCommon.prototype.getGlobalStreamId = function(inputKey) {
	return this.globalStreamIds[inputKey]
}

function createInputBuilder(componentCommon) {
	function createGrouping(componentId, groupingType, args, streamId) {
		if (streamId == null) {
			streamId = 'default'
		}
		var globalStreamId = new ttypes.GlobalStreamId({
			componentId: componentId,
			streamId: streamId
		})
		var groupingSpec = {}
		groupingSpec[groupingType] = args
		componentCommon.addInput(globalStreamId, new ttypes.Grouping(groupingSpec))
		return inputBuilder
	}
	var inputBuilder = {
		allGrouping: function(componentId, streamId) {
			return createGrouping(componentId, 'all', new ttypes.NullStruct(), streamId)
		},

		directGrouping: function(componentId, streamId) {
			return createGrouping(componentId, 'direct', new ttypes.NullStruct(), streamId)
		},

		fieldsGrouping: function(componentId, fields, streamId) {
			return createGrouping(componentId, 'fields', fields, streamId)
		},

		globalGrouping: function(componentId, streamId) {
			return inputBuilder.fieldsGrouping(componentId, [], streamId)
		},

		localOrShuffleGrouping: function(componentId, streamId) {
			return createGrouping(componentId, 'local_or_shuffle', new ttypes.NullStruct(), streamId)
		},

		noneGrouping: function(componentId, streamId) {
			return createGrouping(componentId, 'none', new ttypes.NullStruct(), streamId)
		},

		shuffleGrouping: function(componentId, streamId) {
			return createGrouping(componentId, 'shuffle', new ttypes.NullStruct(), streamId)
		}
	}
	return inputBuilder
}

function createTaskObject(id, task, taskType, parallelismHint) {
	var shellComponent = new ttypes.ShellComponent({
		execution_command: 'node', //How to support coffeescript?
		script: id + '.js' //Assumes name and location of component: "resources/{id}.js"
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

function validateUnusedId(id, topology) {
	if (topology.bolts[id] != null) {
		throw new Error('Bolt has already been declared for id ' + id)
	}
	if (topology.spouts[id] != null) {
		throw new Error('Spout has already been declared for id ' + id)
	}
}

module.exports = function() {
	var topology = new ttypes.StormTopology({
		bolts: {},
		spouts: {},
		state_spouts: {}
	})

	return {
		setBolt: function(id, bolt, parallelismHint) {
			validateUnusedId(id, topology)
			var boltSpec = new ttypes.Bolt(createTaskObject(id, bolt, 'bolt', parallelismHint))
			topology.bolts[id] = boltSpec
			return createInputBuilder(boltSpec.common)
		},

		setSpout: function(id, spout, parallelismHint) {
			validateUnusedId(id, topology)
			var spoutSpec = new ttypes.SpoutSpec(createTaskObject(id, spout, 'spout', parallelismHint))
			topology.spouts[id] = spoutSpec
		},

		createTopology: function() {
			return topology
		}
	}
}
