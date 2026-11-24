#include <ArduinoJson.h> 
#include <WiFi.h> // Handles the basic TCP/IP connection over Wi-Fi.
#include "SSLClient.h" // Adds SSL/TLS encryption to the WiFiClient connection, enabling secure HTTPS communication.
#include <ArduinoHttpClient.h> //Provides an easy-to-use interface for making HTTP requests over the secure connection.

#define LDR_1 34 // LDR 1 connected to pin 3
#define LDR_2 35 // LDR 2 connected to pin 4
void setup() {
  Serial.begin(9600);
  connectToWiFi();
}

const char* net = "UAM";
const char* pwd = "";

const char hostname[] = "gdfkdcxxigdeffwdksfn.supabase.co";
const char endpoint[] = "/rest/v1/street_light_logs";
int port = 443;

WiFiClient wifi_transport_layer;
SSLClient secure_presentation_layer(&wifi_transport_layer);
HttpClient http_client = HttpClient(secure_presentation_layer, hostname, port);

void loop() {
  int ldr1 = readSensor(LDR_1);
  int ldr2 = readSensor(LDR_2);

  String json = generateJSONReport(ldr1, ldr2);
  pushToSupabase(json);

  delay(3000);
}

void connectToWiFi(){
  WiFi.begin(net, pwd);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
}

uint16_t readSensor(uint8_t pin){
  uint16_t value = analogRead(pin);
  if(isnan(value)){
    Serial.print("WARNING > Pin ");
    Serial.print(pin);
    Serial.println(" returned an invalid value!");
    return 65535; // Error value
  }
  return value;
}

String generateJSONReport(int la, int lb){
  StaticJsonDocument<200> doc;
  doc["pole_a_light"] = la;
  doc["pole_b_light"] = lb;

  String output;
  serializeJson(doc, output);
  return output;
}

void pushToSupabase(String json){
  Serial.println("Making POST request...");

  // Start HTTP request
  http_client.beginRequest();
  http_client.post(endpoint);

  http_client.sendHeader("Content-Type", "application/json");
  http_client.sendHeader("Content-Length", json.length());
  http_client.sendHeader("apikey", "sb_secret_B1kheCV410m91xuP12gktg_lqB1QNT-");
  http_client.sendHeader("Authorization", "sb_secret_B1kheCV410m91xuP12gktg_lqB1QNT-");

  http_client.beginBody();
  http_client.print(json);
  http_client.endRequest();

  // Read response
  int status = http_client.responseStatusCode();
  Serial.print("Status code: ");
  Serial.println(status);

  String res = http_client.responseBody();
  Serial.println("Response: ");
  Serial.println(res);
 
  http_client.stop();
}
