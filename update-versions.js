const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];
if (!newVersion) {
  console.error('No version specified!');
  process.exit(1);
}

console.log(`Updating files to version ${newVersion}...`);

const filesToUpdate = [
  {
    path: path.join(__dirname, 'rollup.config.js'),
    regex: /(@iwy\/live-avatar v)\d+\.\d+\.\d+/g,
    replacement: `$1${newVersion}`
  },
  {
    path: path.join(__dirname, 'README.md'),
    regex: /(@iwy\/live-widgets@)\d+\.\d+\.\d+/g,
    replacement: `$1${newVersion}`
  }
];

filesToUpdate.forEach(({ path, regex, replacement }) => {
  try {
    let content = fs.readFileSync(path, 'utf8');
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      fs.writeFileSync(path, content, 'utf8');
      console.log(`Successfully updated version in ${path}`);
    } else {
      console.warn(`Pattern not found in ${path}. File not updated.`);
    }
  } catch (error) {
    console.error(`Error updating ${path}:`, error);
    process.exit(1);
  }
});

console.log('Version updates complete.');
