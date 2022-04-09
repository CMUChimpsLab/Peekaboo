/*
Prototype for writable buffer stream
*/
const util = require("util");
const stream = require("stream");
const Writable = stream.Writable;

function BufferStream() {
  if (!(this instanceof BufferStream)) {
    return new BufferStream(buffer);
  }
  Writable.call(this);
  this.buffers = [];
  this.buffer = Buffer.alloc(0);
  this.offset = 0;
}

util.inherits(BufferStream, Writable);

BufferStream.prototype._write = function(chunk, enc, cb) {
  const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, enc);
  this.buffers.push(data);
  cb();
};

BufferStream.prototype.toBuffer = function() {
  if (this.buffers.length != 0) {
    this.buffers = [this.buffer].concat(this.buffers);
    this.buffer = Buffer.concat(this.buffers);
    this.buffers = [];
  }
  return this.buffer;
}

module.exports = BufferStream;