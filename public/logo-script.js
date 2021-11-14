(function () {
    const logoParent = document.getElementById("logo");
    const logo = logoParent.querySelector("p");

    logo.addEventListener("mouseover", () => {
        logo.innerHTML = "More Holidays For Berlin";
    });

    logo.addEventListener("mouseout", () => {
        logo.innerHTML = "MHFB";
    });
})();
