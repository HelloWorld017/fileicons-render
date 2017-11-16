const cson = require('cson');
const fs = require('fs');
const isRegex = require('is-regex');

const data = cson.parse(fs.readFileSync('./data/data.cson'));

const matching = Object.keys(data.fileIcons).map((v) => {
	if(typeof data.fileIcons[v].match === 'string' || isRegex(data.fileIcons[v].match))
		data.fileIcons[v].match = [data.fileIcons[v].match];

	return data.fileIcons[v].match.map((match) => {
		return [
			isRegex(match) ? `/${match.source}/${match.flags}` : match,
			{
				icon: data.fileIcons[v].icon,
				text: v
			}
		];
	});
}).reduce((prev, curr) => prev.concat(curr));

const object = {};

matching.forEach((v) => object[v[0]] = v[1])

fs.writeFileSync('./data/matched.json', JSON.stringify(object, null, '\t'));
