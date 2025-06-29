const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [],
  resolver: {
    useWatchman: false, // Watchman 비활성화로 안정성 향상
  },
  server: {
    port: 8081,
    enhanceMiddleware: (middleware, server) => {
      return (req, res, next) => {
        // Google Places API 관련 요청은 무시
        if (req.url && req.url.includes('maps.googleapis.com')) {
          return next();
        }
        return middleware(req, res, next);
      };
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
