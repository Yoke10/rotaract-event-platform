const functions = require("firebase-functions");
const admin = require("firebase-admin");
const PaytmChecksum = require("paytm-checksum");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const cors = require('cors')({ origin: true });

admin.initializeApp();
const db = admin.firestore();

// --- PAYTM CONFIGURATION (Set these via firebase functions:config:set paytm.mid="..." etc) ---
// For dev, we might use hardcoded test creds or env vars. 
// Ideally: functions.config().paytm.mid
const PAYTM_MID = process.env.PAYTM_MID || "YOUR_TEST_MID";
const PAYTM_KEY = process.env.PAYTM_KEY || "YOUR_TEST_KEY";
const WEBSITE = "WEBSTAGING"; // or DEFAULT for prod

// 1. Generate Transaction Token
exports.generatePaytmToken = functions.https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { orderId, amount, customerId } = data;

    var paytmParams = {};

    paytmParams.body = {
        "requestType": "Payment",
        "mid": PAYTM_MID,
        "websiteName": WEBSITE,
        "orderId": orderId,
        "callbackUrl": `https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`, // Adjust for prod
        "txnAmount": {
            "value": amount.toString(),
            "currency": "INR",
        },
        "userInfo": {
            "custId": customerId,
        },
    };

    try {
        const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PAYTM_KEY);
        paytmParams.head = {
            "signature": checksum
        };

        const post_data = JSON.stringify(paytmParams);

        // Call Paytm API to get token
        // In a real implementation, you would use axios or fetch to call Paytm endpoint
        // https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}

        // For MOCK purposes (since we don't have real Keys), we return a mock token
        // UNLESS provided with real keys.

        // Returning a dummy token for frontend to simulate 'success' if needed, 
        // or actually making the call.

        return { txnToken: "MOCK_TOKEN_" + orderId, orderId, mid: PAYTM_MID };

    } catch (error) {
        console.error("Checksum Error", error);
        throw new functions.https.HttpsError('internal', 'Checksum generation failed');
    }
});

// 2. Verify Payment (Webhook or specific endpoint called after success)
exports.verifyPayment = functions.https.onCall(async (data, context) => {
    // Verify checksum and status with Paytm
    // Update Booking status in Firestore
    const { orderId, paymentId } = data;

    try {
        // ... Verification logic using PaytmChecksum.verifySignature ...

        // Assume success for now
        const bookingRef = db.collection('bookings').doc(orderId);
        await bookingRef.update({
            paymentStatus: 'PAID',
            paymentId: paymentId || 'PAYTM_' + Date.now(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        throw new functions.https.HttpsError('internal', 'Verification failed');
    }
});


// 3. On Booking Creation/Update -> Generate Tickets & Email
exports.onBookingPaid = functions.firestore.document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();

        // Only run if status changed to PAID
        if (newData.paymentStatus === 'PAID' && previousData.paymentStatus !== 'PAID') {
            const bookingId = context.params.bookingId;
            const { eventId, userId, numberOfTickets, email, name, club } = newData;

            // 1. Fetch Event Details
            const eventDoc = await db.collection('events').doc(eventId).get();
            const eventData = eventDoc.data();

            const tickets = [];
            const ticketPromises = [];

            // 2. Generate Tickets
            for (let i = 0; i < numberOfTickets; i++) {
                const ticketId = `${bookingId}_${i + 1}`;
                const qrData = JSON.stringify({
                    tId: ticketId,
                    eId: eventId,
                    uid: userId
                });

                // Generate QR Code Image (Data URL)
                const qrCodeDataURL = await QRCode.toDataURL(qrData);

                const ticket = {
                    ticketId,
                    bookingId,
                    eventId,
                    eventName: eventData.name,
                    eventDate: eventData.date,
                    eventTime: eventData.time,
                    eventLocation: eventData.location,
                    userName: name,
                    userEmail: email,
                    userClub: club,
                    qrCode: qrCodeDataURL, // Storing base64 for now, ideally upload to Storage
                    status: 'valid',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                };

                ticketPromises.push(db.collection('tickets').doc(ticketId).set(ticket));
                tickets.push(ticket);
            }

            await Promise.all(ticketPromises);

            // 3. Update Event Ticket Count
            await db.collection('events').doc(eventId).update({
                ticketsSold: admin.firestore.FieldValue.increment(numberOfTickets)
            });

            // 4. Send Email
            await sendTicketEmail(email, name, eventData, tickets);
        }
    });

async function sendTicketEmail(email, name, event, tickets) {
    // Configure Transporter (SendGrid or Gmail)
    // functions.config().email.user / pass
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or 'SendGrid'
        auth: {
            user: "your-email@gmail.com",
            pass: "your-app-password"
        }
    });

    const mailOptions = {
        from: 'Rotaract Events <noreply@rotaract.com>',
        to: email,
        subject: `Your Tickets for ${event.name}`,
        html: `
            <h1>Hi ${name},</h1>
            <p>Thank you for booking tickets for <strong>${event.name}</strong>.</p>
            <p>Find your tickets attached or view them in the app.</p>
            <br/>
            <h3>Event Details:</h3>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Location:</strong> ${event.location}</p>
        `,
        // Attachments can be added here if we generated PDF
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
