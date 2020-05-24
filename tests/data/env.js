#!/usr/bin/env node
const args = process.argv.slice(2);

for (const name of args) {
  console.log(process.env[name]);
}
