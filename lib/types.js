var ttypes = require('./gen-nodejs/storm_types')
var util = require('./util')

function shellcomponent() {
	return new ttypes.ComponentObject({
		shell: new ttypes.ShellComponent({
			execution_command: process.argv[0],
			script: util.topologyScript()
		})
	})
}

function componentcommon() {
	return new ttypes.ComponentCommon({
		inputs: {},
		streams: {}
	})
}

exports.shellbolt = function shellbolt() {
	return new ttypes.Bolt({
		bolt_object: shellcomponent(),
		common: componentcommon()
	})
}

exports.shellspout = function shellspout() {
	return new ttypes.SpoutSpec({
		spout_object: shellcomponent(),
		common: componentcommon()
	})
}
