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
    let bootOrder = ["cdrom", "hda", "fda"]; // Default: CD-ROM first, then Hard drive, then Floppy
    let selectedISO = null;
    let selectedFloppy = null;
    let biosTimeout = null;

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
        clearInterval(biosTimeout);

        // Build v86 configuration
        let v86URL = "https://copy.sh/v86/?";
        
        // If ISO is loaded, use custom boot configuration
        if (selectedISO) {
            // Store ISO in sessionStorage for v86 to access
            sessionStorage.setItem("customISO", selectedISO);
            
            // Build v86 with custom settings for ISO boot
            v86URL += "cpu=auto&ram=512&vga=vga";
            
            // Try to boot from CD-ROM first
            v86URL += "&boot_order=d"; // d = CD-ROM/CDROM
            
            // Pass ISO as CDROM via URL encoding (if supported by v86)
            if (selectedISO.length < 50000) { // Only if reasonably sized
                try {
                    const blob = new Blob([selectedISO], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    v86URL += `&cdrom=${encodeURIComponent(url)}`;
                } catch (e) {
                    console.log("ISO too large for URL, using sessionStorage");
                }
            }
        } else if (selectedFloppy) {
            // If floppy is loaded
            sessionStorage.setItem("customFloppy", selectedFloppy);
            v86URL += "cpu=auto&ram=512&vga=vga&boot_order=a"; // a = Floppy
            
            if (selectedFloppy.length < 50000) {
                try {
                    const blob = new Blob([selectedFloppy], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    v86URL += `&fda=${encodeURIComponent(url)}`;
                } catch (e) {
                    console.log("Floppy too large for URL, using sessionStorage");
                }
            }
        } else {
            // Default TinyCore boot
            v86URL = "https://copy.sh/v86/?profile=tinycore";
        }

        screenArea.innerHTML = `<iframe src="${v86URL}"></iframe>`;
    }

    function enterBIOS() {
        bootSequenceActive = false;
        clearInterval(countdownInterval);
        clearInterval(biosTimeout);
        bootScreen.classList.add("hidden");
        screenArea.style.display = "flex";
        
        const isoStatus = selectedISO ? "✓ ISO Loaded" : "No ISO";
        const floppyStatus = selectedFloppy ? "✓ Floppy Loaded" : "No Floppy";
        
        screenArea.innerHTML = `<div class="bios-menu"><div class="bios-content">
            <h1>BIOS Setup Utility</h1>
            <p>MrChromebox Custom BIOS v1.0</p>
            <div class="bios-options">
                <div class="bios-option" data-action="boot-order">Boot Order: ${bootOrder.join(" → ")}</div>
                <div class="bios-option" data-action="iso-upload">Load ISO Image (${isoStatus})</div>
                <div class="bios-option" data-action="floppy-upload">Load Floppy Image (${floppyStatus})</div>
                <div class="bios-option" data-action="boot-now">Exit & Boot</div>
            </div>
            <p class="bios-footer">Press any key to continue boot...</p>
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
            const orders = [
                ["cdrom", "hda", "fda"],
                ["hda", "cdrom", "fda"],
                ["fda", "hda", "cdrom"]
            ];
            const currentIndex = orders.findIndex(order => JSON.stringify(order) === JSON.stringify(bootOrder));
            bootOrder = orders[(currentIndex + 1) % orders.length];
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
                    // Clear floppy if ISO is selected
                    selectedFloppy = null;
                    // Show status update
                    const statusEl = screenArea.querySelector('[data-action="iso-upload"]');
                    const floppyEl = screenArea.querySelector('[data-action="floppy-upload"]');
                    if (statusEl) {
                        statusEl.textContent = "Load ISO Image (✓ ISO Loaded)";
                    }
                    if (floppyEl) {
                        floppyEl.textContent = "Load Floppy Image (No Floppy)";
                    }
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
                    // Clear ISO if floppy is selected
                    selectedISO = null;
                    // Show status update
                    const statusEl = screenArea.querySelector('[data-action="floppy-upload"]');
                    const isoEl = screenArea.querySelector('[data-action="iso-upload"]');
                    if (statusEl) {
                        statusEl.textContent = "Load Floppy Image (✓ Floppy Loaded)";
                    }
                    if (isoEl) {
                        isoEl.textContent = "Load ISO Image (No ISO)";
                    }
                };
                reader.readAsArrayBuffer(file);
            }
        });

        // Auto-boot after 10 seconds in BIOS (only once)
        biosTimeout = setTimeout(() => {
            bootIntoOS();
        }, 10000);
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
            clearInterval(biosTimeout);
            bootScreen.classList.add("hidden");
            screenArea.style.display = "flex";
            screenArea.innerHTML = `<div id="offlineMessage" class="offline-text"><i class="fa-solid fa-triangle-exclamation"></i> [ System Powered Off ]</div>`;
            
            // Clear stored media
            sessionStorage.removeItem("customISO");
            sessionStorage.removeItem("customFloppy");
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
