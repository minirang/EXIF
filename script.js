'use strict';
function syntaxHighlight(json) {
    json = json.replace(/(&|<|>)/g, function (match) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;"
        }[match];
    });
    return json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\\s*:)?|\b(true|false|null)\b|\b\d+\b)/g,
        function (match) {
            let color = "#fff";
            if (/^"/.test(match)) {
                color = /:$/.test(match) ? "#74b9ff" : "#55efc4";
            } else if (/true|false/.test(match)) {
                color = "#fd79a8";
            } else if (/null/.test(match)) {
                color = "#ffeaa7";
            } else {
                color = "#fab1a0";
            }
            return `<span style="color:${color}">${match}</span>`;
        }
    );
}

async function processChunked(data, outputElement) {
    const jsonLines = JSON.stringify(data, null, 2).split('\n');
    const CHUNK_SIZE = 100;
    const copyBtn = document.getElementById("copyBtn");
    outputElement.innerHTML = "";

    for (let i = 0; i < jsonLines.length; i += CHUNK_SIZE) {
        const chunk = jsonLines.slice(i, i + CHUNK_SIZE).join('\n');
        outputElement.innerHTML += syntaxHighlight(chunk) + (i + CHUNK_SIZE < jsonLines.length ? '\n' : '');
        await new Promise(resolve => setTimeout(resolve, 1));
    }

    copyBtn.style.display = "inline-block";
    copyBtn.onclick = function () {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
            alert('Copied!');
        });
    };
}

document.getElementById("imageInput").addEventListener("change", function (e) {
    const copyBtn = document.getElementById("copyBtn");
    copyBtn.style.display = "none";
    copyBtn.onclick = null;
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        document.getElementById("output").textContent = "Please select an image file.";
        return;
    }
    const img = document.getElementById("preview");
    const output = document.getElementById("output");
    output.textContent = "Analyzing...";
    alert("이미지 분석이 시작됩니다.\n큰 이미지의 경우 시간이 오래 걸릴 수 있으며,\n브라우저가 잠시 멈출수 있으나 잠시 기다리시면 해결 됩니다.\n\nImage analysis is starting. For large images,\nit may take some time and the browser might freeze for a moment,\nbut please wait a bit.");
    if (img.src) {
        URL.revokeObjectURL(img.src);
    }
    img.src = URL.createObjectURL(file);
    img.onload = function () {
        this.exifdata = null;
        EXIF.getData(this, function () {
            const allMetaData = EXIF.getAllTags(this);
            if (Object.keys(allMetaData).length > 0) {
                processChunked(allMetaData, output);
            } else {
                output.textContent = "No EXIF data found.";
            }
        });
    };
    img.onerror = function () {
        output.textContent = "Failed to load image.";
    };
});
