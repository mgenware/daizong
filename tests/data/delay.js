#!/usr/bin/env node

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const args = process.argv.slice(2);
const ms = parseInt(args[0], 10);
const msg = args[1];

(async () => {
  await sleep(ms);
  console.log(msg);
})();
