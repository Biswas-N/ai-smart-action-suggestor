import React from 'react'
import OpenAIUtil from '@/utils/openai'
import PineconeUtil from '@/utils/pinecone'
import { getOpenAIConfig, getPineconeConfig } from '@/utils/config'

export interface IMessage {
  message: string
  time: string
  smartAction?: IMessageSmartAction
}

export interface IMessageSmartAction {
  label: string
  associated_data: object
}

const Message: React.FC<IMessage> = ({ message, time, smartAction }) => {
  const handleSmartActionClick = async () => {
    if (!smartAction) {
      return
    }
    if (smartAction.label === 'action-not-recognised') {
      alert(
        'Smart action clicked! As this is a dummy action, nothing will happen.',
      )
      return
    }

    const openaiUtil = new OpenAIUtil({
      apiKey: getOpenAIConfig().apiKey,
      pineconeUtil: new PineconeUtil(getPineconeConfig()),
    })

    let newMessages: Record<string, string[]> = {}
    newMessages[smartAction.label] = [message]
    await openaiUtil.pushMessagesToPinecone(newMessages)
    alert('Smart action clicked! This message has been pushed to Pinecone.')
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-gray-700 mb-4">{message}</p>
        <p className="text-gray-500">{time}</p>
      </div>
      {smartAction && (
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            onClick={handleSmartActionClick}
          >
            {smartAction.label}
          </button>
        </div>
      )}
    </>
  )
}

export default Message
