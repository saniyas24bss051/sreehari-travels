const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
require("dotenv").config();

const app = express();

const PORT = 3000;


// ======================================
// MIDDLEWARE
// ======================================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// ======================================
// SESSION / ADMIN LOGIN
// ======================================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);


// ======================================
// PROTECT PRIVATE DATA
// ======================================

app.use("/data", (req, res) => {
    res.status(404).send("Not found");
});


// ======================================
// SERVE WEBSITE FILES
// ======================================

app.use(express.static(__dirname));


// ======================================
// BOOKING FILE
// ======================================

const bookingFile = path.join(
    __dirname,
    "data",
    "bookings.json"
);


// Create data folder/file if missing

const dataFolder = path.join(
    __dirname,
    "data"
);

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

if (!fs.existsSync(bookingFile)) {
    fs.writeFileSync(
        bookingFile,
        "[]",
        "utf8"
    );
}


// ======================================
// READ BOOKINGS
// ======================================

function getBookings() {

    try {

        const data = fs.readFileSync(
            bookingFile,
            "utf8"
        );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "Error reading bookings:",
            error
        );

        return [];

    }

}


// ======================================
// SAVE BOOKINGS
// ======================================

function saveBookings(bookings) {

    fs.writeFileSync(
        bookingFile,
        JSON.stringify(
            bookings,
            null,
            2
        ),
        "utf8"
    );

}
// ======================================
// WHATSAPP NOTIFICATION
// ======================================

async function sendWhatsAppBookingNotification(booking) {
    const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
    const accessToken = process.env.WA_ACCESS_TOKEN;
    const recipient = process.env.WA_RECIPIENT;
    const apiVersion = process.env.WA_API_VERSION || "v23.0";

    if (!phoneNumberId || !accessToken || !recipient) {
        console.error(
            "WhatsApp settings are missing in .env"
        );
        return false;
    }

    const whatsappMessage =
        `🚗 NEW BOOKING - SREEHARI TRAVELS

Booking ID: ${booking.bookingId}

Name: ${booking.name}
Phone: ${booking.phone}

Pickup: ${booking.pickup}
Drop: ${booking.drop}

Date: ${booking.date}
Time: ${booking.time}

Passengers: ${booking.passengers}
Vehicle: ${booking.vehicle}
Trip Type: ${booking.tripType}

Message: ${booking.message || "None"}`;

    try {
        const response = await fetch(
            `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization":
                        `Bearer ${accessToken}`,
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: recipient,
                    type: "text",
                    text: {
                        preview_url: false,
                        body: whatsappMessage
                    }
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error(
                "WhatsApp API error:",
                result
            );

            return false;
        }

        console.log(
            "WhatsApp notification sent successfully."
        );

        console.log(
            "WhatsApp message ID:",
            result.messages?.[0]?.id
        );

        return true;

    } catch (error) {
        console.error(
            "WhatsApp notification failed:",
            error
        );

        return false;
    }
}


// ======================================
// ADMIN LOGIN
// ======================================

app.post(
    "/api/admin/login",
    (req, res) => {

        const password =
            req.body.password;


        if (!password) {

            return res.status(400).json({

                success: false,

                message:
                    "Password is required."

            });

        }


        if (
            password !==
            process.env.ADMIN_PASSWORD
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Incorrect password."

            });

        }


        req.session.isAdmin = true;


        res.json({

            success: true,

            message:
                "Admin login successful."

        });

    }
);


// ======================================
// ADMIN LOGOUT
// ======================================

app.post(
    "/api/admin/logout",
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {

                    return res.status(500).json({

                        success: false,

                        message:
                            "Could not log out."

                    });

                }


                res.json({

                    success: true,

                    message:
                        "Logged out successfully."

                });

            }
        );

    }
);


// ======================================
// CHECK ADMIN LOGIN
// ======================================

function requireAdmin(
    req,
    res,
    next
) {

    if (
        req.session &&
        req.session.isAdmin === true
    ) {

        return next();

    }


    return res.status(401).json({

        success: false,

        message:
            "Admin login required."

    });

}


// ======================================
// CREATE BOOKING
// ======================================

app.post(
    "/api/bookings",
     async (req, res) => {

        const {

            name,
            phone,
            pickup,
            drop,
            date,
            time,
            passengers,
            vehicle,
            tripType,
            message

        } = req.body;


        // ==================================
        // BASIC VALIDATION
        // ==================================

        if (
            !name ||
            !phone ||
            !pickup ||
            !drop ||
            !date ||
            !time ||
            !passengers ||
            !vehicle ||
            !tripType
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please fill all required fields."

            });

        }


        // ==================================
        // VEHICLE VALIDATION
        // ==================================

        const passengerNumber =
            Number(passengers);


        if (
            vehicle === "Ertiga" &&
            passengerNumber > 7
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Ertiga can take a maximum of 7 passengers."
            });
        }

        if (
            vehicle !== "Ertiga" &&
            passengerNumber > 4
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `${vehicle} can take a maximum of 4 passengers.`
            });
        }


        // ==================================
        // GET EXISTING BOOKINGS
        // ==================================

        const bookings =
            getBookings();


        // ==================================
        // CHECK VEHICLE AVAILABILITY
        // ==================================

        const alreadyBooked =
            bookings.some(
                (booking) => {

                    return (

                        booking.date === date &&

                        booking.time === time &&

                        booking.vehicle === vehicle &&

                        booking.status !== "Cancelled"

                    );

                }
            );


        if (alreadyBooked) {

            return res.status(409).json({

                success: false,

                message:
                    `Sorry, the ${vehicle} is already booked for this date and time.`

            });

        }


        // ==================================
        // CREATE BOOKING ID
        // ==================================

        const bookingId =
            "ST" + Date.now();


        // ==================================
        // CREATE BOOKING
        // ==================================

        const newBooking = {

            bookingId,

            name,

            phone,

            pickup,

            drop,

            date,

            time,

            passengers:
                passengerNumber,

            vehicle,

            tripType,

            message:
                message || "",

            status:
                "Pending",

            createdAt:
                new Date().toISOString()

        };


// ======================================
// SAVE BOOKING
// ======================================
bookings.push(
    newBooking
);

saveBookings(
    bookings
);

// ======================================
// SEND WHATSAPP NOTIFICATION
// ======================================

await sendWhatsAppBookingNotification(
    newBooking
);

// ======================================
// SEND RESPONSE
// ======================================
res.json({
    success: true,
    message:
        "Booking request received.",
    bookingId
});

});   // <-- closes /api/bookings


// ======================================
// GET ALL BOOKINGS
// ADMIN ONLY
// ======================================

app.get(
    "/api/admin/bookings",
    requireAdmin,
    (req, res) => {

        const bookings =
            getBookings();

        res.json({

            success: true,

            bookings

        });

    }
);


// ======================================
// UPDATE BOOKING STATUS
// ADMIN ONLY
// ======================================

app.patch(
    "/api/admin/bookings/:bookingId",
    requireAdmin,
    (req, res) => {

        const bookings =
            getBookings();


        const booking =
            bookings.find(
                item =>
                    item.bookingId ===
                    req.params.bookingId
            );


        if (!booking) {

            return res.status(404).json({

                success: false,

                message:
                    "Booking not found."

            });

        }


        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Completed",
            "Cancelled"
        ];


        if (
            !allowedStatuses.includes(
                req.body.status
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid booking status."

            });

        }


        booking.status =
            req.body.status;


        saveBookings(
            bookings
        );


        res.json({

            success: true,

            message:
                "Booking status updated."

        });

    }
);


// ======================================
// START SERVER
// ======================================

app.listen(
    PORT,
    () => {

        console.log(
            `Sreehari Travels running at http://localhost:${PORT}`
        );

    }
);