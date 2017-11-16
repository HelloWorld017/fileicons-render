const cson = require('cson');
const fs = require('fs');

const data = cson.parse(fs.readFileSync('./data/data.cson'));
const iconLists = Object.keys(data.fileIcons).map((v) => data.fileIcons[v].icon);

const styles = [
	fs.readFileSync('./data/devicons.css', 'utf8'),
	fs.readFileSync('./data/fa.css', 'utf8'),
	fs.readFileSync('./data/fi.css', 'utf8'),
	fs.readFileSync('./data/mf.css', 'utf8'),
	fs.readFileSync('./data/octicon.css', 'utf8')
].join('\n').split('\n').filter((v) => {
	const match = v.match(/^\.(.+)-icon:before/);
	if(!match) return false;

	return iconLists.includes(match[1]);
});

const completeness = styles.length === iconLists.length;
console.log(completeness ? "All styles collected" : "Some styles collected");

if(!completeness) {
	console.log(`Missing Styles: ${iconLists.filter((icon) => {
		return !styles.find((v) => v.startsWith(`.${icon}-icon`));
	}).join(', ')}`);
}

fs.writeFileSync('./data/icons.css', styles.join('\n'));
