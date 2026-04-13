function showAlert(): void {
  const input = document.getElementById("alert-input") as HTMLInputElement;
  const output = document.getElementById("alert-output") as HTMLTextAreaElement;
  const message = input?.value.trim();
  const display = message || "Hello World";
  const reversed = display.split("").reverse().join("");
  alert(display);
  if (output.value.length > 0) {
    output.value += "\n";
  }
  output.value += `${reversed}\n${display}`;
  output.scrollTop = output.scrollHeight;
}
 
function init(): void {
  const button = document.getElementById("hello-btn") as HTMLButtonElement;
  if (button) {
    button.addEventListener("click", showAlert);
  }
}
 
document.addEventListener("DOMContentLoaded", init);