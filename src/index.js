const timeout = (fn, s) => new Promise(resolve => setTimeout(() => resolve(fn()), s))

/**
 * Queue for on_demand requests
 */
class Queue {
  constructor() {
    this.stack = []
    this.executing = null
    this.throwOnTimeout = false
  }

  /**
   * Add function to stack and execute
   * Important: Function is assumed to be promisified
   */
  delay(fn, delay, timer = 60000, add = 'push') {
    return new Promise((resolve, reject) => {
      const modFn = this.modFunction(fn, delay, timer, resolve, reject)

      // If unshift: Insert AFTER currently active task, so the active task
      // removes itself when finishing instead of the inserted function.
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
  modFunction(fn, delay, timer, resolve, reject) {
    return async() => {
      const runFunction = new Promise(res => {
        timeout(fn, delay).then(res)

        // Purge function if it doesn't resolve in time
        setTimeout(() => {
          const err = `Queued function timed out! (${fn.name || 'anonymous'})`
          this.throwOnTimeout ? reject(err) : 0
          res(err)
        }, timer)
      })

      const data = await runFunction

      // Trigger next function if available
      this.stack.shift()
      if (this.stack[0]) {
        this.executing = true
        resolve(data)
        this.stack[0]()
      } else {
        this.executing = false
        resolve(data)
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
