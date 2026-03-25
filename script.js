"use strict";

let settings = {
	'gradientDefault': `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^\`'. `,
	'scale': 8,
	'gradient': `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^\`'. `,
	'file': undefined,
	'mode': 'mean',
	'shading': true,
	'outline': false,
	'densityControl': 'space-between',
	update(form) {
		for (let key in this) {
			if (form[key] != undefined) this[key] = form[key].value;
		}
		if (this.gradient == '') this.gradient = this.gradientDefault; 
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

const worker = new Worker('formatpixels.js');

async function process(file) {
	let img, ctx, pixels, ASCII, HTML;

	if (file.type.startsWith("image")) {
		img = await readImg(file);
		ctx = loadImg(img, cvs);
		pixels = toPixels(ctx, cvs.width, cvs.height);
		ASCII = toASCII(pixels, cvs.width, cvs.height, settings.scale, settings.gradient, settings.mode);
		HTML = toHTML(ASCII);
		output.style['font-size'] = output.offsetWidth / Math.ceil(cvs.width / settings.scale) + "px";
		output.innerHTML = HTML;  
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

function toASCII(pixels, width, height, scale, gradient, mode) {
	let result = Array(Math.ceil((width / scale) * (height / scale)));
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
				result[ x / 4 + width * y ] = character;
				chunk.length = 0;
			}
			y += 1;
		}
		x += scale * 4;
	}
	result = result.join('')
	let position = 0;
	for (let i = 1; i <= Math.ceil(height / scale); i++) {
		position = i * (Math.ceil(width / scale)) + (i - 1);
		result = result.substring(0, position) + '\n' + result.substring(position);
	}
	return result;
}

function toHTML(ASCII) {
	let result = '';
	ASCII = ASCII.split('\n')
	return ASCII.map( (row) => {
		let editedRow = ''
		for (let i = 0; i < row.length; i++){
			editedRow += '<span>' + row[i] + '</span>';
		}
		return '<div>' + editedRow + '</div>';
	} ).join('');
}

const modes = {
	mean(chunk, gradient) {
		let character = '';
		let total = 0;
		for (let i = 0; i < chunk.length; i += 4){
			total = total + (chunk[i] + chunk[i + 1] + chunk[i + 2]);
		}
		const average = total / 3 / ( chunk.length / 4 );
		return gradient[ Math.floor(average / (255 / (gradient.length - 1))) ];
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

