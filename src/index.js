const timeout = function(fn, s) {
  return new Promise(resolve => setTimeout(() => resolve(fn()), s))
}

/**
 * Queue for on_demand requests
 */
class Queue {
  constructor() {
    this.stack = []
    this.executing = null
  }

  /**
   * Add function to stack and execute
   * Important: Function is assumed to be promisified
   */
  delay(fn, delay, timer, add = 'push') {
    return new Promise(resolve => {
      const modFn = this.modFunction(fn, delay, timer, resolve)

      // Insert AFTER currently active task, so the current one would only
      // remove itself after finishing
      if (this.stack[0] && add === 'unshift') {
        this.stack.splice(1, 0, modFn)
      } else {
        this.stack[add](modFn)
      }
      this.run()
    })
  }

  /**
   * Generate function with timeout and waterfall functionality
   */
  modFunction(fn, delay, timer, resolve) {
    return async() => {
      const runFunction = new Promise(res => {
        timeout(fn, delay).then(data => {
          resolve(data)
          res()
        })
        // Purge function if it doesn't resolve in time
        setTimeout(() => {
          resolve()
          res()
        }, timer)
      })

      await runFunction

      // Trigger next function if available
      this.stack.shift()
      if (this.stack[0]) {
        this.executing = true
        this.stack[0]()
      } else {
        this.executing = false
      }
    }
  }

  /**
   * If nothing is queued, start waterfall, otherwise expect waterfall to be
   * in progress
   */
  run() {
    if (!this.executing) {
      this.executing = true
      this.stack[0]()
    }
  }
}

module.exports = new Queue()
