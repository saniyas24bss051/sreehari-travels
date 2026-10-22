// ==============================================================
// SREEHARI TRAVELS - CORE JAVASCRIPT ENGINE
// Vehicles Slideshow + Booking Form + Offline/WhatsApp Fallback
// ==============================================================

// -------------------------------------------------------------
// 1. MOBILE MENU TOGGLE
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const navMenu = document.getElementById("navMenu");

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener("click", function () {
            navMenu.classList.toggle("mobile-open");
        });

        navMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("mobile-open");
            });
        });
    }
});

// -------------------------------------------------------------
// 2. UNIVERSAL SLIDESHOW ENGINE
// -------------------------------------------------------------
let ertigaIndex = 0;
let etiosIndex = 0;
let sedanIndex = 0;
let faceliftIndex = 0;

function showSlideByClass(slideClass, dotClass, targetIndex, currentIndexSetter) {
    const slides = document.querySelectorAll(slideClass);
    const dots = document.querySelectorAll(dotClass);

    if (slides.length === 0) return 0;

    let index = targetIndex;
    if (index >= slides.length) index = 0;
    if (index < 0) index = slides.length - 1;

    slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle("active-dot", i === index);
    });

    if (typeof currentIndexSetter === "function") {
        currentIndexSetter(index);
    }
    return index;
}

// Ertiga
function showErtigaSlide(i) {
    ertigaIndex = showSlideByClass(".ertiga-slide", ".ertiga-dot", i, val => ertigaIndex = val);
}
function changeErtigaSlide(dir) {
    showErtigaSlide(ertigaIndex + dir);
}

// Etios Grey
function showEtiosSlide(i) {
    etiosIndex = showSlideByClass(".etios-slide", ".etios-dot", i, val => etiosIndex = val);
}
function changeEtiosSlide(dir) {
    showEtiosSlide(etiosIndex + dir);
}

// Etios Sedan White
function showSedanSlide(i) {
    sedanIndex = showSlideByClass(".sedan-slide", ".sedan-dot", i, val => sedanIndex = val);
}
function changeSedanSlide(dir) {
    showSedanSlide(sedanIndex + dir);
}

// Etios Sedan Facelift
function showFaceliftSlide(i) {
    faceliftIndex = showSlideByClass(".facelift-slide", ".facelift-dot", i, val => faceliftIndex = val);
}
function changeFaceliftSlide(dir) {
    showFaceliftSlide(faceliftIndex + dir);
}

// Start slideshows if present on page
document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".ertiga-slide")) showErtigaSlide(0);
    if (document.querySelector(".etios-slide")) showEtiosSlide(0);
    if (document.querySelector(".sedan-slide")) showSedanSlide(0);
    if (document.querySelector(".facelift-slide")) showFaceliftSlide(0);

    // Auto-advance sliders gently every 4.5 seconds
    setInterval(function () {
        if (document.querySelector(".ertiga-slide")) changeErtigaSlide(1);
        if (document.querySelector(".etios-slide")) changeEtiosSlide(1);
        if (document.querySelector(".sedan-slide")) changeSedanSlide(1);
        if (document.querySelector(".facelift-slide")) changeFaceliftSlide(1);
    }, 4500);
});

// -------------------------------------------------------------
// 3. BOOKING FORM HANDLER
// -------------------------------------------------------------
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
    // Set minimum date to today
    const dateInput = document.getElementById("date");
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        dateInput.min = `${year}-${month}-${day}`;
        if (!dateInput.value) {
            dateInput.value = `${year}-${month}-${day}`;
        }
    }

    // Pre-select vehicle and pre-fill route/package from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedVehicle = urlParams.get("vehicle");
    const pickupParam = urlParams.get("pickup");
    const dropParam = urlParams.get("drop");
    const tripTypeParam = urlParams.get("tripType");
    const packageParam = urlParams.get("package");

    if (selectedVehicle) {
        // Try exact match or partial match
        const matchingRadio = document.querySelector(`input[name="vehicle"][value="${selectedVehicle}"]`) ||
                              document.querySelector(`input[name="vehicle"][value*="${selectedVehicle}"]`);
        if (matchingRadio) {
            matchingRadio.checked = true;
        }
    }

    if (pickupParam && document.getElementById("pickup")) {
        document.getElementById("pickup").value = pickupParam;
    }

    if (dropParam && document.getElementById("drop")) {
        document.getElementById("drop").value = dropParam;
    }

    if (tripTypeParam) {
        const matchingTrip = document.querySelector(`input[name="tripType"][value="${tripTypeParam}"]`) ||
                             document.querySelector(`input[name="tripType"][value*="${tripTypeParam}"]`);
        if (matchingTrip) {
            matchingTrip.checked = true;
        }
    }

    if (packageParam && document.getElementById("message")) {
        document.getElementById("message").value = `Selected Package: ${packageParam}`;
    }

    // Dynamic passenger limit adjustment based on vehicle chosen
    const vehicleRadios = document.querySelectorAll('input[name="vehicle"]');
    const passengersInput = document.getElementById("passengers");

    function updatePassengerLimit() {
        const checkedVehicle = document.querySelector('input[name="vehicle"]:checked');
        if (!checkedVehicle || !passengersInput) return;

        const val = checkedVehicle.value;
        if (val === "Ertiga") {
            passengersInput.max = 7;
            if (!passengersInput.value) passengersInput.value = 4;
        } else {
            passengersInput.max = 4;
            if (Number(passengersInput.value) > 4) {
                passengersInput.value = 4;
            }
            if (!passengersInput.value) passengersInput.value = 2;
        }
    }

    vehicleRadios.forEach(radio => {
        radio.addEventListener("change", updatePassengerLimit);
    });

    updatePassengerLimit();

    // Booking submission
    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const pickup = document.getElementById("pickup").value.trim();
        const drop = document.getElementById("drop").value.trim();
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;
        const passengerCount = Number(document.getElementById("passengers").value);

        const vehicleElement = document.querySelector('input[name="vehicle"]:checked');
        const tripTypeElement = document.querySelector('input[name="tripType"]:checked');

        if (!name || !phone || !pickup || !drop || !date || !time) {
            alert("Please fill in all required fields.");
            return;
        }

        if (!vehicleElement) {
            alert("Please select a vehicle.");
            return;
        }

        if (!tripTypeElement) {
            alert("Please select your trip type.");
            return;
        }

        const vehicle = vehicleElement.value;
        const tripType = tripTypeElement.value;

        // Passenger capacity limits validation
        if (vehicle === "Ertiga" && passengerCount > 7) {
            alert("Maruti Suzuki Ertiga can accommodate a maximum of 7 passengers.");
            return;
        }

        if (vehicle !== "Ertiga" && passengerCount > 4) {
            alert("Toyota Etios sedans can accommodate a maximum of 4 passengers.");
            return;
        }

        const message = document.getElementById("message") ? document.getElementById("message").value.trim() : "";
        const bookingId = "ST" + Date.now();

        const bookingData = {
            bookingId: bookingId,
            name: name,
            phone: phone,
            pickup: pickup,
            drop: drop,
            date: date,
            time: time,
            passengers: passengerCount,
            vehicle: vehicle,
            tripType: tripType,
            message: message,
            status: "Pending",
            createdAt: new Date().toISOString()
        };

        // Helper to format WhatsApp message text
        function generateWhatsAppMessage() {
            return `*RESERVATION REQUEST — SREEHARI TRAVELS OOTY*\n\n` +
                   `• Reference ID: ${bookingId}\n` +
                   `• Lead Passenger: ${name}\n` +
                   `• Contact: ${phone}\n` +
                   `• Route: ${pickup} → ${drop}\n` +
                   `• Schedule: ${date} at ${time}\n` +
                   `• Fleet Selection: ${vehicle}\n` +
                   `• Passenger Count: ${passengerCount}\n` +
                   `• Journey Type: ${tripType}\n` +
                   `• Special Requests: ${message || "None"}\n\n` +
                   `Submitted via Sreehari Travels Ooty Concierge Portal`;
        }

        // Save locally to localStorage so records are preserved even in file:/// mode
        try {
            const localKey = "sreehari_travels_bookings";
            const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
            existing.unshift(bookingData);
            localStorage.setItem(localKey, JSON.stringify(existing));
        } catch (e) {
            console.warn("Local storage write error:", e);
        }

        // If opened via file:/// protocol, redirect directly to WhatsApp
        if (window.location.protocol === "file:") {
            const waUrl = `https://wa.me/919585990734?text=${encodeURIComponent(generateWhatsAppMessage())}`;
            const proceed = confirm(
                `Reservation Details Recorded\n\n` +
                `Reference: ${bookingId}\n` +
                `Passenger: ${name}\n` +
                `Vehicle: ${vehicle}\n` +
                `Schedule: ${date} at ${time}\n\n` +
                `Click OK to transmit your reservation directly to Sreehari Travels Ooty Concierge via WhatsApp (+91 9585990734) for immediate confirmation.`
            );
            if (proceed) {
                window.open(waUrl, "_blank");
            }
            bookingForm.reset();
            return;
        }

        // If served over HTTP/HTTPS, attempt Node server API call with graceful WhatsApp fallback
        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bookingData)
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.message || "Booking request could not be processed.");
                return;
            }

            const waUrl = `https://wa.me/919585990734?text=${encodeURIComponent(generateWhatsAppMessage())}`;
            const sendWa = confirm(
                `Reservation Request Submitted Successfully\n\n` +
                `Reference: ${result.bookingId || bookingId}\n\n` +
                `Would you like to transmit these details to our concierge on WhatsApp (+91 9585990734) for immediate dispatch confirmation?`
            );

            if (sendWa) {
                window.open(waUrl, "_blank");
            }

            bookingForm.reset();

        } catch (error) {
            console.warn("Backend server not responding, falling back to direct WhatsApp:", error);
            const waUrl = `https://wa.me/919585990734?text=${encodeURIComponent(generateWhatsAppMessage())}`;
            const proceed = confirm(
                `Reservation Request Recorded\n\n` +
                `Reference: ${bookingId}\n\n` +
                `Click OK to transmit your travel details directly to Sreehari Travels Ooty Concierge via WhatsApp (+91 9585990734).`
            );
            if (proceed) {
                window.open(waUrl, "_blank");
            }
            bookingForm.reset();
        }
    });
}