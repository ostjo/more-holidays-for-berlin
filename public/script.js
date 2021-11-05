(function () {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let isPressed = false;
    const offsetLeft = canvas.offsetLeft;
    const offsetTop = canvas.offsetTop;
    const signatureVal = document.getElementById("signature");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = "1";

    canvas.addEventListener("mousedown", (event) => {
        isPressed = true;
        ctx.beginPath();
        ctx.moveTo(event.clientX - offsetLeft, event.clientY - offsetTop);
    });

    document.addEventListener("mouseup", () => {
        if (isPressed) {
            const signatureUrl = canvas.toDataURL();
            signatureVal.setAttribute("value", signatureUrl);
        }
        isPressed = false;
    });

    canvas.addEventListener("mousemove", (event) => {
        if (isPressed) {
            // start drawing
            ctx.lineTo(event.clientX - offsetLeft, event.clientY - offsetTop);
            ctx.stroke();
        }
    });
})();
