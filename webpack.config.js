const path = require("path");

module.exports = {
    entry: "./src/index.ts",
    mode: "development",
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            '~': path.resolve(__dirname, "src")
        },
    },
};
