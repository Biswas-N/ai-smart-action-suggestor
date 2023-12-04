'use client'

import React, { useState } from 'react'
import Message, { IMessage } from '@/components/Message'
import OpenAIUtil from '@/utils/openai'
import PineconeUtil from '@/utils/pinecone'
import { getOpenAIConfig, getPineconeConfig } from '@/utils/config'

const ChatInterface = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (input.length === 0) {
      return
    }

    const newMessage = input
    setInput('')

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        message: newMessage,
        time: new Date().toLocaleTimeString(),
        smart_actions: [],
      },
    ])

    const openAiUtil = new OpenAIUtil({
      apiKey: getOpenAIConfig().apiKey,
      pineconeUtil: new PineconeUtil(getPineconeConfig()),
    })

    console.log('Getting suggested smart actions...')
    openAiUtil
      .getSuggestedSmartActions(newMessage)
      .then((smartAction: string) => {
        setMessages((prevMessages: Array<IMessage>) => {
          const newMessageObj = prevMessages.find(
            (message) => message.message === newMessage,
          )
          if (newMessageObj) {
            newMessageObj.smartAction = {
              label: smartAction,
              associated_data: {},
            }
          }
          return [...prevMessages]
        })
      })
      .catch((err) => {
        console.error(err)
      })
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
            smartAction={message.smartAction}
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
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          onClick={handleSend}
        >
          Send
        </button>
      </footer>
    </div>
  )
}

export default ChatInterface
