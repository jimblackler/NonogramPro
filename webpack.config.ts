import path from 'path';
import webpack from 'webpack';
import {WebpackManifestPlugin} from 'webpack-manifest-plugin';

export default function config(env: any, argv: any) {
  const configuration: webpack.Configuration = {
    entry: {
      editMain: {
        import: './src/client/editMain.ts'
      },
      listMain: {
        import: './src/client/listMain.ts'
      },
      playMain: {
        import: './src/client/playMain.ts'
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
      filename: '[name].[contenthash].bundle.js',
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
