import React, { useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Phone, PhoneOff, MessageSquare } from 'lucide-react';
import './App.css'
const VoiceAgentChat = () => {
  const [agentId, setAgentId] = useState('');
  const [showSettings, setShowSettings] = useState(true);
  const [messages, setMessages] = useState([]);

  const conversation = useConversation({
    onConnect: ({ conversationId }) => {
      console.log('Connected:', conversationId);
      addMessage('system', 'Connected to voice agent');
    },
    onDisconnect: () => {
      console.log('Disconnected');
      addMessage('system', 'Disconnected from voice agent');
      setShowSettings(true);
    },
    onMessage: ({ message, source }) => {
      console.log('Message:', message, 'from', source);
      addMessage(source, message);
    },
    onError: (error) => {
      console.error('Error:', error);
      addMessage('system', `Error: ${error}`);
    },
    onStatusChange: ({ status }) => {
      console.log('Status changed to:', status);
    },
    onModeChange: ({ mode }) => {
      console.log('Mode changed to:', mode);
    }
  });

  useEffect(() => {
    if (messages.length > 0) {
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleStartCall = async () => {

    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Edge.');
        return;
      }

      // Request microphone permission with better error handling
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
        
        addMessage('system', 'Microphone access granted');
      } catch (micError) {
        console.error('Microphone error:', micError);
        
        if (micError.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else if (micError.name === 'NotAllowedError' || micError.name === 'PermissionDeniedError') {
          alert('Microphone access denied. Please allow microphone access in your browser settings and reload the page.');
        } else if (micError.name === 'NotReadableError') {
          alert('Microphone is being used by another application. Please close other apps using the microphone and try again.');
        } else {
          alert('Failed to access microphone: ' + micError.message);
        }
        return;
      }
      
      // Start the conversation
      addMessage('system', 'Connecting to agent...');
      await conversation.startSession({
        agentId: "agent_2101kd5bx850fgna9h0ab6kynh4m",
        connectionType: 'webrtc' // or 'websocket'
      });
      
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      addMessage('system', 'Failed to connect: ' + error.message);
      alert('Failed to start call: ' + error.message);
    }
  };

  const handleEndCall = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  const getStatusColor = () => {
    switch (conversation.status) {
      case 'connected': return 'bg-green-400 animate-pulse';
      case 'connecting': return 'bg-yellow-400 animate-pulse';
      case 'disconnected': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    const status = conversation.status;
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Voice Agent Chat</h1>
          <p className="text-blue-200">ElevenLabs Conversational AI</p>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
            
            {/* Microphone Check */}
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4 mb-4">
              <p className="text-yellow-200 text-sm mb-2">⚠️ Before starting:</p>
              <ul className="text-yellow-100 text-xs space-y-1 ml-4 list-disc">
                <li>Make sure you have a microphone connected</li>
                <li>Allow microphone access when browser asks</li>
                <li>Close other apps using the microphone (Zoom, Teams, etc.)</li>
                <li>Use Chrome, Firefox, or Edge for best experience</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">
                  Agent ID
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="Enter your Agent ID"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-sm text-blue-200">
                <p>Get your Agent ID from the <a href="https://elevenlabs.io/app/agents" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">ElevenLabs Dashboard</a></p>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
              <span className="text-white font-medium">{getStatusText()}</span>
              {conversation.isSpeaking && (
                <span className="text-purple-300 text-sm animate-pulse">Agent Speaking...</span>
              )}
            </div>
            
            <div className="flex space-x-3">
              {conversation.status === 'disconnected' ? (
                <button
                  onClick={handleStartCall}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all transform hover:scale-105"
                >
                  <Phone size={20} />
                  <span>Start Call</span>
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  disabled={conversation.status === 'disconnecting'}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PhoneOff size={20} />
                  <span>End Call</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="bg-white/5 px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <MessageSquare size={24} className="mr-2" />
              Conversation
            </h2>
          </div>
          
          <div
            id="chat-container"
            className="h-96 overflow-y-auto p-6 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-blue-200 text-center">
                  No messages yet. Start a call to begin conversation.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.role === 'agent'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-500/50 text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-semibold opacity-75">
                        {message.role === 'user' ? 'You' : message.role === 'agent' ? 'Agent' : 'System'}
                      </span>
                      <span className="text-xs opacity-50">{message.timestamp}</span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Feedback Section */}
        {conversation.canSendFeedback && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mt-6 border border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">How was this conversation?</span>
              <div className="flex space-x-3">
                <button
                  onClick={() => conversation.sendFeedback(true)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
                >
                  👍 Good
                </button>
                <button
                  onClick={() => conversation.sendFeedback(false)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                >
                  👎 Bad
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-blue-200">
            Powered by ElevenLabs Conversational AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgentChat;
