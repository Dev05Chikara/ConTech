document.addEventListener("DOMContentLoaded", function () {
    // --- Flash Messages ---
    function removeFlashMessages() {
        setTimeout(() => {
            document.querySelectorAll(".flash-message").forEach((msg) => {
                msg.style.opacity = "0";
                setTimeout(() => msg.remove(), 500);
            });
        }, 3000);
    }
    window.closeFlashMessage = function (el) {
        el.parentElement.style.opacity = "0";
        setTimeout(() => el.parentElement.remove(), 500);
    };
    removeFlashMessages();

    // --- Chart Setup ---
    const timeLabels = [];
    const tempData = [];
    const mixtempData = [];
    const humidityData = [];
    const soilmoistureData = [];
    const soilstatusData = [];
    const maxPoints = 10;

    const charts = {};

    function createGraph(canvasId, label, data, borderColor) {
        const ctx = document.getElementById(canvasId)?.getContext("2d");
        if (!ctx) return;

        charts[canvasId] = new Chart(ctx, {
            type: "line",
            data: {
                labels: timeLabels,
                datasets: [{
                    label,
                    data,
                    borderColor,
                    backgroundColor: borderColor.replace(")", ", 0.2)").replace("rgb", "rgba"),
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { title: { display: true, text: "Time" } },
                    y: { title: { display: true, text: label } }
                }
            }
        });
    }

    function updateGraph(canvasId, data) {
        if (charts[canvasId]) {
            charts[canvasId].data.labels = timeLabels;
            charts[canvasId].data.datasets[0].data = data;
            charts[canvasId].update();
        }
    }

    // --- Graph Visibility Toggle ---
    const graphs = ["tempGraph", "mixtempGraph", "humidityGraph", "soilmoistureGraph"];
    let currentGraphIndex = 0;

    function updateGraphVisibility() {
        graphs.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.toggle("hidden", i !== currentGraphIndex);
                if (i === currentGraphIndex && charts[id]) {
                    charts[id].resize();
                }
            }
        });
    }

    document.getElementById("nextGraph")?.addEventListener("click", () => {
        currentGraphIndex = (currentGraphIndex + 1) % graphs.length;
        updateGraphVisibility();
    });

    document.getElementById("prevGraph")?.addEventListener("click", () => {
        currentGraphIndex = (currentGraphIndex - 1 + graphs.length) % graphs.length;
        updateGraphVisibility();
    });

    // --- Init Graphs with Empty Data ---
    createGraph("tempGraph", "Environment Temp (°C)", tempData, "rgb(15, 3, 236)");
    createGraph("mixtempGraph", "Mixture Temp (°C)", mixtempData, "rgb(15, 3, 236)");
    createGraph("humidityGraph", "Humidity (%)", humidityData, "rgb(15, 3, 236)");
    createGraph("soilmoistureGraph", "Soil Moisture", soilmoistureData, "rgb(0, 0, 255)");

    updateGraphVisibility();

    // --- Update Live Readings UI ---
    window.updateLiveSensorReadings = function (data) {
        if (!data || typeof data !== 'object') {
            console.error("Invalid data received from Firebase");
            return;
        }

        const setText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val ?? "--";
        };

        setText("env-temp", data.env_temp);
        setText("mix-temp", data.mix_temp);
        setText("humidity", data.humidity);
        setText("soilstatus", data.soil_status);  // Fixed property name
        setText("soilmoisture", data.soil_moisture);  // Fixed property name

        const currentTime = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });

        // Manage data arrays
        [timeLabels, tempData, mixtempData, humidityData, soilmoistureData, soilstatusData].forEach(arr => {
            if (arr.length >= maxPoints) arr.shift();
        });

        // Push new data
        tempData.push(data.env_temp);
        mixtempData.push(data.mix_temp);
        humidityData.push(data.humidity);
        soilmoistureData.push(data.soil_moisture);  // Fixed property name
        timeLabels.push(currentTime);

        // Convert soil status to numeric value
        const numericMoisture = data.soil_status === "Dry" ? 0 : 1;
        soilstatusData.push(numericMoisture);

        // Update all charts
        updateGraph("tempGraph", tempData);
        updateGraph("mixtempGraph", mixtempData);
        updateGraph("humidityGraph", humidityData);
        updateGraph("soilmoistureGraph", soilmoistureData);
    };

    // --- Export to CSV ---
    document.getElementById("exportCSV")?.addEventListener("click", () => {
        const rows = [["Time", "Environment Temp", "Mix temp", "Humidity", "Soil Status", "Soil Moisture"]];
        
        for (let i = 0; i < timeLabels.length; i++) {
            rows.push([
                timeLabels[i],
                tempData[i] ?? "",
                mixtempData[i] ?? "",
                humidityData[i] ?? "",
                soilstatusData[i] === 1 ? "Wet" : "Dry",
                soilmoistureData[i] ?? ""
            ]);
        }

        const csvContent = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "sensor_data.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Card Interaction Setup ---
    function setupCardInteraction(cardSelector) {
        const cards = document.querySelectorAll(cardSelector);

        cards.forEach((card) => {
            card.addEventListener("click", (e) => {
                e.stopPropagation();
                const isActive = card.classList.contains("card-active");

                cards.forEach((c) => {
                    c.classList.remove("card-active", "card-dull");
                });

                if (!isActive) {
                    card.classList.add("card-active");
                    cards.forEach((c) => {
                        if (c !== card) {
                            c.classList.add("card-dull");
                        }
                    });
                }
            });
        });

        document.addEventListener("click", () => {
            cards.forEach((c) => {
                c.classList.remove("card-active", "card-dull");
            });
        });
    }

    setupCardInteraction(".sensor-feature-card");
    setupCardInteraction(".benefit-card");

    // --- Toggle Details Function ---
    function toggleDetails(button) {
        const sensorSection = button.closest(".sensor");
        const extraInfo = sensorSection.querySelector(".extra-details");

        if (extraInfo) {
            const isExpanded = extraInfo.classList.contains("show");
            extraInfo.classList.toggle("show");
            button.textContent = isExpanded ? "+ More details" : "- Less details";
        }
    }
    window.toggleDetails = toggleDetails;

    // --- Navigation Handler ---
    document.getElementById('tosensor')?.addEventListener('click', () => {
        window.location.href = '/about#sensor-deploy';
    });
});