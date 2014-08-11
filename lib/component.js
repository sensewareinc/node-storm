module.exports = function() {
	this.declareOutputFields = function(fields) {
		return this.declareStream('default', false, fields)
	}

	this.declareStream = function(streamId, direct, fields) {
		if (this.streams == null) {
			this.streams = {}
		}
		if (this.streams[streamId] != null) {
			throw new Error('Stream with id \"' + streamId + '\" is already defined')
		}
		this.streams[streamId] = {
			direct: direct,
			output_fields: fields
		}
		return this
	}

	return this
}
