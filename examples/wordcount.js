var storm = require('../')
var path = require('path')

var randomsentence = (function() {
	var sentences = [
		"the cow jumped over the moon",
		"an apple a day keeps the doctor away",
		"four score and seven years ago",
		"snow white and the seven dwarfs",
		"i am at two with nature"
	]

	return storm.spout(function(sync) {
		var self = this
		setTimeout(function() {
			var i = Math.floor(Math.random()*sentences.length)
			var sentence = sentences[i]
			self.emit([sentence]) /* {id:'unique'} //for reliable emit */
			sync()
		}, 100)
	}).declareOutputFields(["word"])
})()

var splitsentence = storm.basicbolt(function(data) {
	var words = data.tuple[0].split(" ")
	for (var i = 0; i < words.length; ++i) {
		var word = words[i].trim()
		if (word) {
			this.emit([word])
		}
	}
}).declareOutputFields(["word"])

var wordcount = (function() {
	var counts = {}

	return storm.basicbolt(function(data) {
		var word = data.tuple[0]
		if (counts[word] == null) {
			counts[word] = 0
		}
		var count = ++counts[word]
		this.emit([word, count])
	}).declareOutputFields(["word", "count"])
})()

//Usually we can figure out the directory to package automatically, but this is a special case
var directory = path.resolve(__dirname, '..')
var builder = storm.topologybuilder('examples/wordcount.js')

builder.setSpout('randomsentence', randomsentence)
builder.setBolt('splitsentence', splitsentence, 8).shuffleGrouping('randomsentence');
builder.setBolt('wordcount', wordcount, 12).fieldsGrouping('splitsentence', ['word']);

var nimbus = process.argv[2]
var options = {
	directory: directory,
	config: {'topology.debug': true}
}
var topology = builder.createTopology()
if (nimbus == 'local') {
	var cluster = storm.localcluster()
	cluster.submit(topology, options, function(err) {
		setTimeout(function() {
			cluster.shutdown()
		}, 20000)
	})
} else if (nimbus != null) {
	options.nimbus = nimbus
	storm.submit(topology, options)
} else {
	storm.run(topology)
}
