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

class Ascii {
	constructor(map = [], colorMap = []) {
		this.map = map; 
		this.colorMap = colorMap;
		this.text = "";
		this.html = "";
	}
	toString() {

	}
	toHtml(width) {
		let result = '<div class="output__row">';
		for (let i = 0; i < this.map.length; i++){
			if (i % width === 0 && i != 0 && i + width != this.map.length - 1){
				result += '</div><div class="output__row">';
			}
			else if (i + width === this.map.length){
				result += '</div>';
			}
			let hexColor = rgbToHex(this.colorMap[i]);
			result += this.colorMap.length > 0 ? `<span class="output_char" style="color: #${hexColor};">${this.map[i]}</span>` : `<span class="output_char">${this.map[i]}</span>`;
		}
		return result;
	}
}
	
function convertDecorator(canvas, context) {
	let pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
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

	return function(settings){
		console.log('Processing');
		let characterMap = new Array();
		let colorMap = new Array();
		let x = 0, y = 0, xOffset = 0, chunk = []; 
		while (x < canvas.width * 4) {
			y = 0;
			chunk.length = 0;
			while (y < canvas.height) {
				xOffset = 0;
				while ( (xOffset < settings.scale * 4) && (x + xOffset < canvas.width * 4) ) {
					chunk.push(pixels[ (x + xOffset) + canvas.width * 4 * y ]);	
					xOffset++;
				}
				if (y % settings.scale === 0 || y === canvas.height - 1) {
					let character = modes[settings.mode](chunk, settings.gradient);
					let color = colormodes[settings.colormode] ? colormodes[settings.colormode](chunk) : undefined;
					characterMap[ Math.ceil(x / settings.scale / 4) + Math.ceil(canvas.width / settings.scale) * Math.ceil(y / settings.scale) ] = character;
					colorMap[ Math.ceil(x / settings.scale / 4) + Math.ceil(canvas.width / settings.scale) * Math.ceil(y / settings.scale) ] = color;
					chunk.length = 0;
				}
				y += 1;
			}
			x += settings.scale * 4;
		}
		console.log(characterMap.length);
		console.log(Math.ceil(pixels.length / 4 / settings.scale));
		return new Ascii(characterMap, colorMap);
	}
}
	

let imgInput = document.getElementById('imgInput');
imgInput.addEventListener('change', uploadHandler);
const imgDropZone = document.getElementById('imgDropZone');
let cvs = document.getElementById('preview');
let output = document.getElementById('txtOutput');
let outputContainer = document.getElementById('outputContainer');
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
	if (file.type.startsWith("image")) {
		let img = await createImageBitmap(file);
		cvs.width = img.width;
		cvs.height = img.height;
		const ctx = cvs.getContext('2d');
		console.log(img);
		ctx.drawImage(img, 0, 0, cvs.width, cvs.height);

		let convert = convertDecorator(cvs, ctx);

		for (let i = 0; i < outputContainer.children.length; i++) {
			outputContainer.children[i].style.aspectRatio = `${cvs.width}/${cvs.height}`;
		}
		
		let ascii = convert(settings);
		console.log(ascii.map);
		output.style['font-size'] = output.offsetWidth / Math.ceil(cvs.width / settings.scale) + "px";
		output.innerHTML = ascii.toHtml(Math.ceil(cvs.width / settings.scale));  
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

