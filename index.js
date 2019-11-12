const BROADCAST_PORT = 2718;

const mqtt = require("mqtt")
const dgram = require("dgram")
const onoff = require("onoff")

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

const RADAR_OUT = new onoff.Gpio(25, "out");
const RADAR_IN = new onoff.Gpio(24, "in");

function meassureDistance(){
    console.log("Meassuring")
    RADAR_OUT.writeSync(1)
    setTimeout(() => {
        RADAR_OUT.writeSync(0);
        console.log("Sent sync signal")
    }, 1);
    let startTime;
    const a = (err, val)=>{
        if(val == 1){
            startTime = new Date();
            console.log("Updated time");
        }
        if(val == 0){
            const currentTime = new Date();
            const distance = (currentTime-startTime)/1000*17150;
            console.log(distance);
            RADAR_IN.unwatch(a);
        }
    }
    RADAR_IN.watch(a);

}

RADAR_OUT.writeSync(0);
setInterval(() => {
    meassureDistance()
}, 2000);

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
