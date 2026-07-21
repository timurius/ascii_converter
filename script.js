"use strict";

let settings = {
	'gradientDefault': `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^\`'. `,
	'scale': 8,
	'gradient': `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^\`'. `,
	'file': undefined,
	'mode': 'mean',
	'colormode' : 'mono',
	'shading': true,
	'outline': false,
	'densityControl': 'space-between',
	'invertGradient': false,
	update(form) {
		form = Object.fromEntries(new FormData(form))
		this.scale = form.scale;
		this.gradient = form.gradient == undefined ? this.defaultgradient : form.gradient;
		this.mode = form.mode;
		this.colormode = form.colormode;
		if (form.shading === 'on') {
			this.shading = true;
		} else {
			this.shading = false;
		}
		if (form.outline === 'on') {
			this.outline = true;
		} else {
			this.outline = false;
		}
		if (form.invertGradient === 'on') {
			this.invertGradient= true;
		} else {
			this.invertGradient = false;
		}
		if (this.gradient == '') this.gradient = this.gradientDefault; 
		if (this.invertGradient) {
			let y = 0;
			for (let x = 0; x < Math.floor(this.gradient.length / 2); ++x) {
				y = this.gradient.length - x - 1;
				this.gradient = this.gradient.substring(0, x) + this.gradient[y] + this.gradient.substring(x + 1, y) + this.gradient[x] + this.gradient.substring(y + 1);
			}
		}
	}
};

let imgInput = document.getElementById('imgInput');
imgInput.addEventListener('change', uploadHandler);
const imgDropZone = document.getElementById('imgDropZone');
let cvs = document.getElementById('preview');
let output = document.getElementById('txtOutput');
let gradientInput = document.getElementById('gradient');
gradientInput.placeholder = settings.gradient;
let scaleInput = document.getElementById('scale');
const submit = document.getElementById('submit-button');
submit.addEventListener('click', (e) => { e.preventDefault(); settings.update(e.target.form); process(settings.file); })
let rangeDisplay = document.getElementById('rangeDisplay');
rangeDisplay.textContent = scaleInput.value;
scaleInput.addEventListener('input', (e) => { rangeDisplay.textContent = e.target.value })
window.addEventListener('resize', (e) => { output.style['font-size'] = output.offsetWidth / Math.ceil(cvs.width / settings.scale) + "px"; })

const worker = new Worker('formatpixels.js');

async function process(file) {
	let img, ctx, pixels, asciiMap, colorMap, htmlCode;

	if (file.type.startsWith("image")) {
		img = await readImg(file);
		ctx = loadImg(img, cvs);
		pixels = toPixels(ctx, cvs.width, cvs.height);
		let [asciiMap, colorMap] = toMap(pixels, cvs.width, cvs.height, settings.scale, settings.gradient, settings.mode);
		htmlCode = toHtml(asciiMap, colorMap, Math.ceil(cvs.width / settings.scale));
		output.style['font-size'] = output.offsetWidth / Math.ceil(cvs.width / settings.scale) + "px";
		output.innerHTML = htmlCode;  
	}
}

async function readImg(file){
	const img = await createImageBitmap(file);
	return img;
}

function loadImg(img, cvs) {
	cvs.width = img.width;
	cvs.height = img.height;
	let ctx = cvs.getContext('2d');
	ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
	return ctx;
}

function toPixels(ctx, width, height){
	return ctx.getImageData(0, 0, width, height).data;
}

function toMap(pixels, width, height, scale, gradient, mode, colormode) {
	console.log('Processing');
	let characterMap = new Array();
	let colorMap = new Array();
	let x = 0, y = 0, xOffset = 0, chunk = []; 
	while (x < width * 4) {
		y = 0;
		chunk.length = 0;
		while (y < height) {
			xOffset = 0;
			while ( (xOffset < scale * 4) && (x + xOffset < width * 4) ) {
				chunk.push(pixels[ (x + xOffset) + width * 4 * y ]);	
				xOffset++;
			}
			if (y % scale === 0 || y === height - 1) {
				let character = modes[mode](chunk, gradient);
				let color = colormodes[settings.colormode] ? colormodes[settings.colormode](chunk) : undefined;
				characterMap[ Math.ceil(x / scale / 4) + Math.ceil(width / scale) * Math.ceil(y / scale) ] = character;
				colorMap[ Math.ceil(x / scale / 4) + Math.ceil(width / scale) * Math.ceil(y / scale) ] = color;
				chunk.length = 0;
			}
			y += 1;
		}
		x += scale * 4;
	}
	return [characterMap, colorMap];
}

function toHtml(asciiMap, colorMap, width) {
	console.log('Converting to html');
	console.log(asciiMap);
	console.log(colorMap);
	console.log(width);
	let result = '<div class="output__row">';
	for (let i = 0; i < asciiMap.length; i++){
		if (i % width === 0 && i != 0 && i + width != asciiMap.length - 1){
			result += '</div><div class="output__row">';
		}
		else if (i + width === asciiMap.length){
			result += '</div>';
		}
		let hexColor = rgbToHex(colorMap[i]);
		result += colorMap.length > 0 ? `<span class="output_char" style="color: #${hexColor};">${asciiMap[i]}</span>` : `<span class="output_char">${asciiMap[i]}</span>`;
	}
	return result;
}

const modes = {
	mean(chunk, gradient) {
		let character = '';
		let total = 0;
		for (let i = 0; i < chunk.length; i += 4){
			total = total + (chunk[i] + chunk[i + 1] + chunk[i + 2]);
		}
		const average = total / 3 / ( chunk.length / 4 );
		return gradient[ Math.round( (gradient.length - 1) * average / 255) ];
	}
}
const colormodes = {
	dominant(chunk) {
		let colors = {};
		for (let i = 0; i < chunk.length; i += 4){
			let rgb = new Array();
			for (let x = 0; x < 3; x++){
				let value = chunk[i + x].toString();
				rgb[x] = fillFront(value, '0', 3);
			}
			let color = rgb.join('');
			colors[color] = colors[color] ? colors[color] + 1 : 1;
		}
		let dominantColor;
		for (let color in colors) {
			dominantColor = color;
			break;
		}
		for (let color in colors) {
			if (colors[color] > colors[dominantColor]) {
				dominantColor = color;
			}
		}
		return dominantColor;
	}
}

function fillFront(str, chr, length){
	return ((new Array(length)).fill(chr).join('') + str).slice( -length, str.length + length );
}

function rgbToHex(rgb){
	if (rgb) {
		let result = '';
		for (let i = 0; i < rgb.length; i += 3){
			result += fillFront(parseInt(rgb.substring(i, i + 3)).toString(16), '0', 2);
		}
		return result;
	}
}

async function uploadHandler(event){
	settings.file = event.target.files[0];
	event.target.parentElement.style.display = "none";
	process(settings.file);
}

function dropHandler(event) {
	settings.file = [...event.dataTransfer.files][0];	
	event.target.style.display = "none";
	process(settings.file);
}

window.addEventListener("drop", (e) => {
	e.preventDefault();
});
window.addEventListener("dragover", (e) => {
	e.preventDefault();
});

imgDropZone.addEventListener("drop", dropHandler);

