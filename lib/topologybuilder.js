var ttypes = require('./gen-nodejs/storm_types')

//Extend with toString, so GlobalStreamId can be used as a hash key
ttypes.GlobalStreamId.prototype.toString = function() {
	return '' + this.componentId + '/' + this.streamId
}

//Track a separate map for global stream ids
//Also have to modify the generated code for ComponentCommon
//to serialize the input map correctly
ttypes.ComponentCommon.prototype.addInput = function(globalStreamId, grouping) {
	this.inputs[globalStreamId] = grouping
	if (this.globalStreamIds == null) {
		this.globalStreamIds = {}
	}
	this.globalStreamIds[globalStreamId] = globalStreamId
}

ttypes.ComponentCommon.prototype.getGlobalStreamId = function(inputKey) {
	return this.globalStreamIds[inputKey]
}

module.exports = function() {
	var topology = new ttypes.StormTopology({
		bolts: {},
		spouts: {},
		state_spouts: {}
	})

	return {
		setBolt: function(id, bolt) {
			if (topology.bolts[id] != null) {
				throw new Error('Topology already contains a bolt with id \"' + id + '\"')
			}
		},

		setSpout: function(id, spout) {
			if (topology.spouts[id] != null) {
				throw new Error('Topology already contains a spout with id \"' + id + '\"')
			}
			var shellComponent = new ttypes.ShellComponent({
				execution_command: 'node', //How to support coffeescript?
				script: id + '.js' //Assumes name and location of component: "resources/{id}.js"
			})
			var componentObject = new ttypes.ComponentObject({
				shell: shellComponent
			})
			var streams = {}
			for (var streamId in spout.streams) {
				if (spout.streams.hasOwnProperty(streamId)) {
					streams[streamId] = new ttypes.StreamInfo(spout.streams[streamId])
				}
			}
			var componentCommon = new ttypes.ComponentCommon({
				streams: streams
			})
			var spoutSpec = new ttypes.SpoutSpec({
				spout_object: componentObject,
				common: componentCommon
			})
			topology.spouts[id] = spoutSpec
		},

		createTopology: function() {
			return topology
		}
	}
}
