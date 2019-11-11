const BROADCAST_PORT = 2718;

const mqtt = require("mqtt")
const dgram = require("dgram")
const broadcastServer = dgram.createSocket('udp4');
const c = mqtt.connect("mqtt://127.0.0.1");
broadcastServer.bind(BROADCAST_PORT, "0.0.0.0")

broadcastServer.on('listening', function() {
    var address = broadcastServer.address();
   console.log('UDP Server listening on ' + address.address + ':' + address.port);
});
  
broadcastServer.on('message', function(message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);
    if (message[0] == 0 &&
        message[1] == 1 &&
        message[2] == 2 &&
        message[3] == 3){
    broadcastServer.send(new Uint8Array([0, 1, 2, 3]), remote.port, remote.address);
    }
});

c.on("connect", ()=>{
    console.log("Connected to MQTT server");
    c.subscribe("#");
})

c.on("message", (topic, message)=>{
    switch(topic){
        case "smarthome/lamp/Nappali":
            
        break;
        case "smarthome/lamp/Konyha":
            
        break;
        case "smarthome/lamp/Haloszoba":

        break;
        case "smarthome/lamp/Vendegszoba":

        break;
    }
})
