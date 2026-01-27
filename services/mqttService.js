const mqtt = require('mqtt');
const nodemailer = require('nodemailer');

let client = null;
let latestMessage = null;
let latestMessagemedia = null;
let latestMessageapp = null;

// Track timeouts and active alerts
const timeouts = {
    'server/info': null,
    'mediaserver/info': null,
    'etaarcis/info': null
};

const alertsSent = {
    'server/info': false,
    'mediaserver/info': false,
    'etaarcis/info': false
};

const storageAlertsSent = {
    'server/info': false,
    'mediaserver/info': false,
    'etaarcis/info': false
};

// Email alert function
const sendAlert = (topic, serverName, issueType, details) => {
    if (issueType === 'DOWN' && alertsSent[topic]) return;
    if (issueType === 'STORAGE' && storageAlertsSent[topic]) return;

    console.log(`ALERT: ${issueType} issue detected on ${serverName}!`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'hitendra@adiance.com',
        cc: 'rahul@adiance.com',
        subject: `🚨 Alert: ${serverName} - ${issueType} Issue`,
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Arcis Server Alert</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: #d9534f;
            color: white;
            text-align: center;
            padding: 15px;
            font-size: 20px;
            font-weight: bold;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 20px;
            font-size: 14px;
            color: #333;
        }
        .content p {
            margin: 10px 0;
        }
        .footer {
            font-size: 12px;
            text-align: center;
            color: #777;
            padding: 15px;
            border-top: 1px solid #ddd;
        }
        .btn {
            display: inline-block;
            background: #007bff;
            color: white;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
        }
        .alert {
            font-weight: bold;
            color: #d9534f;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        🚨 ${issueType} Alert - ${serverName} 🚨
    </div>
    
    <div class="content">
        <p><strong>System Alert Notification</strong></p>
        
        <p><strong>What happened:</strong> <span class="alert">${details}</span></p>
        <p><strong>How severe it is:</strong> <span class="alert">High</span></p>

        <hr>

        <p><strong>What has been done so far:</strong></p>
        <p>We are monitoring the issue. Please check with the network provider or server team for any potential problems.</p>

        <p><strong>What you need to do:</strong></p>
        <ul>
            <li>Ensure the server ${serverName} is powered on and connected to the network.</li>
            <li>Contact IT support for further diagnostics.</li>
            <li>Check with the internet provider for outages.</li>
        </ul>

        <a href="https://etaems.arcisai.io" class="btn">View Dashboard</a>
    </div>

    <div class="footer">
        <p>This is an automated alert email. Please do not reply.</p>
    </div>
</div>

</body>
</html>
`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending alert email:', error);
        } else {
            console.log(`Alert email sent: ${info.response}`);
            if (issueType === 'DOWN') alertsSent[topic] = true;
            if (issueType === 'STORAGE') storageAlertsSent[topic] = true;
        }
    });
};

// Function to reset timeout and track server recovery
// Function to reset timeout and check storage
const resetTimeoutAndCheckStorage = (topic, parsedMessage) => {
    if (timeouts[topic]) {
        clearTimeout(timeouts[topic]);
    }

    if (alertsSent[topic]) {
        // console.log(`INFO: ${topic} is back online. Resetting alert.`);
        alertsSent[topic] = false;
    }

    // Check if storage usage exceeds 80%
    if (parseFloat(parsedMessage.storageUsagePercent) > 80 && !storageAlertsSent[topic]) {
        let serverName = topic === 'server/info' ? 'MQTT Server' :
            topic === 'mediaserver/info' ? 'Media Server' :
                topic === 'etaarcis/info' ? 'ETA ARCIS' : 'Unknown Server';

        // sendAlert(topic, serverName, 'STORAGE', `Storage usage exceeded 80%. Current usage: ${parsedMessage.storageUsagePercent}%`);
    }

    // Set new timeout for 30 seconds
    timeouts[topic] = setTimeout(() => {
        let serverName = topic === 'server/info' ? 'MQTT Server' :
            topic === 'mediaserver/info' ? 'Media Server' :
                topic === 'etaarcis/info' ? 'ETA ARCIS' : 'Unknown Server';

        // sendAlert(topic, serverName, 'DOWN', `${serverName} is Down`);
    }, 300000000);
};



// Function to connect to MQTT broker
function connectToMQTT() {
    const mqttOptions = {
        username: process.env.mqttuser,
        password: process.env.password,
    };

    client = mqtt.connect(process.env.mqtt_broker_url, mqttOptions);

    client.on('connect', () => {
        // console.log('Connected to MQTT broker');

        const topics = ['server/info', 'mediaserver/info', 'etaarcis/info'];
        client.subscribe(topics, (err) => {
            if (err) {
                console.error('Failed to subscribe to topics:', err);
            } else {
                console.log('Subscribed to topics:', topics);
            }
        });
    });

    // MQTT message listener
    client.on('message', (topic, message) => {
        const messageStr = message.toString();

        try {
            const parsedMessage = JSON.parse(messageStr);

            switch (topic) {
                case 'server/info':
                    latestMessage = parsedMessage;
                    break;
                case 'mediaserver/info':
                    latestMessagemedia = parsedMessage;
                    break;
                case 'etaarcis/info':
                    latestMessageapp = parsedMessage;
                    // console.log(latestMessageapp);
                    break;
            }

            // Reset timeout for the topic
            resetTimeoutAndCheckStorage(topic, parsedMessage);

        } catch (error) {
            console.error(`Failed to parse message from topic ${topic}:`, error);
        }
    });

    client.on('error', (err) => {
        console.error('MQTT connection error:', err);
    });
}

// Function to get the latest messages
function getLatestMessage() {
    // console.log("Fetching Latest Messages...");

    return {
        serverInfo: latestMessage || { error: "No data received yet" },
        mediaServerInfo: latestMessagemedia || { error: "No data received yet" },
        etaarcis: latestMessageapp || { error: "No data received yet" },
    };
}

module.exports = {
    connectToMQTT,
    getLatestMessage
};