module.exports = {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
  port: 6612,
  debug: true,
  enableCluster: true,
  ipAddressRegistryExpireTime: 6 * 60 * 60, // 6 hours
  conversationExpireTime: 5 * 60, // 5 minutes
};
