import React, { useState, useEffect, useRef } from 'react';
import { Brain, MessageCircle, Send, SkipForward, ArrowRight, Bot } from 'lucide-react';

// Reflection Chat Component
const ReflectionChat = ({ 
  currentLessonIndex, 
  onComplete, 
  onSkip, 
  apiKey, 
  useEmbeddedKey,
  t // translation function
}) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef(null);

  const reflectionData = t('reflection') || {};
  const setup = reflectionData.setup || {};
  const chat = reflectionData.chat || {};
  const lessons = reflectionData.lessons || {};
  const systemPrompt = reflectionData.systemPrompt || {};
  
  const MAX_QUESTIONS = setup.maxQuestions || 2;
  const currentLesson = lessons[`lesson${currentLessonIndex + 1}`] || {};

  useEffect(() => {
    // Initialize chat with Raman's first message
    if (currentLesson.initialQuestion) {
      setMessages([{
        type: 'raman',
        content: currentLesson.initialQuestion,
        timestamp: Date.now()
      }]);
    }
  }, [currentLesson]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const buildSystemPrompt = () => {
    const prompt = `${systemPrompt.basePrompt}

YOUR BACKGROUND:
- Age: ${systemPrompt.background?.age}
- Family: ${systemPrompt.background?.family}
- Former profession: ${systemPrompt.background?.profession}
- Personality: ${systemPrompt.background?.personality}

CORE IDENTITY:
${systemPrompt.identity?.map(item => `- ${item}`).join('\n')}

STRICT GUARDRAILS:
${systemPrompt.guardrails?.map((item, index) => `${index + 1}. ${item}`).join('\n')}

WHAT TO DO:
${systemPrompt.guidelines?.map(item => `- ${item}`).join('\n')}

EXAMPLES OF NATURAL REFERENCES:
${systemPrompt.exampleReferences?.map(item => `- "${item}"`).join('\n')}

TONE: ${systemPrompt.tone}
SPEECH PATTERN: ${systemPrompt.speechPattern}

If user asks medical questions, respond: "${systemPrompt.medicalDisclaimer}"

Current lesson context: ${currentLesson.title} - ${currentLesson.context}
Learning goal: ${currentLesson.learningGoal}
User's reflection focus: ${currentLesson.focus}

Keep responses to 1-2 sentences maximum. Be conversational and supportive.`;

    return prompt;
  };

  const getMockResponse = (userMessage) => {
    // Get responses for current lesson
    const lessonKey = `lesson${currentLessonIndex + 1}`;
    const lessonResponses = reflectionData.mockResponses?.[lessonKey]?.responses || [];
    
    if (lessonResponses.length === 0) {
      return reflectionData.fallbackResponses?.generic || "Thank you for sharing that with me.";
    }
    
    // Use question count to determine which response to use
    // This ensures each user gets the same response pattern
    const responseIndex = questionCount % lessonResponses.length;
    return lessonResponses[responseIndex];
  };

  const sendToMockChat = async (userMessage) => {
    // Simulate API delay for realistic feel
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    try {
      return getMockResponse(userMessage);
    } catch (error) {
      console.error('Mock Chat Error:', error);
      return reflectionData.fallbackResponses?.error || "I'm having trouble responding right now. Your thoughts are important to me.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || questionCount >= MAX_QUESTIONS) return;

    const userMessage = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // Add user message
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMessage]);

    // Get Raman's response from mock chat
    const ramanResponse = await sendToMockChat(userMessage);
    
    const newRamanMessage = {
      type: 'raman',
      content: ramanResponse,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newRamanMessage]);
    setQuestionCount(prev => prev + 1);
    setIsLoading(false);

    // Check if we've reached the limit
    if (questionCount + 1 >= MAX_QUESTIONS) {
      setTimeout(() => {
        const completionMessage = {
          type: 'raman',
          content: reflectionData.completion?.message || "Thank you for sharing your thoughts with me.",
          timestamp: Date.now(),
          isCompletion: true
        };
        setMessages(prev => [...prev, completionMessage]);
        setIsComplete(true);
      }, 1000);
    }
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  const handleContinue = () => {
    if (onComplete) onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center">
            <MessageCircle className="text-blue-500 mr-3" size={24} />
            <div>
              <h1 className="font-semibold text-gray-800">
                {setup.chatHeader} - {currentLesson.title}
              </h1>
              <p className="text-sm text-gray-500">
                {chat.questionCounter?.replace('{current}', questionCount + 1)?.replace('{total}', MAX_QUESTIONS)} • {setup.costSubtext}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            {chat.skipButton}
          </button>
        </div>
      </div>

      {/* AI Agent Disclosure */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm text-blue-700">
          <Bot size={16} />
          <span>You are chatting with a mock AI version of Raman. Responses are pre-written to help you reflect on the lesson.</span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'raman' && (
                <div className="flex items-start mr-3">
                  {/* Raman's Avatar - Same as in lessons */}
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                    🧓
                  </div>
                </div>
              )}
              
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}>
                {message.type === 'raman' && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <Bot size={12} />
                    <span>Raman (AI)</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.isCompletion && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {reflectionData.completion?.readyForNext}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start mr-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                  🧓
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Bot size={12} />
                  <span>Raman (AI)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area or Completion */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {isComplete ? (
            <div className="flex justify-center gap-3">
              <button
                onClick={handleContinue}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              >
                {chat.continueButton}
                <ArrowRight size={16} />
              </button>
            </div>
          ) : questionCount < MAX_QUESTIONS ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={chat.inputPlaceholder}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          ) : null}
          
          {questionCount < MAX_QUESTIONS && (
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500">
                {chat.questionsRemaining?.replace('{remaining}', MAX_QUESTIONS - questionCount)?.replace('{total}', MAX_QUESTIONS)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReflectionChat;