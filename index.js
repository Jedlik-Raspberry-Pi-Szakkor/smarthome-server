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

const MICROSECDONDS_PER_CM = 1e6/34321;

const trigger = new pigpio(25, {mode: pigpio.OUTPUT});
const echo = new pigpio(24, {mode: pigpio.INPUT, alert: true});

trigger.digitalWrite(0); // Make sure trigger is low

let alarms = [];

function startAlarm(){
    alarms.push(new Date());
    
    c.publish("smarthome/alarms", alarms.map(a=>(a-0)/1000).join(";"), {
        qos: 0,
        retain: true
    });
}

const watchHCSR04 = () => {
  let startTick;

  echo.on('alert', (level, tick) => {
    if (level == 1) {
      startTick = tick;
    } else {
      const endTick = tick;
      const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
      const distance = diff / 2 / MICROSECDONDS_PER_CM;
      if (distance < 15) {
          startAlarm();
      }
    }
  });
};

//watchHCSR04();

// Trigger a distance measurement once per second
/*setInterval(() => {
  trigger.trigger(10, 1); // Set trigger high for 10 microseconds
}, 1000);*/

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
        case "smarthome/alarms":
            alarms = message.toString().split(";").map(a=>new Date(a*1000));
        break;
        case "smarthome/routines":
            const byte = message.readInt8(0);
            doRoutine(byte);
        break;
    }
})

function changeLamp(room, isOn){
    c.publish("smarthome/lamp/" + room, new Buffer([isOn ? 1 : 0]), {
        retain: true,
        qos: 0
    });
}

function changeAlarm(isOn){
    c.publish("smarthome/alarm/on", new Buffer([isOn ? 1 : 0]), {
        retain: true,
        qos: 0
    });
}


function doRoutine(byte){
    switch (byte) {
        case 1:
            changeLamp("Haloszoba", true);
            changeAlarm(false);
            break;
        case 2:
                changeLamp("Haloszoba", false);
                changeLamp("Nappali", false);
                changeLamp("Konyha", false);
                changeLamp("Vendegszoba", false);
                changeAlarm(true);
                break;
        case 3:
            changeLamp("Haloszoba", false);
            changeLamp("Nappali", false);
            changeLamp("Konyha", false);
            changeLamp("Vendegszoba", false);
            changeAlarm(false);
            break;
        case 4:
                changeLamp("Haloszoba", false);
                changeLamp("Nappali", false);
                changeLamp("Konyha", true);
                changeLamp("Vendegszoba", false);
                changeAlarm(false);
                break;
    }
}