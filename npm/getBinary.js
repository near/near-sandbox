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
    const baseUrl = process.env.SANDBOX_ARTIFACT_URL || 'https://ipfs.io/ipfs/QmZ6MQ9VMxBcahcmJZdfvUAbyQpjnbHa9ixbqnMTq2k8FG';
    const url = `${baseUrl}/${ platform }-near-sandbox.tar.gz`;
    const name = 'near-sandbox';
    return new Binary(name, url);
}

module.exports = getBinary;
