const fs = require('fs-extra');
const path = require('path');

// 源目录和目标目录
const sourceDir = path.join(__dirname, 'src','public');
const targetDir = path.join(__dirname, 'dist','public');
fs.copySync(sourceDir, targetDir);



