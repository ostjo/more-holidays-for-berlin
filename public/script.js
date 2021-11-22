(function () {
    window.onload = () => {
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        let isPressed = false;
        const signatureVal = document.getElementById("signature");
        const offsetLeft =
            canvas.getBoundingClientRect().left + window.pageXOffset;
        const offsetTop =
            canvas.getBoundingClientRect().top + window.pageYOffset;

        let mouseX = null;
        let mouseY = null;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "black";
        ctx.lineWidth = "1";

        function pressed(event) {
            if (event.type == "touchstart") {
                mouseX = event.touches[0].pageX - offsetLeft;
                mouseY = event.touches[0].pageY - offsetTop;
            } else {
                mouseX = event.pageX - offsetLeft;
                mouseY = event.pageY - offsetTop;
            }

            isPressed = true;
            ctx.beginPath();
            ctx.moveTo(mouseX, mouseY);
        }

        function released() {
            console.log("released!");
            if (isPressed) {
                const signatureUrl = canvas.toDataURL();
                signatureVal.setAttribute("value", signatureUrl);
            }
            isPressed = false;
        }

        function moving(event) {
            if (isPressed) {
                if (event.type == "touchmove") {
                    mouseX = event.touches[0].pageX - offsetLeft;
                    mouseY = event.touches[0].pageY - offsetTop;
                } else {
                    mouseX = event.pageX - offsetLeft;
                    mouseY = event.pageY - offsetTop;
                }
                // start drawing
                ctx.lineTo(mouseX, mouseY);
                ctx.stroke();
            }
        }

        canvas.addEventListener("mousedown", pressed);
        document.addEventListener("mouseup", released);
        canvas.addEventListener("mousemove", moving);

        canvas.addEventListener("touchstart", pressed);
        document.addEventListener("touchend", released);
        canvas.addEventListener("touchmove", moving);
    };
})();
