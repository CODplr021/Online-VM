document.addEventListener("DOMContentLoaded", function() {
    const powerBtn = document.getElementById("powerBtn");
    const screenArea = document.getElementById("screenArea");
    const fsBtn = document.getElementById("fsBtn");
    const container = document.getElementById("monitorContainer");

    let isPoweredOn = false;

    // Power Button Logic
    powerBtn.addEventListener("click", function() {
        isPoweredOn = !isPoweredOn;

        if (isPoweredOn) {
            // Turn ON: Update with check/power icon and load VM
            powerBtn.innerHTML = `<i class="fa-solid fa-power-off"></i> Power: ON`;
            powerBtn.classList.remove("power-off");
            powerBtn.classList.add("power-on");

            screenArea.innerHTML = `<iframe src="https://copy.sh/v86/?profile=tinycore"></iframe>`;
        } else {
            // Turn OFF: Reset button and show offline screen
            powerBtn.innerHTML = `<i class="fa-solid fa-power-off"></i> Power: OFF`;
            powerBtn.classList.remove("power-on");
            powerBtn.classList.add("power-off");

            screenArea.innerHTML = `<div id="offlineMessage" class="offline-text"><i class="fa-solid fa-triangle-exclamation"></i> [ System Powered Off ]</div>`;
        }
    });

    // Fullscreen Button Logic
    fsBtn.addEventListener("click", function() {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
    });
});
