import path from "path";
import webpack from 'webpack';

export default function config(env: any, argv: any) {
  const configuration: webpack.Configuration = {
    entry: {
      edit: {
        import: './src/client/edit.js'
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
      filename: '[name].bundle.js',
      path: path.resolve('static/dist')
    },
    watch: true
  };

  if (argv.mode === 'development') {
    configuration.devtool = 'inline-source-map';
  }

  return configuration;
};
