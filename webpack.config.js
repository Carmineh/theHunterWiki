const path = require('path'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  CopyPlugin = require('copy-webpack-plugin'),
  { CleanWebpackPlugin } = require('clean-webpack-plugin'),
  OverwolfPlugin = require('./overwolf.webpack');

const dist = path.resolve(__dirname, 'dist/');

/** One HTML page per Overwolf window; `options` are exposed to the template. */
const page = (name, template, options = {}) =>
  new HtmlWebpackPlugin({
    template,
    filename: path.join(dist, `${name}.html`),
    chunks: [name],
    ...options,
  });

module.exports = (env) => ({
  entry: {
    background: './src/background/background.ts',
    desktop: './src/desktop/desktop.ts',
    in_game: './src/in_game/in_game.ts',
    uninstall: './src/uninstall/uninstall.ts',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: dist,
    filename: 'js/[name].js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [{ from: 'public', to: './' }],
    }),
    page('background', './src/background/background.html'),
    page('uninstall', './src/background/background.html'),
    page('desktop', './src/wiki/wiki.html', { isDesktop: true }),
    page('in_game', './src/wiki/wiki.html', { isDesktop: false }),
    new OverwolfPlugin(env),
  ],
});
