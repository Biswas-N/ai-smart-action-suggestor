import React from 'react'

export interface IMessage {
  message: string
  time: string
  smart_actions?: IMessageSmartAction[]
}

export interface IMessageSmartAction {
  label: string
  associated_data: object
}

const Message: React.FC<IMessage> = ({ message, time, smart_actions }) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-gray-700 mb-4">{message}</p>
        <p className="text-gray-500">{time}</p>
      </div>
      {smart_actions && smart_actions.length > 0 && (
        <div className="flex items-center justify-between">
          {smart_actions.map((action, index) => (
            <button
              key={index}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default Message
