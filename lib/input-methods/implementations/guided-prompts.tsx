'use client'

/**
 * Conversational Chat Interview Input Method
 * AI agent conducts a natural conversation to understand travel requirements
 */

import { MessageCircle, Send, User, Bot } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'

import { Button } from '@/components/ui'
import type { TTravelRequirements } from '@/lib/schemas/travel-requirements'

import type { InputMethodProps } from '../types'

// Chat message interface
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Conversation state
interface ConversationState {
  messages: ChatMessage[]
  isProcessing: boolean
  isComplete: boolean
  extractedRequirements: Partial<TTravelRequirements> | null
  conversationContext: Record<string, any>
  currentInput: string
}

// Initial greeting from the AI agent
const INITIAL_GREETING = `Hello! I'm your AI travel assistant, and I'm excited to help you plan the perfect trip! 

I'll ask you a few questions to understand exactly what you're looking for. Think of this as a conversation with a knowledgeable travel agent who wants to create something amazing just for you.

Let's start simple: **Where will you be traveling from?** (For example, "San Francisco" or "New York City")`

export function GuidedPromptsInput({ onComplete, onCancel }: InputMethodProps) {
  const [state, setState] = useState<ConversationState>({
    messages: [
      {
        id: '1',
        role: 'assistant',
        content: INITIAL_GREETING,
        timestamp: new Date(),
      },
    ],
    isProcessing: false,
    isComplete: false,
    extractedRequirements: null,
    conversationContext: {},
    currentInput: '',
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.messages])

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Send message and get AI response
  const sendMessage = useCallback(async () => {
    const userMessage = state.currentInput.trim()
    if (!userMessage || state.isProcessing) {
      return
    }

    const userMessageObj: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessageObj],
      currentInput: '',
      isProcessing: true,
    }))

    try {
      // Build conversation history for context
      const conversationHistory = [...state.messages, userMessageObj]
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n\n')

      // Create a prompt for the AI to continue the conversation
      const conversationPrompt = `You are a friendly, expert travel assistant conducting an interview to understand travel requirements. Your goal is to gather this information through natural conversation:

1. Origin city (where traveling from)
2. Number of adults and children (with ages if children)
3. Preferred travel methods (driving, flying, train)
4. Travel time/distance preferences 
5. Interests and activities they enjoy
6. Any other preferences

CONVERSATION SO FAR:
${conversationHistory}

INSTRUCTIONS:
- Ask ONE follow-up question based on what they just said
- Be conversational, warm, and helpful (like talking to a travel agent)
- If they've provided information, acknowledge it before asking the next question
- Don't ask for information you already have
- When you have enough info to plan a trip, say "I think I have everything I need!" and suggest completing the requirements

Respond with ONLY your next question or response (no JSON, no formatting).`

      // Call the AI to get the next response
      const response = await fetch(
        '/netlify/edge-functions/extract-requirements',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: conversationPrompt,
            conversational: true, // Flag to indicate this is conversational, not extraction
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // For now, we'll use a simple response. In a full implementation,
      // this would call a proper conversational AI endpoint
      let aiResponse =
        'I understand! Let me ask you another question to help plan your perfect trip.'

      // Simple conversation logic based on what we know
      const lowerUserMessage = userMessage.toLowerCase()

      if (
        lowerUserMessage.includes('san francisco') ||
        lowerUserMessage.includes('new york') ||
        lowerUserMessage.includes('los angeles') ||
        lowerUserMessage.includes('chicago')
      ) {
        aiResponse = `${userMessage} - what a fantastic starting point! Now, who will be joining you on this trip? Will you be traveling solo, with a partner, family, or friends?`
      } else if (
        lowerUserMessage.includes('partner') ||
        lowerUserMessage.includes('couple') ||
        lowerUserMessage.includes('two of us')
      ) {
        aiResponse =
          'Perfect, a couples trip! Those can be so special. What kind of experiences get you most excited when you travel? Are you into art and culture, outdoor adventures, great food and wine, or something else entirely?'
      } else if (
        lowerUserMessage.includes('family') ||
        lowerUserMessage.includes('kids') ||
        lowerUserMessage.includes('children')
      ) {
        aiResponse =
          'A family adventure! How many children will be coming along, and what are their ages? This helps me think about the best activities and destinations.'
      } else if (
        lowerUserMessage.includes('food') ||
        lowerUserMessage.includes('restaurant') ||
        lowerUserMessage.includes('wine')
      ) {
        aiResponse =
          'A fellow foodie! I love that. How do you prefer to travel - are you comfortable flying, or do you enjoy road trips? And roughly how far are you willing to travel for this trip?'
      } else if (
        lowerUserMessage.includes('art') ||
        lowerUserMessage.includes('museum') ||
        lowerUserMessage.includes('culture')
      ) {
        aiResponse =
          "Art and culture - there are so many amazing destinations for that! What's your preferred way to travel, and how far are you willing to go for the perfect cultural experience?"
      } else if (
        lowerUserMessage.includes('drive') ||
        lowerUserMessage.includes('driving') ||
        lowerUserMessage.includes('car')
      ) {
        aiResponse =
          'I love a good road trip! How many hours are you comfortable driving? 2-3 hours, half a day, or are you up for a longer adventure?'
      } else if (
        lowerUserMessage.includes('fly') ||
        lowerUserMessage.includes('flying') ||
        lowerUserMessage.includes('plane')
      ) {
        aiResponse =
          "Flying opens up so many possibilities! Are you thinking domestic or would you consider international? And what's your ideal flight time?"
      } else if (
        lowerUserMessage.includes('hour') ||
        lowerUserMessage.includes('close') ||
        lowerUserMessage.includes('nearby')
      ) {
        aiResponse =
          "Got it - staying relatively close makes for a relaxed trip! I think I have everything I need to help you find some amazing options. Should we review what we've discussed and find your perfect destinations?"
      } else {
        // Generic follow-up responses
        const responses = [
          "That's really helpful to know! What else is important to you for this trip?",
          'Interesting! How about your travel style - do you prefer a packed itinerary or a more relaxed pace?',
          'Good to know! What kind of budget range are you thinking for this trip?',
          "I'm getting a great sense of what you're looking for! Any particular time of year you're planning to travel?",
        ]
        aiResponse =
          responses[Math.floor(Math.random() * responses.length)] ||
          "That's really helpful to know! What else is important to you for this trip?"
      }

      // Check if we should complete the conversation
      const shouldComplete =
        conversationHistory.length > 8 ||
        lowerUserMessage.includes("that's everything") ||
        lowerUserMessage.includes('sounds good')

      if (shouldComplete) {
        aiResponse =
          "I think I have everything I need to help you plan an amazing trip! Let me process all the information you've shared and we'll get you some perfect destination recommendations."

        // For now, create basic requirements. In full implementation,
        // this would use AI to extract from the conversation
        const extractedRequirements: TTravelRequirements = {
          originCity: extractCityFromConversation(conversationHistory),
          numberOfAdults:
            extractTravelersFromConversation(conversationHistory).adults,
          numberOfChildren:
            extractTravelersFromConversation(conversationHistory).children,
          childrenAges: [],
          preferredTravelMethods:
            extractTravelMethodsFromConversation(conversationHistory),
          interests: extractInterestsFromConversation(conversationHistory),
          travelDurationLimits: {
            drive: 4,
            rail: 8,
            air: 6,
          },
        }

        setState(prev => ({
          ...prev,
          isComplete: true,
          extractedRequirements,
          isProcessing: false,
        }))
      }

      const aiMessageObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, aiMessageObj],
        isProcessing: false,
      }))
    } catch (error) {
      console.error('Failed to get AI response:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'I&apos;m having a bit of trouble right now. Could you try rephrasing that, or we can continue with what we have so far?',
        timestamp: new Date(),
      }

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isProcessing: false,
      }))
    }
  }, [state.currentInput, state.isProcessing, state.messages])

  // Handle form submission
  const handleComplete = useCallback(() => {
    if (!state.extractedRequirements) {
      return
    }

    const metadata = {
      methodType: 'guided-prompts' as const,
      startTime: Date.now() - state.messages.length * 30000, // Rough estimate
      completionTime: Date.now(),
      stepCount: state.messages.length,
      revisionsCount: 0,
      userAgent: navigator.userAgent,
    }

    // Ensure all required fields are present
    const completeRequirements: TTravelRequirements = {
      originCity: state.extractedRequirements.originCity || 'Not specified',
      numberOfAdults: state.extractedRequirements.numberOfAdults || 2,
      numberOfChildren: state.extractedRequirements.numberOfChildren || 0,
      childrenAges: state.extractedRequirements.childrenAges || [],
      preferredTravelMethods: state.extractedRequirements
        .preferredTravelMethods || ['drive'],
      interests: state.extractedRequirements.interests || [
        'culture-local-experiences',
      ],
      travelDurationLimits: state.extractedRequirements.travelDurationLimits,
    }

    onComplete(completeRequirements, metadata)
  }, [state.extractedRequirements, state.messages.length, onComplete])

  // Handle input changes
  const handleInputChange = (value: string) => {
    setState(prev => ({ ...prev, currentInput: value }))
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="conversational-input h-[600px] flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 bg-blue-50 border-b border-blue-200 rounded-t-lg">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-semibold text-blue-900">Travel Interview</h3>
          <p className="text-sm text-blue-700">
            Chat with our AI agent to plan your trip
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {state.messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 shadow-sm border'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {state.isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm border">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Completion Section */}
      {state.isComplete && state.extractedRequirements && (
        <div className="p-4 bg-green-50 border-t border-green-200">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-green-600 font-medium">✅</span>
            <div>
              <p className="text-green-800 font-medium">
                Requirements Gathered!
              </p>
              <p className="text-green-700 text-sm">
                Based on our conversation, here&apos;s what I understand:
              </p>
            </div>
          </div>

          <div className="bg-white p-3 rounded border space-y-2 text-sm mb-4">
            <div>
              <strong>From:</strong>{' '}
              {state.extractedRequirements.originCity || 'Not specified'}
            </div>
            <div>
              <strong>Travelers:</strong>{' '}
              {state.extractedRequirements.numberOfAdults} adults
              {(state.extractedRequirements.numberOfChildren || 0) > 0 &&
                `, ${state.extractedRequirements.numberOfChildren} children`}
            </div>
            <div>
              <strong>Travel Methods:</strong>{' '}
              {state.extractedRequirements.preferredTravelMethods?.join(', ') ||
                'Not specified'}
            </div>
            <div>
              <strong>Interests:</strong>{' '}
              {state.extractedRequirements.interests?.join(', ') ||
                'Not specified'}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleComplete} className="flex-1">
              Perfect! Find my destinations
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setState(prev => ({
                  ...prev,
                  isComplete: false,
                  extractedRequirements: null,
                }))
              }
              className="flex-1"
            >
              Continue chatting
            </Button>
          </div>
        </div>
      )}

      {/* Chat Input */}
      {!state.isComplete && (
        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={state.currentInput}
              onChange={e => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              disabled={state.isProcessing}
            />
            <Button
              onClick={sendMessage}
              disabled={!state.currentInput.trim() || state.isProcessing}
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, or click the button
          </p>
        </div>
      )}

      {/* Cancel Button */}
      <div className="p-4 text-center border-t bg-gray-50">
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 underline text-sm"
        >
          Cancel and choose different input method
        </button>
      </div>
    </div>
  )
}

// Helper functions to extract information from conversation
function extractCityFromConversation(conversation: string): string {
  const cities = [
    'san francisco',
    'new york',
    'los angeles',
    'chicago',
    'boston',
    'seattle',
    'denver',
    'austin',
    'miami',
    'portland',
  ]
  const lowerConversation = conversation.toLowerCase()

  for (const city of cities) {
    if (lowerConversation.includes(city)) {
      return city
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  }

  return 'Not specified'
}

function extractTravelersFromConversation(conversation: string): {
  adults: number
  children: number
} {
  const lowerConversation = conversation.toLowerCase()

  if (
    lowerConversation.includes('couple') ||
    lowerConversation.includes('partner') ||
    lowerConversation.includes('two of us')
  ) {
    return { adults: 2, children: 0 }
  }

  if (
    lowerConversation.includes('family') ||
    lowerConversation.includes('kids') ||
    lowerConversation.includes('children')
  ) {
    return { adults: 2, children: 1 } // Default assumption
  }

  if (
    lowerConversation.includes('solo') ||
    lowerConversation.includes('just me') ||
    lowerConversation.includes('by myself')
  ) {
    return { adults: 1, children: 0 }
  }

  return { adults: 2, children: 0 } // Default
}

function extractTravelMethodsFromConversation(
  conversation: string
): ('drive' | 'rail' | 'air')[] {
  const lowerConversation = conversation.toLowerCase()
  const methods: ('drive' | 'rail' | 'air')[] = []

  if (
    lowerConversation.includes('drive') ||
    lowerConversation.includes('driving') ||
    lowerConversation.includes('car') ||
    lowerConversation.includes('road trip')
  ) {
    methods.push('drive')
  }

  if (
    lowerConversation.includes('fly') ||
    lowerConversation.includes('flying') ||
    lowerConversation.includes('plane') ||
    lowerConversation.includes('flight')
  ) {
    methods.push('air')
  }

  if (
    lowerConversation.includes('train') ||
    lowerConversation.includes('rail')
  ) {
    methods.push('rail')
  }

  return methods.length > 0 ? methods : ['drive'] // Default to drive
}

function extractInterestsFromConversation(
  conversation: string
): (
  | 'arts'
  | 'architecture'
  | 'nature-outdoors'
  | 'music-nightlife'
  | 'sports-recreation'
  | 'history'
  | 'food-dining'
  | 'shopping'
  | 'culture-local-experiences'
)[] {
  const lowerConversation = conversation.toLowerCase()
  const interests: (
    | 'arts'
    | 'architecture'
    | 'nature-outdoors'
    | 'music-nightlife'
    | 'sports-recreation'
    | 'history'
    | 'food-dining'
    | 'shopping'
    | 'culture-local-experiences'
  )[] = []

  if (
    lowerConversation.includes('food') ||
    lowerConversation.includes('restaurant') ||
    lowerConversation.includes('dining') ||
    lowerConversation.includes('wine')
  ) {
    interests.push('food-dining')
  }

  if (
    lowerConversation.includes('art') ||
    lowerConversation.includes('museum') ||
    lowerConversation.includes('gallery')
  ) {
    interests.push('arts')
  }

  if (
    lowerConversation.includes('culture') ||
    lowerConversation.includes('local') ||
    lowerConversation.includes('experience')
  ) {
    interests.push('culture-local-experiences')
  }

  if (
    lowerConversation.includes('nature') ||
    lowerConversation.includes('outdoor') ||
    lowerConversation.includes('hiking') ||
    lowerConversation.includes('beach')
  ) {
    interests.push('nature-outdoors')
  }

  if (
    lowerConversation.includes('architecture') ||
    lowerConversation.includes('building')
  ) {
    interests.push('architecture')
  }

  if (
    lowerConversation.includes('history') ||
    lowerConversation.includes('historical')
  ) {
    interests.push('history')
  }

  return interests.length > 0 ? interests : ['culture-local-experiences'] // Default
}
