(function () {
    const stars = document.getElementsByClassName("svg-animated");

    function randomPosBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randomPos(max) {
        return Math.floor(Math.random() * max) + "px";
    }

    function setStarToRandomPos() {
        const docHeight = window.innerHeight;
        let docWidth = window.innerWidth;

        // set them to random positions

        const maxY = docHeight - stars[0].clientHeight / 2;
        let maxX;

        for (var i = 0; i < stars.length; i++) {
            maxX =
                (docWidth / stars.length) * (i + 1) - stars[0].clientWidth / 2;
            let minX = (docWidth / stars.length) * i - stars[0].clientWidth / 2;
            console.log("docWidth", minX, maxX);
            stars[i].style.left = randomPosBetween(minX, maxX);
            stars[i].style.top = randomPos(maxY);
        }
    }

    stars[0].addEventListener(
        "animationstart",
        setInterval(function () {
            setStarToRandomPos();
        }, 2000)
    );
})();
