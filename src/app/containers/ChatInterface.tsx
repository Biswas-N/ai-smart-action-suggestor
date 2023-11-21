"use client";

import React, { useState } from 'react';
import Message, { IMessage } from '../components/Message';

const ChatInterface = () => {
  const [messages, setMessages] = useState<IMessage[]>([
    // { message: "This is a chat message.", time: new Date().toLocaleTimeString(), smart_actions: [] },
    // { message: "This is another chat message.", time: new Date().toLocaleTimeString(), smart_actions: [{ label: "Yes", associated_data: { sample: "yeah" } }] },
  ])
  const [input, setInput] = useState("")

  const handleSend = () => {
    if (input.length > 0) {
      setMessages([...messages, { message: input, time: new Date().toLocaleTimeString(), smart_actions: [] }])
      setInput("")
    }
  }

  return (
    <div className="min-h-screen flex flex-col w-2/4 mx-auto">
      <header className="bg-gray-900 text-white flex items-center justify-center px-4 py-2">
        <h1 className="text-3xl font-bold text-center">Dimension AI POC</h1>
      </header>
      <main className="flex flex-col flex-grow overflow-y-auto px-4 py-2">
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message.message}
            time={message.time}
            smart_actions={message.smart_actions}
          />
        ))}
      </main>
      <footer className="bg-gray-900 text-white flex items-center justify-between px-4 py-2">
        <input
          type="text"
          placeholder="Type your message here..."
          className="flex-grow p-2 rounded-lg mr-2 text-gray-700"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600" onClick={handleSend}>
          Send
        </button>
      </footer>
    </div>
  );
};

export default ChatInterface;
