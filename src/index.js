"use strict";
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector('.overlay').style.opacity = 0;
    console.log("Index page loaded");
});

document.getElementById("indivLink").addEventListener("click", function(e) {
    let sound = document.getElementById('clickSound');
    sound.play();

    setTimeout(function () {
        const header = document.querySelector('h1');
        header.textContent = "The invasion has started. Nowhere is safe.";
        header.style.fontFamily = "'Courier New', Courier, monospace";
    }, 1000);


    setTimeout(function() {
        const lst = document.querySelectorAll('a');
        let i = 0;
        const id = setInterval(() => {
            if (i > lst.length) {
                clearInterval(id);
            }
            lst[i].style.fontFamily = "'Courier New', Courier, monospace";
            lst[i].innerText = "Run.";
            i++;
        }, 70)
    }, sound.duration * 1000)

    document.querySelector('.overlay').style.opacity = 1;

    setTimeout(function () {
        window.location.href = document.getElementById('indivLink').href;
    }, sound.duration * 1000 + 1300);
    e.preventDefault();
    e.stopPropagation();
});
