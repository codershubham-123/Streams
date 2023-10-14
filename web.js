const express = require('express');
const fs = require('fs');

const WebSocket = require('ws');

const app = express();
const port = 8000;

// Middleware
app.use(express.urlencoded({ extended: true }));

// Create a WebSocket server
const io = new WebSocket.Server({ noServer: true });

// Maintain a map of running streams
const streamsData = new Map();

// Function to connect to a WebSocket
function connectToSocket(streamId, ws) {
    const interval = setInterval(() => {
        // Replace this with the logic to collect data for your stream
        const data = Math.random(); // Example data (replace with real data)
        ws.send(JSON.stringify({ streamId, data }));
    }, 100);
    streamsData.set(streamId, interval);
}

io.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log('message', message);
    });
});


// Create a new stream
app.post('/streams', (req, res) => {
    const streamId = Number(req.body); 
    console.log(streamId)
    streamsData.set(streamId, null);
    res.json({ message: 'Stream created', streamId });
});

// Start a stream
app.post('/streams/:streamId/start', (req, res) => {
    const streamId = Number(req.params.streamId); 
    if (!streamsData.has(streamId)) {
        res.status(404).json({ error: 'Not found' });
    } else if (streamsData.get(streamId)) {
        res.json({ message: 'Stream is already running' });
    } else {
        connectToSocket(streamId, io);
        res.json({ message: 'Stream started' });
    }
});

// Stop a stream
app.post('/streams/:streamId/stop', (req, res) => {
    const streamId = Number(req.params.streamId); // Parse to number
    if (!streamsData.has(streamId)) {
        res.status(404).json({ error: 'Not found' });
    } else {
        const stopStream = streamsData.get(streamId);
        if (stopStream) {
            clearInterval(stopStream);
            streamsData.set(streamId, null);
        }
        res.json({ message: 'Stream stopped' });
    }
});

// Destroy a stream
app.delete('/streams/:streamId', (req, res) => {
    const streamId = Number(req.params.streamId); // Parse to number
    if (!streamsData.has(streamId)) {
        res.status(404).json({ error: 'Not found' });
    } else {
        const stopStream = streamsData.get(streamId);
        if (stopStream) {
            clearInterval(stopStream);
        }
        streamsData.delete(streamId);
        res.json({ message: 'Stream destroyed' });
    }
});

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Attach server to WebSocket
server.on('upgrade', (request, socket, head) => {
    io.handleUpgrade(request, socket, head, (ws) => {
        io.emit('connection', ws, request);
    });
});
