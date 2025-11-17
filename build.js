const fs = require('fs');
const path = require('path');

// Create dist/renderer directory if it doesn't exist
const distRendererDir = path.join(__dirname, 'dist', 'renderer');
if (!fs.existsSync(distRendererDir)) {
  fs.mkdirSync(distRendererDir, { recursive: true });
}

// Copy HTML file
const srcHtml = path.join(__dirname, 'src', 'renderer', 'index.html');
const destHtml = path.join(distRendererDir, 'index.html');

let htmlContent = fs.readFileSync(srcHtml, 'utf-8');

// Update script path for production build
htmlContent = htmlContent.replace(
  'src="../../dist/renderer/renderer.js"',
  'src="renderer.js"'
);

fs.writeFileSync(destHtml, htmlContent);

console.log('Build completed: HTML file copied to dist/renderer/');
