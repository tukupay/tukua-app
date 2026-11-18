#!/usr/bin/env node
/**
 * After `expo prebuild -p android --clean`: sign release builds with the Play upload key from
 * credentials.json (local builds; EAS is not used). Re-runnable: does nothing if already injected.
 * Reads no secret itself; Gradle reads credentials.json at build time.
 */
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let s = fs.readFileSync(file, 'utf8');
if (s.includes('tukuaUpload')) {
  console.log('Upload signing already in build.gradle');
  process.exit(0);
}

const block = `    signingConfigs {
        tukuaUpload {
            def creds = new groovy.json.JsonSlurper().parse(rootProject.file('../credentials.json')).android.keystore
            storeFile rootProject.file('../' + creds.keystorePath)
            storePassword creds.keystorePassword
            keyAlias creds.keyAlias
            keyPassword creds.keyPassword
        }
`;
if (!s.includes('    signingConfigs {\n')) throw new Error('signingConfigs block not found in build.gradle');
s = s.replace('    signingConfigs {\n', block);

const rel = /(release \{[\s\S]*?)signingConfig signingConfigs\.debug/;
if (!rel.test(s)) throw new Error('release signingConfig not found in build.gradle');
s = s.replace(rel, '$1signingConfig signingConfigs.tukuaUpload');

fs.writeFileSync(file, s);
console.log('Release builds now signed with the upload key');
