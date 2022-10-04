import path from 'path';
import webpack from 'webpack';
import {WebpackManifestPlugin} from 'webpack-manifest-plugin';

export default function config(env: any, argv: any) {
  const configuration: webpack.Configuration = {
    entry: {
      edit: {
        import: './src/client/edit.ts'
      },
      list: {
        import: './src/client/list.js'
      },
      play: {
        import: './src/client/play.js'
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [{
            loader: 'ts-loader',
            options: {
              configFile: "tsconfig.client.json"
            }
          }],
        }
      ],
    },
    resolve: {
      extensions: ['.js', '.ts'],
    },
    output: {
      clean: true,
      filename: '[name].bundle.js',
      path: path.resolve('static/dist')
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    plugins: [
      new WebpackManifestPlugin({
        fileName: '../../out/webpack-manifest.json',
        generate: (seed, files, entries) => ({entries})
      })
    ],
    watch: true
  };

  if (argv.mode === 'development') {
    configuration.devtool = 'inline-source-map';
  }

  return configuration;
};
