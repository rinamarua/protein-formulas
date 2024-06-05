const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'app.js',
        path: path.resolve(__dirname, 'public'),
    },
    mode: 'development',
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 9000,
        open: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
};
