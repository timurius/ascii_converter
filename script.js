"use strict";
let file;
let imgInput = document.getElementById('imgInput');
imgInput.addEventListener('change', uploadHandler);
const imgDropZone = document.getElementById('imgDropZone');
let cvs = document.getElementById('preview');
let gradient = `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^\`'.`
let gradientInput = document.getElementById('gradient');
gradientInput.placeholder = gradient;
gradientInput.addEventListener('change', (e) => {gradient = e.target.value});

async function process(file) {
	let img, ctx, pixels;

	if (file.type.startsWith("image")) {
		img = await readImg(file);
		ctx = loadImg(img, cvs);
		pixels = toPixels(ctx, cvs.width, cvs.height);
		//const pixelsCropped, widthCropped, heightCropped = ...crop(pixels, scale);
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
	return ctx.getImageData(0, 0, width, height);
}

function ASCIIConverter(pixels, width, height, scale, gradient) {
	let result;
	for (let y = yOffset; y <= height; y++) {
		for (let x = xOffset; x <= width; x + 4){

		}
	}
}

function extractColors(pixels) {
	let colors = {};
	//for (let pixel = 0
}

async function uploadHandler(event){
	file = event.target.files[0];
	event.target.parentElement.style.display = "none";
	process(file);
}

function dropHandler(event) {
	file = [...event.dataTransfer.files][0];	
	event.target.style.display = "none";
	process(file);
}
window.addEventListener("drop", (e) => {
	e.preventDefault();
});
window.addEventListener("dragover", (e) => {
	e.preventDefault();
});

imgDropZone.addEventListener("drop", dropHandler);

