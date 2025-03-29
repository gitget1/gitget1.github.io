module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // ✅ 이 줄이 반드시 있어야 함
  ],
};
