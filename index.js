const {createCanvas, registerFont} = require('canvas-prebuilt/canvas/index.js');
const cson = require('cson');
const fs = require('fs');

const ICON_PATTERN = new RegExp(
	String.raw`^\.([a-z0-9-]+)-icon:before\s*{ .([a-z]+); content: "(.+)";\s*(?:top: ((?:[0-9-]+px)|0);\s*)?`
	+ String.raw`(?:font-size: (\d+)px;\s*)?(?:top: ((?:[0-9-]+px)|0);\s*)?(?:left: ((?:[0-9-]+px)|0);\s*)?`
	+ String.raw`(?:top: ((?:[0-9-]+px)|0);\s*)?(?:transform: scale\(([0-9.]+)\);\s*)?(.sharpen;\s*)?`
	+ String.raw`(.thicken;\s*)?}$`
);

const COLOR_PATTERN = /.([a-z-]+) {\s+color:\s*(#[a-z0-9]+);\s+}/g;
const COLOR_SINGULAR = new RegExp(COLOR_PATTERN.source);

class Icon {
	constructor(matchSet, color) {
		this.name = matchSet[1];
		this.iconName = matchSet[2];
		this.glyph = matchSet[3];
		this.top = (matchSet[4] !== undefined ? matchSet[4] : (
				matchSet[6] !== undefined ? matchSet[6] : matchSet[8]
			)) || '0';
		this.fontSize = parseInt(matchSet[5]) || 15;
		this.left = matchSet[7] || '0';
		this.scale = matchSet[9] !== undefined ? parseInt(matchSet[9]) : 1;
		this.isSharpen = !!matchSet[10];
		this.isThicken = !!matchSet[11];

		if(this.glyph.startsWith('\\') && !this.glyph.startsWith('\\\\')) {
			this.glyph = String.fromCharCode(parseInt(this.glyph.replace('\\', ''), 16));
		}

		this.top = parseInt(this.top.replace('px', ''));
		this.left = parseInt(this.left.replace('px', ''));

		this.color = color;
	}

	get fontSizeRelative() {
		return this.fontSize / 16 * 512;
	}

	get leftRelative() {
		return this.left / 16 * 512;
	}

	get topRelative() {
		return this.top / 16 * 512;
	}
}

const color = new Map(fs.readFileSync('./data/color.css', 'utf8').match(COLOR_PATTERN).filter((v) => !!v)
	.map((v) => v.match(COLOR_SINGULAR)).map((v) => [v[1], v[2]]));
const icons = fs.readFileSync('./data/icons.css', 'utf8').split(/\r?\n/).map((v) => v.match(ICON_PATTERN))
	.filter((v) => !!v);

const data = cson.parse(fs.readFileSync('./data/data.cson'));

const iconList = Object.keys(data.fileIcons).map((v) => data.fileIcons[v]).map((v) => {
	return [v.icon, v.colour];
}).map((icon) => {
	const matchingIcon = icons.find((v) => v[1] === icon[0]);

	if(!matchingIcon) {
		console.error("No Matching Icon : ", icon[0]);
		return;
	}

	return new Icon(matchingIcon, icon[1]);
});

registerFont('./resources/devopicons.ttf', {family: 'devicons'});
registerFont('./resources/fontawesome.ttf', {family: 'fa'});
registerFont('./resources/file-icons.ttf', {family: 'fi'});
registerFont('./resources/mfixx.ttf', {family: 'mf'});
registerFont('./resources/octicons.ttf', {family: 'octicons'});

const canvas = createCanvas(1024, 1024);
const ctx = canvas.getContext('2d');
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

(async () => {
	for(iconId in iconList) {
		const icon = iconList[iconId];

		ctx.fillStyle = color.get(icon.color.replace('auto', 'dark'));
		ctx.fillRect(0, 0, 1024, 1024);
		ctx.font = `${icon.fontSizeRelative}px ${icon.iconName}`;
		ctx.fillStyle = '#202020';
		ctx.fillText(icon.glyph, 512 + icon.leftRelative, 512);

		await new Promise((resolve) => {
			stream = canvas.pngStream();
			out = fs.createWriteStream(`./icons/${icon.name}.png`);

			stream.on('data', (chunk) => {
				out.write(chunk);
			});

			stream.on('end', () => {
				setTimeout(resolve, 1000);
			});
		});

		console.log(`Finished ${parseInt(iconId) + 1} / ${iconList.length}`);
	}
})();
