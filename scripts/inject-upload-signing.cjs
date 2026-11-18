#!/usr/bin/env node
/**
 * After `expo prebuild -p android --clean`: sign release builds with the Play upload key from
 * credentials.json (local builds; EAS is not used). Re-runnable: does nothing if already injected.
 * Reads no secret itself; Gradle reads credentials.json at build time.
 */
const fs = require('node:fs');
const path = require('node:path');

const androidDir = path.join(__dirname, '..', 'android');

// prebuild --clean also drops these: the SDK path, and Gradle memory big enough for release lint (Metaspace OOM at 512m).
const sdk = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
fs.writeFileSync(path.join(androidDir, 'local.properties'), `sdk.dir=${sdk.replace(/\\/g, '/')}\n`);
const propsFile = path.join(androidDir, 'gradle.properties');
const props = fs.readFileSync(propsFile, 'utf8');
fs.writeFileSync(
  propsFile,
  props.replace(/^org\.gradle\.jvmargs=.*$/m, 'org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError'),
);

const file = path.join(androidDir, 'app', 'build.gradle');
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
