// Code adapted from https://raw.githubusercontent.com/Steve-Mcl/node-red-contrib-image-tools/master/performanceLogger.js

class performanceLogger {
  constructor(nodeid) {
      this.nodeid = nodeid;
      this.startTime = new Date();
      this.timers = {};
      this.performance = {nodeid : nodeid };
  }
  start(name) {
      this.timers[name] = {hrtime : process.hrtime(), startTime : new Date()};
      return this;//for chaining
  }
  end(name) {
      try {
          var endTime = process.hrtime(this.timers[name].hrtime);
          this.performance[name] = {
              seconds: endTime[0],
              milliseconds: endTime[1] / 1000000.0
          };
          return this;//for chaining
      }
      catch (error) {
      }
  }

  getTimeinMS(name) {
    if(name){
        return this.performance[name].seconds * 1000 + this.performance[name].milliseconds;
    }
    return this.performance.seconds * 1000 + this.performance.milliseconds;
  }

  getPerformance(name) {
      if(name){
        return this.performance[name];
      }
      return this.performance;
  }
}

module.exports = performanceLogger;