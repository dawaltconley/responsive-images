const { file } = require(path.join(process.env.PWD, '_data', 'build'));

let data;
try {
    data = require(file);
} catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND')
        throw e;
    data = {};
}

module.exports = data;
