const fs = require('fs');
const path = require('path');

const lc = {
    rootDir: './',
    outfile: './ls.json',
    includesSuffix: ['.md']
};
fs.writeFileSync(lc.outfile, JSON.stringify(getDirFiles(lc.rootDir), null, 2));

function getDirFiles(dir) {
    let re = {};
    fs.readdirSync(dir).forEach(name => {
        let p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) {
            re[name] = getDirFiles(p);
            if (Object.keys(re[name]).length < 1) delete re[name];
        } else if (lc.includesSuffix.find(e => name.endsWith(e))) {
            re[name] = null;
        }
    });
    return re;
}