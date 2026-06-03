const API_URL =

    window.location.hostname === "127.0.0.1"
    ||
    window.location.hostname === "localhost"

        ? "http://127.0.0.1:5000/weather"

        : window.location.origin + "/weather";

async function getWeatherData() {

    const city = document.getElementById('city').value.trim();

    const state = document.getElementById('state').value.trim();

    const country = document.getElementById('country').value.trim();

    const loading = document.getElementById('loading');

    const messageBox = document.getElementById('message-box');

    const results = document.getElementById('results');

    const alertBox = document.getElementById('alert-box');

    const resultStatus = document.getElementById('result-status');

    const resultSummary = document.getElementById('result-summary');

    const statusPill = document.getElementById('status-pill');

    const showMessage = (message, tone) => {

        messageBox.textContent = message;

        messageBox.classList.remove(
            'hidden',
            'is-error',
            'is-success'
        );

        if (tone) {

            messageBox.classList.add(tone);
        }
    };

    const hideMessage = () => {

        messageBox.textContent = '';

        messageBox.classList.add('hidden');

        messageBox.classList.remove(
            'is-error',
            'is-success'
        );
    };

    if (!city || !state || !country) {

        showMessage(
            'Please fill all fields.',
            'is-error'
        );

        return;
    }

    loading.classList.remove('hidden');

    hideMessage();

    results.classList.add('hidden');

    results.classList.remove('is-visible');

    alertBox.classList.add('hidden');

    alertBox.innerHTML = '';

    try {

        const response = await fetch(API_URL, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                city,
                state,
                country
            })
        });

        const data = await response.json();

        loading.classList.add('hidden');

        if (!data.success) {

            showMessage(
                data.message || 'Location not found.',
                'is-error'
            );

            return;
        }

        hideMessage();

        document.getElementById('location').innerText =

            `${data.location.city},
             ${data.location.state},
             ${data.location.country}`;

        document.getElementById('temperature').innerText =

            `${data.weather.temperature} °C`;

        document.getElementById('humidity').innerText =

            `${data.weather.humidity} %`;

        document.getElementById('rainfall').innerText =

            `${data.weather.rainfall} mm`;

        document.getElementById('wind').innerText =

            `${data.weather.wind_speed} km/h`;

        document.getElementById('flood-risk').innerText =

            data.risks.flood_risk;

        document.getElementById('heat-risk').innerText =

            data.risks.heat_risk;

        let alertsHTML = "";

        data.alerts.forEach(alertMessage => {

            alertsHTML += `

                <div class="notification">

                    ${alertMessage}

                </div>

            `;
        });

        alertBox.innerHTML = alertsHTML;

        alertBox.classList.remove('hidden');

        resultStatus.innerText =
            "Climate analysis completed";

        resultSummary.innerText =
            "Live weather and risk analysis generated successfully.";

        statusPill.innerText =
            "Analysis Complete";

        results.classList.remove('hidden');

        requestAnimationFrame(() => {

            results.classList.add('is-visible');
        });

        // Geocode and update chart
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
                const lat = geoData.results[0].latitude;
                const lon = geoData.results[0].longitude;
                document.getElementById('result-status').innerText = `Current Heat Scenario: ${geoData.results[0].name}`;
                await fetchAndRenderChart(lat, lon);
            }
        } catch(e) {
            console.error("Geocoding failed for chart update:", e);
        }

    } catch (error) {

        console.error(error);

        loading.classList.add('hidden');

        showMessage(
            'Backend server is not running.',
            'is-error'
        );
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Typewriter effect
    const typingTextElement = document.getElementById("hero-typing-text");
    if (typingTextElement) {
        const textToType = "Check flood and heat risk for any location in seconds.";
        let i = 0;
        
        typingTextElement.innerHTML = '<span id="typing-content"></span><span class="typewriter-cursor"></span>';
        const contentSpan = document.getElementById("typing-content");

        function typeWriter() {
            if (i < textToType.length) {
                contentSpan.innerHTML += textToType.charAt(i);
                i++;
                setTimeout(typeWriter, 40);
            } else {
                setTimeout(() => {
                    const cursor = document.querySelector('.typewriter-cursor');
                    if(cursor) cursor.style.display = 'none';
                }, 3000);
            }
        }
        
        setTimeout(typeWriter, 400);
    }

    // Image carousel effect
    const carouselImages = document.querySelectorAll(".carousel-img");
    if (carouselImages.length > 0) {
        let currentImageIndex = 0;
        
        setInterval(() => {
            carouselImages[currentImageIndex].classList.remove("active");
            currentImageIndex = (currentImageIndex + 1) % carouselImages.length;
            carouselImages[currentImageIndex].classList.add("active");
        }, 5000);
    }

    // Default India Chart
    fetchAndRenderChart(20.5937, 78.9629);
});

let temperatureChartInstance = null;

async function fetchAndRenderChart(lat, lon) {
    const chartUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    try {
        const res = await fetch(chartUrl);
        const data = await res.json();
        
        // Populate default current weather if the fields are empty
        if (data.current) {
            const tempEl = document.getElementById('temperature');
            if (tempEl && !tempEl.innerText) {
                tempEl.innerText = `${data.current.temperature_2m} °C`;
                document.getElementById('humidity').innerText = `${data.current.relative_humidity_2m} %`;
                document.getElementById('rainfall').innerText = `${data.current.precipitation} mm`;
                document.getElementById('wind').innerText = `${data.current.wind_speed_10m} km/h`;
                document.getElementById('location').innerText = 'Overall India (Default)';
                
                // Mock default risk for India (could calculate it based on above data)
                document.getElementById('flood-risk').innerText = '0.12';
                document.getElementById('heat-risk').innerText = '0.85';
            }
        }

        const dates = data.daily.time.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        });
        const maxTemps = data.daily.temperature_2m_max;
        const minTemps = data.daily.temperature_2m_min;

        const ctx = document.getElementById('temperatureChart');
        if (!ctx) return;

        if (temperatureChartInstance) {
            temperatureChartInstance.destroy();
        }

        Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
        Chart.defaults.font.family = "'Poppins', sans-serif";

        temperatureChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Max Temp (°C)',
                        data: maxTemps,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Min Temp (°C)',
                        data: minTemps,
                        borderColor: '#3b82f6',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        tension: 0.4,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Error fetching chart data:", err);
    }
}