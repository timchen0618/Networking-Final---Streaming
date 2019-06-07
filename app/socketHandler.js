module.exports = function(io, streams) {

  io.on('connection', function(client) {
    console.log('-- ' + client.id + ' joined --');
    client.emit('id', client.id);

    client.on('message', function (details) {
      var otherClient = io.sockets.connected[details.to];

      if (!otherClient) {
        return;
      }
        delete details.to;
        details.from = client.id;
        otherClient.emit('message', details);
    });
      
    client.on('readyToStream', function(options) {
      console.log('-- ' + client.id + ' is ready to stream --');
      
      streams.addStream(client.id, options.name); 
    });
    client.on('chat', function(options){
      console.log(option.text);
    })
    
    client.on('update', function(options) {
      streams.update(client.id, options.name);
    });
    client.on('sendchat', function(options){
      console.log(options.text);
      io.emit('chat', {
        origin:'SERVER', 
        text: options.text,
        userid: options.id
        });
      console.log(options.id);
      // var p = document.createElement('p'); 
      // p.innerHTML = client.id + ': ' + options.text;
      // chats = document.getElementById('chatbox');
      // chatbox.appendChild(p); 
    });
    function leave() {
      console.log('-- ' + client.id + ' left --');
      streams.removeStream(client.id);
    }

    client.on('disconnect', leave);
    client.on('leave', leave);
  });
};