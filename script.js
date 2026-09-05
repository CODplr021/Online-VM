document.addEventListener("DOMContentLoaded", function() {
    const powerBtn = document.getElementById("powerBtn");
    const screenArea = document.getElementById("screenArea");
    const fsBtn = document.getElementById("fsBtn");
    const container = document.getElementById("monitorContainer");
    const bootScreen = document.getElementById("bootScreen");
    const countdownEl = document.getElementById("countdown");

    let isPoweredOn = false;
    let bootSequenceActive = false;
    let countdownInterval = null;
    let biosPressed = false;

    // Boot Screen Logic
    function startBootSequence() {
        bootSequenceActive = true;
        biosPressed = false;
        bootScreen.classList.remove("hidden");
        screenArea.style.display = "none";

        let timeLeft = 3;
        countdownEl.textContent = timeLeft;

        countdownInterval = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                if (!biosPressed) {
                    bootIntoOS();
                }
            }
        }, 1000);
    }

    function bootIntoOS() {
        bootSequenceActive = false;
        bootScreen.classList.add("hidden");
        screenArea.style.display = "flex";
        screenArea.innerHTML = `<iframe src="https://copy.sh/v86/?profile=tinycore"></iframe>`;
    }

    function enterBIOS() {
        bootSequenceActive = false;
        clearInterval(countdownInterval);
        bootScreen.classList.add("hidden");
        screenArea.style.display = "flex";
        screenArea.innerHTML = `<div class="bios-menu"><div class="bios-content">
            <h1>BIOS Setup Utility</h1>
            <p>MrChromebox Custom BIOS v1.0</p>
            <div class="bios-options">
                <div class="bios-option">Boot Options</div>
                <div class="bios-option">Storage Configuration</div>
                <div class="bios-option">System Settings</div>
                <div class="bios-option">Exit BIOS</div>
            </div>
            <p class="bios-footer">Press any key to continue boot...</p>
        </div></div>`;

        // Auto-boot after 5 seconds in BIOS
        setTimeout(() => {
            bootIntoOS();
        }, 5000);
    }

    // Keyboard Detection for BBB and boot sequence
    let bbbBuffer = "";
    document.addEventListener("keydown", function(event) {
        if (bootSequenceActive) {
            // Listen for BBB sequence
            bbbBuffer += event.key.toUpperCase();

            // Keep only last 3 characters
            if (bbbBuffer.length > 3) {
                bbbBuffer = bbbBuffer.slice(-3);
            }

            // Check if BBB was pressed
            if (bbbBuffer === "BBB") {
                biosPressed = true;
                bbbBuffer = "";
                enterBIOS();
            }

            // Any other key starts normal boot
            if (event.key !== "b" && event.key !== "B") {
                bbbBuffer = "";
                clearInterval(countdownInterval);
                if (biosPressed === false) {
                    bootIntoOS();
                }
            }
        }
    });

    // Power Button Logic
    powerBtn.addEventListener("click", function() {
        isPoweredOn = !isPoweredOn;

        if (isPoweredOn) {
            // Turn ON: Update with check/power icon and start boot sequence
            powerBtn.innerHTML = `<i class="fa-solid fa-power-off"></i> Power: ON`;
            powerBtn.classList.remove("power-off");
            powerBtn.classList.add("power-on");

            startBootSequence();
        } else {
            // Turn OFF: Reset button and show offline screen
            powerBtn.innerHTML = `<i class="fa-solid fa-power-off"></i> Power: OFF`;
            powerBtn.classList.remove("power-on");
            powerBtn.classList.add("power-off");

            bootSequenceActive = false;
            clearInterval(countdownInterval);
            bootScreen.classList.add("hidden");
            screenArea.style.display = "flex";
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
