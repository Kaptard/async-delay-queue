# async-delay-queue
Minimal ES7 async queue with dynamic delay between functions.

<br>

## Usage
```js
queue.delay(fn, add, delay)
```
> Returns a promise resolving the return value of the given function.

| Argument | Description | Default |
|:------------- |:------------- |:------------- |
| fn | Function to delay. Supports promise/async functions. | None |
| add | Method with which the function is added to the queue stack. "unshift" to add to start, "push" to add to end of queue. | "push"
| delay | Delay between this function and the last one in ms. Required. | null |

<br>

## Example
Crawl Google.com and retry when hitting rate limits.
```js
const queue = require("async-delay-queue")
const request = require("request-promise") // for example purposes only

async crawl(url) {
    let res = await queue.delay(() => request(url), "push", 100)

    // Hit rate limits? Put the same request at the start of the queue.
    // "unshift" to push at start, and increase delay to 10s.
    if (res.statusCode === 429) {
        res = await queue.delay(() => request(url), "unshift", 10000)
    }

    return res
}

// Crawls google.com 20 times with a 100ms delay between each request.
for (let i = 0; i < 20; i++) {
    crawl("http://google.com")
}
```
