import { useState, useEffect } from 'react';
import { askGemini, wrapWithTranslation, generateSmartSummary, classifySentiment } from '../services/gemini';
import { getCrowdData } from '../services/firebase';
import { PERSONAS, DEFAULT_PERSONA } from '../constants/personas';
import { FIFA_STADIUMS, DEFAULT_STADIUM } from '../constants/stadiums';
import { isOffTopic, OFF_TOPIC_REDIRECT } from '../utils/errorHandler';
import { logCustomEvent } from '../services/analytics';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCrowd } from '../context/CrowdContext';

export default function useAssistant() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPersona, setCurrentPersona] = useState(DEFAULT_PERSONA);
  const [currentStadium, setCurrentStadium] = useState(DEFAULT_STADIUM);
  const [crowdData, setCrowdData] = useState(null);
  const [languageDetectionFailed, setLanguageDetectionFailed] = useState(false);
  
  const [smartSummary, setSmartSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const { crowdData: excelCrowd } = useCrowd();

  const refreshCrowdData = async () => {
    // Prioritize locally parsed Excel context
    if (excelCrowd && excelCrowd[currentStadium.id]) {
      setCrowdData(excelCrowd[currentStadium.id]);
      return;
    }

    try {
      const data = await getCrowdData(currentStadium.id);
      setCrowdData(data);
    } catch (err) {
      console.error("Failed to fetch crowd data:", err);
    }
  };

  useEffect(() => {
    refreshCrowdData();
    logCustomEvent('match_viewed', { stadiumId: currentStadium.id, stadiumName: currentStadium.name });

    // Fetch smart summary on stadium change
    setSmartSummary('');
    setIsSummaryLoading(true);

    const activeData = (excelCrowd && excelCrowd[currentStadium.id]) || null;
    if (activeData) {
      generateSmartSummary(currentStadium, activeData)
        .then(summary => setSmartSummary(summary))
        .catch(err => console.error("Smart summary generation failed:", err))
        .finally(() => setIsSummaryLoading(false));
    } else {
      getCrowdData(currentStadium.id)
        .then(cData => generateSmartSummary(currentStadium, cData))
        .then(summary => setSmartSummary(summary))
        .catch(err => console.error("Smart summary generation failed:", err))
        .finally(() => setIsSummaryLoading(false));
    }
  }, [currentStadium, excelCrowd]);

  const sendMessage = async (userText) => {
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    logCustomEvent('question_asked', { questionLength: userText.length, persona: currentPersona.id });

    // Classify query sentiment/intent and log to Firestore asynchronously
    classifySentiment(userText).then(async (sentiment) => {
      try {
        await addDoc(collection(db, 'match', currentStadium.id, 'queries'), {
          text: userText,
          sentiment,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error("Failed to save sentiment log in Firestore:", err);
      }
    }).catch(err => console.error("Sentiment classification failed:", err));

    // Off-topic query check
    if (isOffTopic(userText)) {
      const redirectMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: OFF_TOPIC_REDIRECT,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, redirectMsg]);
      return;
    }

    setIsLoading(true);
    setError(null);
    setLanguageDetectionFailed(false);

    // Retrieve Excel-specific context to prepend to the prompt
    const geminiContext = (excelCrowd && excelCrowd[currentStadium.id]?.gemini_context) || "";

    try {
      let assistantText = await wrapWithTranslation(
        userText,
        (translatedInput) => askGemini(translatedInput, currentPersona, currentStadium, crowdData, (seconds) => {
          setError(`High demand, retrying in ${seconds}s...`);
        }, geminiContext),
        (seconds) => {
          setError(`High demand, retrying in ${seconds}s...`);
        }
      );

      // Prepend warning if crowdData / live match data is missing
      if (!crowdData) {
        assistantText = "⚠️ Live data unavailable\n\n" + assistantText;
      }

      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: assistantText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setError(null); // clear any temporary retry warnings
    } catch (err) {
      if (err.message === "LANGUAGE_DETECTION_FAILED") {
        setLanguageDetectionFailed(true);
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
    setLanguageDetectionFailed(false);
  };

  const switchPersona = (personaId) => {
    const found = PERSONAS.find(p => p.id === personaId);
    if (found) {
      setCurrentPersona(found);
      clearMessages();
    }
  };

  const switchStadium = (stadiumId) => {
    const found = FIFA_STADIUMS.find(s => s.id === stadiumId);
    if (found) {
      setCurrentStadium(found);
      clearMessages();
    }
  };

  return {
    messages,
    isLoading,
    error,
    currentPersona,
    currentStadium,
    crowdData,
    languageDetectionFailed,
    setLanguageDetectionFailed,
    smartSummary,
    isSummaryLoading,
    sendMessage,
    clearMessages,
    switchPersona,
    switchStadium,
    refreshCrowdData
  };
}
