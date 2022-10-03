import path from "path";
import webpack from 'webpack';

export default function config(env: any, argv: any) {
  const configuration: webpack.Configuration = {
    entry: {
      main: {
        import: './src/client/main.ts'
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
