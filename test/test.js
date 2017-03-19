let Sandbox = require('..');
let fs = require('fs');

let sb = new Sandbox([
  ['/usr/bin', '/usr/bin', true],
  ['/usr/share', '/usr/share', true],
  ['/usr/lib', '/usr/lib', true],
  ['/usr/lib64', '/usr/lib64', true],
  ['/lib', '/lib', true],
  ['/lib64', '/lib64', true],
  ['/dev', '/dev', true],
]);

sb.put('./data.in', 777);
let program = sb.put('./test', 777);
let res = sb.run({
  program: program,
  file_stdin: 'data.in',
  file_stdout: 'data.out',
  file_stderr: 'data.err',
  time_limit: 1,
  time_limit_reserve: 1,
  memory_limit: 32 * 1024,
  memory_limit_reserve: 32 * 1024,
  large_stack: 1,
  output_limit: 10 * 1024,
  process_limit: 1,
  network: false
});
console.log(res);
console.log(fs.readFileSync(sb.get('data.out')).toString());

sb.reset();
sb.put('./data.in', 777);
program = sb.put('./test', 777);
res = sb.run({
  program: program,
  file_stdin: 'data.in',
  file_stdout: 'data.out',
  file_stderr: 'data.err',
  time_limit: 1,
  time_limit_reserve: 1,
  memory_limit: 32 * 1024,
  memory_limit_reserve: 32 * 1024,
  large_stack: 1,
  output_limit: 10 * 1024,
  process_limit: 1,
  network: false
});
console.log(res);
console.log(fs.readFileSync(sb.get('data.out')).toString());

sb.destroy();

console.log('\n\nHere should throw:\n\n\n');
console.log(fs.readFileSync(sb.get('data.out')).toString());
