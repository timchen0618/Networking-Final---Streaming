var PeerManager = (function () {

  var localId,
      remoteid = "",
      config = {
        peerConnectionConfig: {
          iceServers: [
            {"url": "stun:23.21.150.121"},
            {"url": "stun:stun.l.google.com:19302"}
          ]
        },
        peerConnectionConstraints: {
          optional: [
            {"DtlsSrtpKeyAgreement": true}
          ]
        }
      },
      peerDatabase = {},
      localStream,
      remoteVideoContainer = document.getElementById('remoteVideosContainer'),
      chat_test = document.getElementById('chat'),
      socket = io();
      
  socket.on('message', handleMessage);
  socket.on('id', function(id) {
    localId = id;
  });
  socket.on('chat', function(options){
    if(remoteid === options.server || localId  === options.server){
      if(remoteid === options.server){
        var p = document.createElement('p'); 
        p.innerHTML = options.userid + ': ' + options.text;
        p.classList.add('messages');
        chats = document.getElementById('chatbox');
        chatbox.appendChild(p);
        chats.scrollTop = chats.scrollHeight - 320;
      }    
      else{
        var p2 = document.createElement('p'); 
        p2.innerHTML = options.userid + ': ' + options.text;
        p2.classList.add('messages');
        chats2 = document.getElementById('server_chat');
        server_chat.appendChild(p2);
        chats2.scrollTop = chats2.scrollHeight - 380;
      }
      
      
      
      
      
      
    }
    
  })
  function addPeer(remoteId) {
    var peer = new Peer(config.peerConnectionConfig, config.peerConnectionConstraints);
    peer.pc.onicecandidate = function(event) {
      if (event.candidate) {
        send('candidate', remoteId, {
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      }
    };
    peer.pc.onaddstream = function(event) {
      attachMediaStream(peer.remoteVideoEl, event.stream);
      remoteVideosContainer.appendChild(peer.remoteVideoEl);
      chat.style['display'] = "inline-block";
      // var chat_wrap = document.createElement("DIV");
      // chat_wrap.setAttribute('id','cin');
      // var chat_input = document.createElement("INPUT");
      // chat_input.setAttribute('placeholder','輸入訊息');
      // chat_input_an = angular.element(chat_input);
      // chat_input_an.attr('ng-model','rtc.input');
      // var chat_submit = document.createElement("INPUT");
      // chat_submit.setAttribute('type','submit');
      // chat_submit_an = angular.element(chat_submit);
      // chat_submit_an.attr('ng-click','rtc.send_text()');
      // chat_wrap.appendChild(chat_input);
      // chat_wrap.appendChild(chat_submit);
			// chat.appendChild(chat_wrap);
    };
    peer.pc.onremovestream = function(event) {
      peer.remoteVideoEl.src = '';
      remoteVideosContainer.removeChild(peer.remoteVideoEl);
      chat.style['display'] = "none";
      var wrap = document.getElementById('chat_reload');
      //var content = document.getElementById('chatbox')
      chat_reload.removeChild(document.getElementById('chatbox'));
      var content = document.createElement("DIV");
      content.classList.add("chat_show");
      content.setAttribute('id', "chatbox");
      chat_reload.appendChild(content);


    };
    peer.pc.oniceconnectionstatechange = function(event) {
      switch(
      (  event.srcElement // Chrome
      || event.target   ) // Firefox
      .iceConnectionState) {
        case 'disconnected':
          remoteVideosContainer.removeChild(peer.remoteVideoEl);
          break;
      }
    };
    peerDatabase[remoteId] = peer;
        
    return peer;
  }
  function answer(remoteId) {
    var pc = peerDatabase[remoteId].pc;
    pc.createAnswer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('answer', remoteId, sessionDescription);
      }, 
      error
    );
  }
  function offer(remoteId) {
    var pc = peerDatabase[remoteId].pc;
    pc.createOffer(
      function(sessionDescription) {
        pc.setLocalDescription(sessionDescription);
        send('offer', remoteId, sessionDescription);
      }, 
      error
    );
  }
  function handleMessage(message) {
    var type = message.type,
        from = message.from,
        pc = (peerDatabase[from] || addPeer(from)).pc;

    console.log('received ' + type + ' from ' + from);
  
    switch (type) {
      case 'init':
        toggleLocalStream(pc);
        offer(from);
        break;
      case 'offer':
        pc.setRemoteDescription(new RTCSessionDescription(message.payload), function(){}, error);
        answer(from);
        break;
      case 'answer':
        pc.setRemoteDescription(new RTCSessionDescription(message.payload), function(){}, error);
        break;
      case 'candidate':
        if(pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate({
            sdpMLineIndex: message.payload.label,
            sdpMid: message.payload.id,
            candidate: message.payload.candidate
          }), function(){}, error);
        }
        break;
    }
  }
  function send(type, to, payload) {
    console.log('sending ' + type + ' to ' + to);

    socket.emit('message', {
      to: to,
      type: type,
      payload: payload
    });
  }
  function toggleLocalStream(pc) {
    if(localStream) {
      (!!pc.getLocalStreams().length) ? pc.removeStream(localStream) : pc.addStream(localStream);
    }
  }
  function error(err){
    console.log(err);
  }

  return {
    getId: function() {
      return localId;
    },
    getRemoteId: function() {
      return remoteid;
    },
    setLocalStream: function(stream) {

      // if local cam has been stopped, remove it from all outgoing streams.
      if(!stream) {
        for(id in peerDatabase) {
          pc = peerDatabase[id].pc;
          if(!!pc.getLocalStreams().length) {
            pc.removeStream(localStream);
            offer(id);
          }
        }
      }

      localStream = stream;
    }, 

    toggleLocalStream: function(remoteId) {
      peer = peerDatabase[remoteId] || addPeer(remoteId);
      toggleLocalStream(peer.pc);
    },
    
    peerInit: function(remoteId) {
      peer = peerDatabase[remoteId] || addPeer(remoteId);
      send('init', remoteId, null);
      remoteid = remoteId
    },

    peerRenegociate: function(remoteId) {
      offer(remoteId);
    },

    send: function(type, payload) {
      socket.emit(type, payload);
    }
  };
  
});

var Peer = function (pcConfig, pcConstraints) {
  this.pc = new RTCPeerConnection(pcConfig, pcConstraints);
  this.remoteVideoEl = document.createElement('video');
  this.remoteVideoEl.classList.add("video_watch");
  // this.remoteVideoEl.width = "600";
  // this.remoteVideoEl.height = "400";
  this.remoteVideoEl.controls = true;
  this.remoteVideoEl.autoplay = true;
}