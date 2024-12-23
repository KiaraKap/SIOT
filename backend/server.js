const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// MQTT Configuration
const mqttClient = mqtt.connect('mqtt://localhost:1883');

// Data storage
let dogState = {
  location: 'unknown',
  lastFeedingTime: null,
  feedingCount: 0,
  lastUpdate: null
};

let historicalData = {
  locations: [],  // Store location changes
  feedings: []    // Store feeding events
};

// Clean old data periodically (keep last 7 days)
function cleanOldData() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  historicalData.locations = historicalData.locations.filter(
    record => new Date(record.timestamp) > sevenDaysAgo
  );
  historicalData.feedings = historicalData.feedings.filter(
    record => new Date(record.timestamp) > sevenDaysAgo
  );
}

// Clean data every 24 hours
setInterval(cleanOldData, 24 * 60 * 60 * 1000);

// MQTT Topic Subscriptions
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('dog/location');
  mqttClient.subscribe('dog/feeding');
});

// Process incoming MQTT messages
mqttClient.on('message', (topic, message) => {
  const timestamp = new Date().toISOString();
  
  try {
    const data = JSON.parse(message.toString());
    
    switch(topic) {
      case 'dog/location':
        // Process proximity sensor data
        if (data.proximity < data.threshold) {
          const newLocation = dogState.location === 'in_crib' ? 'away' : 'in_crib';
          
          // Only record change if location actually changed
          if (newLocation !== dogState.location) {
            dogState.location = newLocation;
            dogState.lastUpdate = timestamp;
            
            historicalData.locations.push({
              timestamp,
              location: newLocation,
              proximityValue: data.proximity
            });
          }
        }
        break;

      case 'dog/feeding':
        // Process light sensor data for feeding detection
        if (data.lightLevel > data.threshold) {
          dogState.feedingCount++;
          dogState.lastFeedingTime = timestamp;
          
          historicalData.feedings.push({
            timestamp,
            lightLevel: data.lightLevel
          });
        }
        break;
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

// API Endpoints
app.get('/api/dog-state', (req, res) => {
  res.json(dogState);
});

app.get('/api/history', (req, res) => {
  // Process historical data into daily summaries
  const dailySummaries = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Filter events for this day
    const dayFeedings = historicalData.feedings.filter(
      record => record.timestamp.startsWith(dateStr)
    );
    
    const dayLocations = historicalData.locations.filter(
      record => record.timestamp.startsWith(dateStr)
    );
    
    dailySummaries.push({
      date: dateStr,
      feedingCount: dayFeedings.length,
      feedingTimes: dayFeedings.map(f => 
        new Date(f.timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      ),
      locationChanges: dayLocations.length
    });
  }
  
  res.json(dailySummaries);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Connected to MQTT broker and listening for sensor data');
  console.log('Available endpoints:');
  console.log('  GET /api/dog-state - Current dog state');
  console.log('  GET /api/history  - Historical data (7-day summary)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  mqttClient.end();
  console.log('MQTT client disconnected');
  process.exit(0);
});