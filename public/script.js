(function () {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let isPressed = false;
    const signatureVal = document.getElementById("signature");
    const offsetLeft = canvas.getBoundingClientRect().left + window.pageXOffset;
    const offsetTop = canvas.getBoundingClientRect().top + window.pageYOffset;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = "1";

    canvas.addEventListener("mousedown", (event) => {
        console.log(event.pageY - offsetTop);
        isPressed = true;
        ctx.beginPath();
        ctx.moveTo(event.pageX - offsetLeft, event.pageY - offsetTop);
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
            ctx.lineTo(event.pageX - offsetLeft, event.pageY - offsetTop);
            ctx.stroke();
        }
    });
})();
