const fs = require('fs');
const path = require('path');

// Compile main/lib code (excluding renderer)
console.log('Building main process and libraries...');
const { execSync } = require('child_process');
execSync('tsc', { stdio: 'inherit' });

// Create dist/renderer directory if it doesn't exist
const distRendererDir = path.join(__dirname, 'dist', 'renderer');
if (!fs.existsSync(distRendererDir)) {
  fs.mkdirSync(distRendererDir, { recursive: true });
}

// Copy renderer.js file
const srcJs = path.join(__dirname, 'src', 'renderer', 'renderer.js');
const destJs = path.join(distRendererDir, 'renderer.js');
fs.copyFileSync(srcJs, destJs);

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

console.log('Build completed: HTML and JS files copied to dist/renderer/');
