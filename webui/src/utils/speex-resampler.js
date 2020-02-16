// This file replace the speex-resampler module used in the NodeJS integration
// The web integration is only exposing a sink and does not need any resampling but we still need
// to prvide a empty module to prevent an error while importing the module

module.exports = {};
