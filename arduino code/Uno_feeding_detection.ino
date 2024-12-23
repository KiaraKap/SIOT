
//RUNS ON ARDUINO UNO

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Rrjeti shpise";
const char* password = "Nala2021";

// MQTT settings
const char* mqtt_server = "213.207.43.21";
const int mqtt_port = 1883;
const char* mqtt_topic = "dog/feeding";

// Pin definitions
const int LIGHT_SENSOR_PIN = A0;
const int LED_PIN = 13;

// Light threshold settings
const int LIGHT_THRESHOLD = 500;   
const unsigned long DEBOUNCE_DELAY = 3000; 

// Global variables
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPublishTime = 0;
int lastLightLevel = 0;

void setup_wifi() {
  delay(10);
  Serial.println("Connecting to WiFi...");
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "UNOClient-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(9600);
  pinMode(LED_PIN, OUTPUT);
  pinMode(LIGHT_SENSOR_PIN, INPUT);
  
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void publishLightData() {
  int lightLevel = analogRead(LIGHT_SENSOR_PIN);
  
  // Only publish if there's a significant change
  if (abs(lightLevel - lastLightLevel) > 50) {
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["lightLevel"] = lightLevel;
    doc["threshold"] = LIGHT_THRESHOLD;
    doc["timestamp"] = millis();

    // Serialize JSON to string
    String jsonString;
    serializeJson(doc, jsonString);

    // Publish to MQTT
    client.publish(mqtt_topic, jsonString.c_str());
    
    // Visual feedback
    digitalWrite(LED_PIN, lightLevel > LIGHT_THRESHOLD);
    
    Serial.print("Published light level: ");
    Serial.println(lightLevel);
    
    lastLightLevel = lightLevel;
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Publish data with debounce
  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= DEBOUNCE_DELAY) {
    publishLightData();
    lastPublishTime = currentTime;
  }
}