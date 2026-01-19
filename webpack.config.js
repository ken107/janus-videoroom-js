const path = require("path")

module.exports = {
  devtool: 'source-map',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, "docs"),
    filename: 'videoroom.js',
    library: {
      name: 'videoroom',
      type: 'umd',
    },
  },
}
