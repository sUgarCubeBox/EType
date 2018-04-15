var path = require('path');
module.exports = {
    entry: "./Scripts/src/App.tsx",
    output: {
        filename: "./Scripts/dist/bundle.js",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        modules: [path.join(__dirname, 'Scripts/src'), 'node_modules'],
        extensions: [ ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                enforce: 'pre',
                loader: 'ts-loader',
            },
            {
                test: /\.js$/,
                enforce: "pre",
                loader: "source-map-loader"
            }
        ]
    }
}