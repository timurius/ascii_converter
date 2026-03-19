"use strict";
let imgInput = document.getElementById('input');
imgInput.addEventListener('change', async (e) => { await handler(e) });
let cvs = document.getElementById('preview');
let gradient = `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^\`'.`
let gradientInput = document.getElementById('gradient');
gradientInput.placeholder = gradient;
gradientInput.addEventListener('change', (e) => {gradient = e.target.value});

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

async function handler(event){
	let file = event.target.files[0];
	let img, ctx, pixels;

	if (file.type.startsWith("image")) {
		img = await readImg(file);
		ctx = loadImg(img, cvs);
		pixels = toPixels(ctx, cvs.width, cvs.height);
		console.log(pixels);
	}
}
