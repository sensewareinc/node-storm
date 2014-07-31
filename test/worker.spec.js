var bolt = require('../lib/bolt')
var worker = require('../lib/worker')
var es = require('event-stream')
var fs = require('fs')
var sinon = require('sinon')

describe('worker', function() {

	beforeEach(function() {
		this.topology = {
			tasks: {
				adder: bolt(function(data) {
					var i = data.tuple[0]
					this.emit([++i])
					this.ack(data)
				})
			}
		}
		this.sandbox = sinon.sandbox.create()
		this.sandbox.stub(fs, 'writeFileSync')
	})

	afterEach(function() {
		this.sandbox.restore()
	})

	it('emits an error if the task cannot be found', function(done) {
		es.readArray(['{"conf":{},"context":{"task->component":{"1":"adder","2":"nothing"},"taskid":"2"},"pidDir":"/tmp/test"}'])
			.pipe(worker(this.topology))
			.on('error', function(err) {
				err.should.be.an.Error
				done()
			})
	})

	it('writes a pid file to the specified directory', function(done) {
		es.readArray(['{"conf":{},"context":{"task->component":{"1":"adder","2":"nothing"},"taskid":"1"},"pidDir":"/tmp/test"}'])
			.pipe(worker(this.topology))
			.pipe(es.wait(function() {
				fs.writeFileSync.calledWith('/tmp/test/' + process.pid, '').should.be.true
				done()
			}))
	})

	it('queries the topology context to find the task to run', function(done) {
		var input = [
			'{"conf":{},"context":{"task->component":{"1":"adder","2":"nothing"},"taskid":"1"},"pidDir":"/tmp/test"}',
			'{"id":1,"tuple":[3]}'
		].join('\nend\n')
		es.readArray([input])
			.pipe(worker(this.topology))
			.pipe(es.wait(function(err, text) {
				text.should.eql('{"pid":' + process.pid + '}\nend\n{"command":"emit","tuple":[4]}\nend\n{"command":"ack","id":1}\nend\n')
				done()
			}))
	})

})
