const BROADCAST_PORT = 2718;

const mqtt = require("mqtt")
const dgram = require("dgram")
const onoff = require("onoff")
const pigpio = require("pigpio").Gpio;

//Create server for discovert
const broadcastServer = dgram.createSocket('udp4');
broadcastServer.bind(BROADCAST_PORT, "0.0.0.0") //Bind to all interfaces
//Connecting to MQTT server
const c = mqtt.connect("mqtt://127.0.0.1");

broadcastServer.on('listening', function() {
    var address = broadcastServer.address();
    broadcastServer.setBroadcast(true);
   console.log('UDP Server listening on ' + address.address + ':' + address.port);
});
  
/*broadcastServer.on('message', function(message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);
    if (message[0] == 0 &&
        message[1] == 1 &&
        message[2] == 2 &&
        message[3] == 3){
    broadcastServer.send(new Uint8Array([0, 1, 2, 3]), remote.port, remote.address);
    }
});*/

//Send a broadcast discovery message every 10 seconds
setInterval(()=>{
    broadcastServer.send(new Uint8Array([0, 1, 2, 3]), BROADCAST_PORT, "255.255.255.255");
}, 10*1000);

c.on("connect", ()=>{
    console.log("Connected to MQTT server");
    c.subscribe("#");
})

const NAPPALI = new onoff.Gpio(17, "out");

/**
 * Turns the lamp in Nappali on or off
 * @param {boolean} isOn 
 */
function turnNAPPALI(isOn) {
    console.log("NAPPALI: " + isOn);
    NAPPALI.writeSync(isOn ? 1 : 0);
}

const KONYHA = new onoff.Gpio(27, "out");

/**
 * Turns the lamp in KONYHA on or off
 * @param {boolean} isOn 
 */
function turnKONYHA(isOn) {
    console.log("KONYHA: " + isOn);
    KONYHA.writeSync(isOn ? 1 : 0);
}

const HALOSZOBA = new onoff.Gpio(22, "out");

/**
 * Turns the lamp in HALOSZOBA on or off
 * @param {boolean} isOn 
 */
function turnHALOSZOBA(isOn) {
    console.log("HALOSZOBA: " + isOn);
    HALOSZOBA.writeSync(isOn ? 1 : 0);
}

const VENDEGSZOBA = new onoff.Gpio(23, "out");

/**
 * Turns the lamp in VENDEGSZOBA on or off
 * @param {boolean} isOn 
 */
function turnVENDEGSZOBA(isOn) {
    console.log("VENDEGSZOBA: " + isOn);
    VENDEGSZOBA.writeSync(isOn ? 1 : 0);
}

const trigger = new Gpio(25, {mode: Gpio.OUTPUT});
const echo = new Gpio(24, {mode: Gpio.INPUT, alert: true});

trigger.digitalWrite(0); // Make sure trigger is low

const watchHCSR04 = () => {
  let startTick;

  echo.on('alert', (level, tick) => {
    if (level == 1) {
      startTick = tick;
    } else {
      const endTick = tick;
      const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
      console.log(diff / 2 / MICROSECDONDS_PER_CM);
    }
  });
};

watchHCSR04();

// Trigger a distance measurement once per second
setInterval(() => {
  trigger.trigger(10, 1); // Set trigger high for 10 microseconds
}, 1000);

c.on("message", (topic, message)=>{
    
    switch(topic){
        case "smarthome/lamp/Nappali":
            turnNAPPALI(message.readUInt8(0) != 0);
        break;
        case "smarthome/lamp/Konyha":
            turnKONYHA(message.readUInt8(0) != 0);
        break;
        case "smarthome/lamp/Haloszoba":
            turnHALOSZOBA(message.readUInt8(0) != 0);
        break;
        case "smarthome/lamp/Vendegszoba":
            turnVENDEGSZOBA(message.readUInt8(0) != 0);
        break;
    }
})
