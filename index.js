let child_process = require('child_process');
let path = require('path');
let fs = require('fs');
let tmp = require('tmp');
let shellEscape = require('shell-escape');

function execute () {
  child_process.execSync(shellEscape(Array.from(arguments)), { stdio: [0, 1, 2] });
}

function executePiped (cmd1, cmd2) {
  child_process.execSync(shellEscape(cmd1) + ' | ' + shellEscape(cmd2), { stdio: [0, 1, 2] });
}

module.exports = class Sandbox {
  constructor (uid, binds) {
    this.uid = (parseInt(uid) || 2333).toString();

    this.tmpDir = tmp.dirSync();
    this.mounted = [];

    this.dir = path.join(this.tmpDir.name, 'sandbox');
    execute('cp', '-r', path.join(__dirname, 'sandbox'), this.dir);
    this.userDir = path.join(this.dir, 'sandbox');
    this.reset();

    for (let [src, dst, ro] of binds) this.mountBind(src, this.dir + dst, ro);
  }

  reset () {
    execute('rm', '-rf', this.userDir);
    execute('mkdir', '-p', this.userDir);
    execute('chown', '-R', `${this.uid}:${this.uid}`, this.userDir);
  }

  mountBind (src, dst, ro) {
    this.mounted.push(dst);
    execute('mkdir', '-p', dst);
    execute('mount', src, dst, '-o', 'bind');
    if (ro) {
      execute('mount', dst, '-o', 'remount,bind,ro')
    }
  }

  put (file, mask, targetFilename) {
    if (!mask) mask = 777;
    if (!targetFilename) targetFilename = path.basename(file);
    let s = path.join(this.userDir, targetFilename);
    if (Buffer.isBuffer(file)) {
      fs.writeFileSync(s, file);
    } else {
      execute('cp', '-r', file, s);
    }
    execute('chown', '-R', `${this.uid}:${this.uid}`, s);
    execute('chmod', '-R', mask.toString(), s);
    return path.join('/sandbox', targetFilename);
  }

  get (file) {
    let res = path.join(this.userDir, file);
    try {
      fs.statSync(res);
      return res;
    } catch (e) {
      return null;
    }
  }

  run (options) {
    options = Object.assign({
      program: '',
      file_stdin: '',
      file_stdout: '',
      file_stderr: '',
      time_limit: 0,
      time_limit_reserve: 1,
      memory_limit: 0,
      memory_limit_reserve: 32 * 1024,
      large_stack: 0,
      output_limit: 0,
      process_limit: 0,
      network: true
    }, options);

    let tmpFile = tmp.fileSync();

    let cmd = shellEscape([
      path.join(__dirname, 'sandbox-exec'),
      this.dir,
      options.program,
      options.file_stdin || '/dev/null',
      options.file_stdout || '/dev/null',
      options.file_stderr || '/dev/null',
      options.time_limit.toString(),
      options.time_limit_reserve.toString(),
      options.memory_limit.toString(),
      options.memory_limit_reserve.toString(),
      parseInt(options.large_stack + 0).toString(),
      options.output_limit.toString(),
      options.process_limit.toString(),
      this.uid,
      tmpFile.name
    ]);

    if (options.network) {
      execute('sh', '-c', cmd);
    } else {
      executePiped(['echo', cmd], ['unshare', '-n', 'sh']);
    }

    function parseResult (result) {
      let a = result.toString().split('\n');
      return {
        status: a[0],
        debug_info: a[1],
        time_usage: parseInt(a[2]),
        memory_usage: parseInt(a[3])
      };
    }

    let result = parseResult(fs.readFileSync(tmpFile.name));

    tmpFile.removeCallback();

    return result;
  }

  destroy () {
    try {
      execute('pkill', '-U', this.uid);
    } catch (e) {}
    for (let dst of this.mounted.reverse()) execute('umount', dst);
    execute('rm', '-rf', this.dir);
    this.tmpDir.removeCallback();
  }
}
