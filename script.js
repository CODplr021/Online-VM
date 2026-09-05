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
    let bootOrder = ["hda", "cdrom", "fda"]; // Default: Hard drive, CD-ROM, Floppy
    let selectedISO = null;
    let selectedFloppy = null;

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

        // Build v86 parameters based on boot order and selected media
        let v86Params = "profile=tinycore";
        
        if (selectedISO) {
            v86Params += `&cdrom=${encodeURIComponent(selectedISO)}`;
        }
        if (selectedFloppy) {
            v86Params += `&fda=${encodeURIComponent(selectedFloppy)}`;
        }

        // Set boot order in v86
        v86Params += `&boot_order=${bootOrder.join(",")}`;

        screenArea.innerHTML = `<iframe src="https://copy.sh/v86/?${v86Params}"></iframe>`;
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
                <div class="bios-option" data-action="boot-order">Boot Order: ${bootOrder.join(" → ")}</div>
                <div class="bios-option" data-action="iso-upload">Load ISO Image</div>
                <div class="bios-option" data-action="floppy-upload">Load Floppy Image</div>
                <div class="bios-option" data-action="boot-now">Exit & Boot</div>
            </div>
            <p class="bios-footer">Click options or press any key to continue boot...</p>
            <input type="file" id="isoUpload" accept=".iso" style="display:none;">
            <input type="file" id="floppyUpload" accept=".img,.vfd,.ima,.flp" style="display:none;">
        </div></div>`;

        // Add event listeners for BIOS options
        const bootOrderOption = screenArea.querySelector('[data-action="boot-order"]');
        const isoOption = screenArea.querySelector('[data-action="iso-upload"]');
        const floppyOption = screenArea.querySelector('[data-action="floppy-upload"]');
        const bootOption = screenArea.querySelector('[data-action="boot-now"]');
        const isoUpload = screenArea.querySelector('#isoUpload');
        const floppyUpload = screenArea.querySelector('#floppyUpload');

        bootOrderOption.addEventListener("click", function() {
            // Cycle boot order
            bootOrder = ["cdrom", "fda", "hda"];
            enterBIOS(); // Refresh to show new boot order
        });

        isoOption.addEventListener("click", function() {
            isoUpload.click();
        });

        floppyOption.addEventListener("click", function() {
            floppyUpload.click();
        });

        bootOption.addEventListener("click", function() {
            bootIntoOS();
        });

        isoUpload.addEventListener("change", function(e) {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedISO = event.target.result;
                    enterBIOS(); // Refresh menu
                };
                reader.readAsArrayBuffer(file);
            }
        });

        floppyUpload.addEventListener("change", function(e) {
            if (e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = function(event) {
                    selectedFloppy = event.target.result;
                    enterBIOS(); // Refresh menu
                };
                reader.readAsArrayBuffer(file);
            }
        });

        // Auto-boot after 8 seconds in BIOS
        setTimeout(() => {
            if (bootSequenceActive === false) {
                bootIntoOS();
            }
        }, 8000);
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
