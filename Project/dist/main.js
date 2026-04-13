"use strict";
function showAlert() {
    const input = document.getElementById("alert-input");
    const output = document.getElementById("alert-output");
    const message = input === null || input === void 0 ? void 0 : input.value.trim();
    const display = message || "Hello World";
    const reversed = display.split("").reverse().join("");
    alert(display);
    if (output.value.length > 0) {
        output.value += "\n";
    }
    output.value += `${reversed}\n${display}`;
    output.scrollTop = output.scrollHeight;
}
function init() {
    const button = document.getElementById("hello-btn");
    if (button) {
        button.addEventListener("click", showAlert);
    }
}
document.addEventListener("DOMContentLoaded", init);
