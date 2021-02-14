#!/usr/bin/env node
'use strict';
const child_process = require('child_process');
const parseArgs = require('minimist');
const path = require('path');

const HELP = 'Usage: cafjs.mk build|mkStatic|pack|help \n\
where: \n\
*  build: builds an application using local dependencies. \n\
*  mkStatic: creates a dependency file to load artifacts statically. \n\
*  pack: packs an application embedded in yarn workspaces. \n\
*  help [command]: prints this info or details of any of the above. \n\
';

const usage = function() {
    console.log('Usage: cafjs.mk build|mkStatic|pack|generate|help <...args...>');
    process.exit(1);
};

const condInsert = function(target, key, value) {
    if ((target[key] === undefined) ||
        //minimist sets undefined boolean flags to 'false'
        // do not set both a qualified and unqualified value on boolean...
        (target[key] === false)) {
        target[key] = value;
    }
};

const argsToArray = function(args) {
    const result = [];
    Object.keys(args).filter(function(x) {
        return (x !== '_');
    }).forEach(function(x) {
        result.push('--' + x);
        result.push(args[x]);
    });
    return result;
};

const that = {
    __usage__(msg) {
        console.log(msg);
        process.exit(1);
    },

    __spawn__(cmd, args, cb) {
        const cmdFull = path.resolve(__dirname, cmd);
        console.log('spawn: ' + cmdFull + ' args:' + JSON.stringify(args));
        const sp = child_process.spawn(cmdFull, args);
        sp.stdout.on('data', function(data) {
            console.log('out: ' + data);
        });

        sp.stderr.on('data', function(data) {
            console.log('err: ' + data);
        });

        sp.on('close', function(code) {
            console.log('spawn DONE: ' + cmdFull + ' code:' + code);
            cb && cb(null, code);
        });
        that.__spawnedChild__ = sp;
    },

    __exec__(cmd, args) {
        const cmdFull = path.resolve(__dirname, cmd);
        console.log(cmdFull + ' args:' + JSON.stringify(args));
        const buf = child_process.execFileSync(cmdFull, args);
        console.log(buf.toString());
    },

    __no_args__(cmd, args, msg, spawn) {
        const usage = function() {
            that.__usage__(msg);
        };
        const argv = parseArgs(args, {
            unknown: usage
        });
        if (spawn) {
            that.__spawn__(cmd, argv._);
        } else {
            that.__exec__(cmd, argv._);
        }
    },

    build(args) {
        that.__no_args__('buildApp.sh', args, 'Usage: cafjs.mk build', true);
    },

    mkStatic(args) {
        const usage = function(x) {
            if (x.indexOf('--') !== 0) {
                return true;
            } else {
                console.log('Invalid ' + x);
                that.__usage__('Usage: cafjs.mk mkStatic [rootDir]');
                return false;
            }
        };
        const argv = parseArgs(args, {
            string: ['rootDir'],
            unknown: usage
        });

        const options = argv._ || [];
        const rootDir = options.shift();
        condInsert(argv, 'rootDir', rootDir || process.cwd());
        that.__spawn__('mkStatic.js', argsToArray(argv));
    },

    pack(args) {
        const usage = function(x) {
            if (x.indexOf('--') !== 0) {
                return true;
            } else {
                console.log('Invalid ' + x);
                that.__usage__('Usage: cafjs.mk pack [iot] [appDir] [tarFile]' +
                               ' [workspacesDir]');
                return false;
            }
        };
        const argv = parseArgs(args, {
            string: ['appDir', 'workspacesDir', 'tarFile'],
            boolean: ['iot'],
            unknown: usage
        });

        const options = argv._ || [];
        const iot = (options.shift() === 'true');
        condInsert(argv, 'iot', iot);
        const appDir = options.shift();
        condInsert(argv, 'appDir', appDir || process.cwd());
        const tarFile = options.shift();
        tarFile && condInsert(argv, 'tarFile', tarFile);
        const workspacesDir = options.shift();
        workspacesDir && condInsert(argv, 'workspacesDir', workspacesDir);
        that.__spawn__('mkPack.js', argsToArray(argv));
    },

    help(args) {
        const argv = parseArgs(args||[]);
        const options = argv._ || [];
        if (options.length > 0) {
            const cmd = options.shift();
            that[cmd](['--help']);
        } else {
            that.__usage__(HELP);
        }
    }
};

const args = process.argv.slice(2);
const command = args.shift();
if (command && that[command]) {
    try {
        that[command](args);
    } catch (error) {
        console.log(error.toString());
    }
} else {
    usage();
}

var pendingKill = false;
process.on('SIGINT', function() {
    if (that.__spawnedChild__) {
        if (pendingKill) {
            console.log('Forcing HARD reset');
            that.reset([]);
            process.kill(that.__spawnedChild__.pid, 'SIGTERM');
        } else {
            console.log('Propagating signal to child');
            pendingKill = true;
        }
    }
});
