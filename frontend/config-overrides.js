const path = require('path');

module.exports = function override(config, env) {
  // Add CSV file loader
  config.module.rules.push({
    test: /\.csv$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  });

  return config;
}; 