const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Supabase auth-js uses package exports that Metro can mis-resolve on reload.
config.resolver.unstable_enablePackageExports = false;

// Ignore stale temp folders left by npx eas-cli (prevents Metro watcher ENOENT crashes).
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /node_modules[/\\]\.eas-cli-.*/,
];

module.exports = config;
