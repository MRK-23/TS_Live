const path = require("path");

module.exports = {
    mode: "development", // come parto
    entry: "./src/index.ts", // da dove parto
    output: {
        filename: "bundle.js",  // dove salvo
        path: path.resolve(__dirname, "dist")
    },
    resolve: {
        extensions: ["webpack.js", "web.js", "ts", "js"]
    },
    module: {
        rules: [
            {test: /\.ts$/, loader: "ts-loader"} // /\.ts$/ tutti i file TS
        ]
    }
}