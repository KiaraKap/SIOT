//RUNS ON ARDUINO NANO 33 BLE SENSE

#include <Arduino_APDS9960.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "Rrjeti shtepise";
const char* password = "Nala2021";

// MQTT settings
const char* mqtt_server = "213.207.43.21";  // IP address of your computer running the MQTT broker
const int mqtt_port = 1883;
const char* mqtt_topic = "dog/location";

// Sensor settings
const int PROXIMITY_THRESHOLD = 150;  // Adjust based on your setup
const unsigned long DEBOUNCE_DELAY = 3000;  // 3 seconds between readings

// Global variables
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPublishTime = 0;

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
    String clientId = "NanoClient-";
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
  
  // Initialize APDS9960 sensor
  if (!APDS.begin()) {
    Serial.println("Error initializing APDS9960 sensor!");
    while (1);
  }

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
}

void publishProximityData() {
  if (!APDS.proximityAvailable()) {
    return;
  }

  int proximity = APDS.readProximity();
  
  // Create JSON document
  StaticJsonDocument<200> doc;
  doc["proximity"] = proximity;
  doc["threshold"] = PROXIMITY_THRESHOLD;
  doc["timestamp"] = millis();

  // Serialize JSON to string
  String jsonString;
  serializeJson(doc, jsonString);

  // Publish to MQTT
  client.publish(mqtt_topic, jsonString.c_str());
  
  // Visual feedback
  digitalWrite(LED_BUILTIN, proximity < PROXIMITY_THRESHOLD);
  
  Serial.print("Published proximity: ");
  Serial.println(proximity);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Publish data with debounce
  unsigned long currentTime = millis();
  if (currentTime - lastPublishTime >= DEBOUNCE_DELAY) {
    publishProximityData();
    lastPublishTime = currentTime;
  }
}