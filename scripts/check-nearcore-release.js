#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const NEARCORE_REPO = 'near/nearcore';
const LIB_RS_PATH = 'crate/src/lib.rs';
const GET_BINARY_TS_PATH = 'npm/src/getBinary.ts';

const FILES_TO_UPDATE = {
    libRs: updateLibRs,
    getBinaryTs: updateGetBinaryTs
};

async function makeRequest(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
}

async function getLatestNearCoreVersion() {
    try {
        const url = `https://api.github.com/repos/${NEARCORE_REPO}/releases/latest`;
        const data = await makeRequest(url);
        const release = JSON.parse(data);
        const version = release.tag_name.replace(/^v/, '');
        console.log(`Latest NEAR Core version: ${version} (released on ${release.published_at})`);
        return { version, releaseDate: release.published_at };
    } catch (error) {
        console.error('Error fetching latest NEAR Core version:', error.message);
        throw error;
    }
}

function getCurrentVersion() {
    try {
        const libRsPath = path.join(process.cwd(), LIB_RS_PATH);
        const content = fs.readFileSync(libRsPath, 'utf8');
        const match = content.match(/DEFAULT_NEAR_SANDBOX_VERSION: &str = "([^"]+)"/);

        if (!match) {
            throw new Error('Could not find DEFAULT_NEAR_SANDBOX_VERSION in lib.rs');
        }

        const version = match[1];
        console.log(`Current NEAR Core version: ${version}`);
        return version;
    } catch (error) {
        console.error('Error reading current version:', error.message);
        throw error;
    }
}

function updateLibRs(newVersion, releaseDate) {
    try {
        const libRsPath = path.join(process.cwd(), LIB_RS_PATH);
        let content = fs.readFileSync(libRsPath, 'utf8');

        content = content.replace(
            /DEFAULT_NEAR_SANDBOX_VERSION: &str = "[^"]*";/,
            `DEFAULT_NEAR_SANDBOX_VERSION: &str = "${newVersion}";`
        );

        const formattedReleaseDate = new Date(releaseDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        content = content.replace(
            /Currently pointing to nearcore@v[^ ]* released on .*$/m,
            `Currently pointing to nearcore@v${newVersion} released on ${formattedReleaseDate}`
        );

        fs.writeFileSync(libRsPath, content, 'utf8');
        console.log(`Updated ${LIB_RS_PATH} with version ${newVersion}`);
    } catch (error) {
        console.error('Error updating lib.rs:', error.message);
        throw error;
    }
}

function updateGetBinaryTs(newVersion) {
    try {
        const getBinaryPath = path.join(process.cwd(), GET_BINARY_TS_PATH);
        let content = fs.readFileSync(getBinaryPath, 'utf8');

        content = content.replace(
            /\/nearcore\/[^\/]+\/[^\/]+\/near-sandbox\.tar\.gz/,
            `/nearcore/\${platform}-\${arch}/${newVersion}/near-sandbox.tar.gz`
        );

        fs.writeFileSync(getBinaryPath, content, 'utf8');
        console.log(`Updated ${GET_BINARY_TS_PATH} with version ${newVersion}`);
    } catch (error) {
        console.error('Error updating getBinary.ts:', error.message);
        throw error;
    }
}

async function main() {
    console.log('🔍 Checking for NEAR Core updates...\n');

    try {
        const currentVersion = getCurrentVersion();
        const { version: latestVersion, releaseDate } = await getLatestNearCoreVersion();

        if (currentVersion === latestVersion) {
            console.log('\n✅ No update needed. Current version is up to date.');
            return;
        }

        console.log(`\n🔄 Update needed: ${currentVersion} → ${latestVersion}\n`);

        Object.entries(FILES_TO_UPDATE).forEach(([key, updateFunction]) => {
            console.log(`Updating ${key}...`);
            updateFunction(latestVersion, releaseDate);
        });

        console.log('\n✅ Files updated successfully. Changes will be detected by git status.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
}); 
