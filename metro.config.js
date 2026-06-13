const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Supabase auth-js uses package exports that Metro can mis-resolve on reload.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
