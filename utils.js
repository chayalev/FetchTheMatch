const fs = require("fs");



const uploadFile = (path, mimeType) => {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(path)).toString("base64"),
            mimeType,
        },
    };
}
module.exports = {
    uploadFile,
}