const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
canvas.width = window.innerWidth - 50;
canvas.height = window.innerHeight - 100;

let drawing = false;

// Define drawing tools
const tools = {
    pencil: {
        lineWidth: 2,
        lineCap: 'round',
        globalCompositeOperation: 'source-over'
    },
    pen: {
        lineWidth: 5,
        lineCap: 'round',
        globalCompositeOperation: 'source-over'
    },
    marker: {
        lineWidth: 20,
        lineCap: 'round',
        globalCompositeOperation: 'source-over'
    },
    eraser: {
        lineWidth: 10,
        lineCap: 'round',
        globalCompositeOperation: 'destination-out'
    },
    bucket: {}  // We will handle the bucket tool logic separately
};

let currentTool = 'pencil';

document.getElementById('pencil').addEventListener('click', () => setTool('pencil'));
document.getElementById('pen').addEventListener('click', () => setTool('pen'));
document.getElementById('marker').addEventListener('click', () => setTool('marker'));
document.getElementById('eraser').addEventListener('click', () => setTool('eraser'));
document.getElementById('bucket').addEventListener('click', () => setTool('bucket'));


document.getElementById('colorPicker').addEventListener('input', (event) => {
    ctx.strokeStyle = event.target.value;
});
document.getElementById('brushSize').addEventListener('input', (event) => {
    ctx.lineWidth = event.target.value;
});
document.getElementById('clearCanvas').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.beginPath();
});
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseout', () => drawing = false);

function setTool(tool) {
    currentTool = tool;

    // Remove other classes
    for (let key in tools) {
        if (canvas.classList.contains(key)) {
            canvas.classList.remove(key);
        }
        if (key === tool) {
            document.getElementById(key).classList.add('active');
            ctx.lineWidth = tools[key].lineWidth || ctx.lineWidth;
            ctx.lineCap = tools[key].lineCap || ctx.lineCap;
            ctx.globalCompositeOperation = tools[key].globalCompositeOperation || 'source-over';
        } else {
            document.getElementById(key).classList.remove('active');
        }
    }
    canvas.classList.add(tool);
}


function draw(event) {
    if (!drawing) return;

    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

function floodFill(startX, startY, startColor, fillColor) {
    const pixelStack = [[startX, startY]];
    const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const startIdx = (startY * canvas.width + startX) * 4;

    function matchColor(idx) {
        return (
            canvasData.data[idx] === startColor[0] &&
            canvasData.data[idx + 1] === startColor[1] &&
            canvasData.data[idx + 2] === startColor[2] &&
            canvasData.data[idx + 3] === startColor[3]
        );
    }

    function colorPixel(idx) {
        canvasData.data[idx] = fillColor[0];
        canvasData.data[idx + 1] = fillColor[1];
        canvasData.data[idx + 2] = fillColor[2];
        canvasData.data[idx + 3] = fillColor[3];
    }

    while (pixelStack.length) {
        let newPos, x, y, pixelPos, reachLeft, reachRight;
        newPos = pixelStack.pop();
        x = newPos[0];
        y = newPos[1];

        pixelPos = (y * canvas.width + x) * 4;

        while (y-- >= 0 && matchColor(pixelPos)) {
            pixelPos -= canvas.width * 4;
        }
        pixelPos += canvas.width * 4;
        y++;
        reachLeft = false;
        reachRight = false;

        while (y++ < canvas.height && matchColor(pixelPos)) {
            colorPixel(pixelPos);

            if (x > 0) {
                if (matchColor(pixelPos - 4)) {
                    if (!reachLeft) {
                        pixelStack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }

            if (x < canvas.width) {
                if (matchColor(pixelPos + 4)) {
                    if (!reachRight) {
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }

            pixelPos += canvas.width * 4;
        }
    }
    ctx.putImageData(canvasData, 0, 0);
}

function getRGBFromStrokeStyle(strokeStyle) {
    if (strokeStyle.startsWith('rgb')) {
        return strokeStyle.split('(')[1].split(')')[0].split(',').map(num => +num);
    } else {
        // Handle other formats or return a default
        return [255, 255, 255]; // default to white for this example
    }
}

canvas.addEventListener('click', function(e) {
    if (currentTool === 'bucket') {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const fillColor = getRGBFromStrokeStyle(ctx.strokeStyle);
        
        floodFill(x, y, pixel, fillColor);
    }
});



// Initialize with pencil as the default tool
setTool('pencil');
