'use strict';

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();



var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var timeout = function timeout(fn, s) {
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(fn());
    }, s);
  });
};
var Queue = function () {
  function Queue() {
    classCallCheck(this, Queue);
    this.stack = [];
    this.executing = null;
  }
  createClass(Queue, [{
    key: 'delay',
    value: function delay(fn, _delay, timer) {
      var _this = this;
      var add = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'push';
      return new Promise(function (resolve) {
        var modFn = _this.modFunction(fn, _delay, timer, resolve);
        if (_this.stack[0] && add === 'unshift') {
          _this.stack.splice(1, 0, modFn);
        } else {
          _this.stack[add](modFn);
        }
        _this.run();
      });
    }
  }, {
    key: 'modFunction',
    value: function modFunction(fn, delay, timer, resolve) {
      var _this2 = this;
      return asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var runFunction;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                runFunction = new Promise(function (res) {
                  timeout(fn, delay).then(function (data) {
                    resolve(data);
                    res();
                  });
                  setTimeout(function () {
                    resolve();
                    res();
                  }, timer);
                });
                _context.next = 3;
                return runFunction;
              case 3:
                _this2.stack.shift();
                if (_this2.stack[0]) {
                  _this2.executing = true;
                  _this2.stack[0]();
                } else {
                  _this2.executing = false;
                }
              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, _this2);
      }));
    }
  }, {
    key: 'run',
    value: function run() {
      if (!this.executing) {
        this.executing = true;
        this.stack[0]();
      }
    }
  }]);
  return Queue;
}();
module.exports = new Queue();
//# sourceMappingURL=index.js.map
