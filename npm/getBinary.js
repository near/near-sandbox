const { Binary } = require('binary-install');
const os = require('os');

function getPlatform() {
    const type = os.type();
    const arch = os.arch();

    // if (type === 'Windows_NT' && arch === 'x64') return 'win64';
    // TODO support windows
    if (type === 'Windows_NT') {
        console.error("Don't support windows");
        process.exit(0);
    }
    if (type === 'Linux' && arch === 'x64') return 'Linux';
    if (type === 'Darwin' && arch === 'x64') return 'Darwin';

    throw new Error(`Unsupported platform: ${type} ${arch}`);
}

function getBinary() {
    const platform = getPlatform();
    const version = require('./package.json').version;
    const url = `https://cloudflare-ipfs.com/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG/${ platform }-near-sandbox.tar.gz`;
    const name = 'near-sandbox';
    return new Binary(url, { name });
}

module.exports = getBinary;