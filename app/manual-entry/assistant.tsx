import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findBestMatch } from '../../lib/fuzzyMatcher';
import { DatePickerModal } from '../../components/calendar/DatePickerModal';
import { callSupabaseFunction } from '../../lib/supabase';
import { recordScan } from '../../lib/usageTracking';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  type?: 'text' | 'confirmation' | 'date-picker' | 'number-input' | 'choice';
  data?: any;
}

type CategoryType = 'education' | 'gear' | 'event' | 'service' | 'transaction';

export default function AssistantScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      sender: 'bot', 
      text: "Hi! I'm the Crescender Assistant. What are you adding today? (e.g. \"Guitar lessons with Jack\", \"New Fender Strat\", \"Repair for my Sax\")" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State Machine
  const [conversationState, setConversationState] = useState<'IDLE' | 'CATEGORY_CONFIRM' | 'DETAILS' | 'REVIEW'>('IDLE');
  const [detailStep, setDetailStep] = useState(0);
  const [draftItem, setDraftItem] = useState<{
    type?: CategoryType;
    title?: string;
    merchant?: string;
    amount?: number;
    date?: Date;
    details?: any;
  }>({});

  // Date Picker handling
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Core State Machine ---

  const processUserInput = async (text: string) => {
    // 1. Identification Phase
    if (conversationState === 'IDLE') {
      const lower = text.toLowerCase();
      let detectedType: CategoryType | null = null;
      let cleanText = text;

      // Keyword matching
      if (lower.includes('lesson') || lower.includes('class') || lower.includes('tutor') || lower.includes('teacher') || lower.includes('tuition')) {
        detectedType = 'education';
        cleanText = lower.replace(/lessons?|with|from|classes|tuition/g, '').trim();
      } else if (lower.includes('repair') || lower.includes('service') || lower.includes('setup') || lower.includes('fix') || lower.includes('restring') || lower.includes('maintenance')) {
        detectedType = 'service';
        cleanText = lower.replace(/repair|service|setup|fix|restring|maintenance|for|my/g, '').trim();
      } else if (lower.includes('bought') || lower.includes('gear') || lower.includes('guitar') || lower.includes('amp') || lower.includes('pedal') || lower.includes('drums')) {
        detectedType = 'gear';
        cleanText = lower.replace(/bought|new|gear|used/g, '').trim();
      } else if (lower.includes('ticket') || lower.includes('concert') || lower.includes('gig') || lower.includes('show') || lower.includes('festival') || lower.includes('performance')) {
        detectedType = 'event';
        cleanText = lower.replace(/ticket|concert|gig|show|festival|performance|for|seeing/g, '').trim();
      }

      if (detectedType) {
        setDraftItem({ type: detectedType });
        setConversationState('DETAILS');
        setDetailStep(0);
        
        // Fuzzy Match Check
        if (cleanText.length > 2 && (detectedType === 'education' || detectedType === 'event' || detectedType === 'service')) {
          const match = await findBestMatch(cleanText, detectedType === 'event' ? 'brand' : 'merchant'); // 'brand' used loosely for artist
          if (match && match.confidence > 0.4) {
             setDraftItem(prev => ({ ...prev, type: detectedType, merchant: match.match }));
             addBotMessage(`I found "${match.match}" in your history. Is that correct?`, 'confirmation', { match: match.match });
             return;
          }
        }
        
        // Start Specific Flow
        nextQuestion(detectedType, 0);
      } else {
        addBotMessage("I didn't quite catch that category. Is this for Gear, Education, an Event, or a Service?", 'choice', {
          choices: ['Gear', 'Education', 'Event', 'Service']
        });
      }
    }
    
    // 2. Details Phase
    else if (conversationState === 'DETAILS') {
      const type = draftItem.type!;
      
      // Store answer from PREVIOUS step
      saveAnswer(type, detailStep, text);

      // Move to NEXT step
      const nextStep = detailStep + 1;
      setDetailStep(nextStep);
      nextQuestion(type, nextStep);
    }
  };

  // --- Logic Helpers ---

  const nextQuestion = (type: CategoryType, step: number) => {
    // EDUCATION FLOW
    if (type === 'education') {
      if (step === 0) { // If merchant not already found fuzzy
         if (draftItem.merchant) return nextQuestion(type, 1); // Skip if found
         addBotMessage("Who is the teacher or school?");
      }
      else if (step === 1) addBotMessage("How many lessons are you adding?");
      else if (step === 2) addBotMessage("When do these start?", 'date-picker');
      else if (step === 3) addBotMessage("Are you charged by the lesson or by the term?", 'choice', { choices: ['Lesson', 'Term'] });
      else finishFlow();
    }

    // GEAR FLOW
    else if (type === 'gear') {
      if (step === 0) addBotMessage("What is the brand and model?");
      else if (step === 1) addBotMessage("Did you buy it at a store or privately?", 'choice', { choices: ['Store', 'Private'] });
      else if (step === 2) addBotMessage("How much did it cost?");
      else if (step === 3) addBotMessage("Is it New or Used?", 'choice', { choices: ['New', 'Used'] });
      else if (step === 4) addBotMessage("When did you get it?", 'date-picker');
      else finishFlow();
    }

    // EVENT FLOW
    else if (type === 'event') {
       if (step === 0) {
         if (draftItem.merchant) return nextQuestion(type, 1);
         addBotMessage("Who are you seeing?");
       }
       else if (step === 1) addBotMessage("When is the show?", 'date-picker');
       else if (step === 2) addBotMessage("Total cost for tickets?");
       else finishFlow();
    }

    // SERVICE FLOW
    else if (type === 'service') {
      if (step === 0) {
         if (draftItem.merchant) return nextQuestion(type, 1);
         addBotMessage("Who did the work?");
      }
      else if (step === 1) addBotMessage("What work was done? (e.g. Restring, Refret)");
      else if (step === 2) addBotMessage("How complex was it?", 'choice', { choices: ['Simple (DIY)', 'Medium (Maintenance)', 'Expert (Repair)'] });
      else if (step === 3) addBotMessage("Total cost?");
      else finishFlow();
    }
  };

  const saveAnswer = (type: CategoryType, step: number, text: string) => {
    setDraftItem(prev => {
      const newDraft = { ...prev };
      
      if (type === 'education') {
        if (step === 0) newDraft.merchant = text;
        if (step === 1) newDraft.details = { ...newDraft.details, count: parseInt(text) || 1 };
        if (step === 2) newDraft.date = new Date(text);
        if (step === 3) newDraft.details = { ...newDraft.details, billing: text };
      }
      else if (type === 'gear') {
        if (step === 0) {
           const parts = text.split(' ');
           newDraft.title = text;
           if (parts.length > 0) newDraft.details = { ...newDraft.details, brand: parts[0] };
        }
        if (step === 1) newDraft.details = { ...newDraft.details, purchaseSource: text };
        if (step === 2) newDraft.amount = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
        if (step === 3) newDraft.details = { ...newDraft.details, condition: text };
        if (step === 4) newDraft.date = new Date(text);
      }
      else if (type === 'event') {
        if (step === 0) newDraft.merchant = text;
        if (step === 1) newDraft.date = new Date(text);
        if (step === 2) newDraft.amount = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
      }
      else if (type === 'service') {
        if (step === 0) newDraft.merchant = text;
        if (step === 1) newDraft.details = { ...newDraft.details, workDone: text };
        if (step === 2) newDraft.details = { ...newDraft.details, complexity: text };
        if (step === 3) newDraft.amount = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
      }
      
      return newDraft;
    });
  };

  const finishFlow = async () => {
    setConversationState('REVIEW');
    setIsTyping(true);
    addBotMessage("Got it! I'm organising those details for you...", 'text');
    
    // Deduct a scan as per manual entry rules (each gear/item counts as a scan)
    try {
      await recordScan();
    } catch (e) {
      console.error("[Assistant] Failed to record scan usage:", e);
    }
    
    try {
      // Transcript for AI context
      const history = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`);
      
      // Call the NEW Enrichment function
      const result = await callSupabaseFunction<any>('enrich-manual-entry', { 
        draft: draftItem,
        history 
      });

      console.log("[Assistant] Enrichment Result:", result);
      
      // Reshape the result into the standard ReceiptData format expected by /review
      const reshapedData = {
        summary: result.summary,
        financial: {
          merchant: result.merchant.name,
          merchantAbn: result.merchant.abn,
          date: draftItem.date ? draftItem.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          total: result.item.totalPrice,
          subtotal: result.item.totalPrice,
          tax: 0,
          merchantDetails: {
            name: result.merchant.name,
            suburb: result.merchant.suburb,
            address: result.merchant.address,
            phone: result.merchant.phone,
            email: result.merchant.email,
            website: result.merchant.website
          }
        },
        items: [{
          description: result.item.description,
          category: result.item.category,
          brand: result.item.brand || result.item.gearDetails?.brand,
          model: result.item.model || result.item.gearDetails?.modelName,
          quantity: 1,
          unitPrice: result.item.totalPrice,
          totalPrice: result.item.totalPrice,
          // Map category-specific details
          gearDetails: result.item.category === 'gear' ? result.item.gearDetails : undefined,
          educationDetails: result.item.category === 'education' ? result.item.educationDetails : undefined,
          serviceDetails: result.item.category === 'service' ? result.item.serviceDetails : undefined,
          notes: `Added via Crescender Assistant${draftItem.details?.purchaseSource ? ` (${draftItem.details.purchaseSource} purchase)` : ''}`
        }]
      };

      // Navigate to standard review screen, forcing monolithic style for manual AI entries
      router.replace({
        pathname: '/review',
        params: { 
          data: JSON.stringify(reshapedData),
          uri: undefined, // Manual entry has no image
          forceMonolithic: 'true'
        }
      });
    } catch (error) {
      console.error("[Assistant] Enrichment failed:", error);
      Alert.alert("Enrichment Issue", "I couldn't perfectly organise your details. Try again?");
    } finally {
      setIsTyping(false);
    }
  };


  // --- Infrastructure (Same as before) ---
  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(async () => {
      await processUserInput(text);
      setIsTyping(false);
    }, 800);
  };

  const addBotMessage = (text: string, type: Message['type'] = 'text', data?: any) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text, type, data }]);
  };

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  return (
    <View className="flex-1 bg-crescender-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Modals often handle their own offset or need 0
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-4 border-b border-crescender-800 flex-row items-center justify-between bg-crescender-950">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Feather name="chevron-left" size={24} color="#f5c518" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <Image 
              source={require('../../public/logo.png')} 
              style={{ width: 28, height: 28 }} 
              resizeMode="contain"
            />
            <Text className="text-white font-bold text-lg">Assistant</Text>
          </View>
          <View className="w-10" />
        </View>
  
        {/* Chat Area */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 20, gap: 16 }}
        >
          {messages.map((msg) => (
            <View 
              key={msg.id} 
              className={`flex-row ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <View className="w-8 h-8 rounded-full bg-transparent items-center justify-center mr-2 mt-auto">
                   <Image 
                      source={require('../../public/logo.png')} 
                      style={{ width: 28, height: 28 }} 
                      resizeMode="contain"
                    />
                </View>
              )}
              
              <View className={`max-w-[85%]`}>
                <View 
                  className={`p-4 rounded-2xl ${
                    msg.sender === 'user' 
                      ? 'bg-crescender-700/80 rounded-br-none' 
                      : 'bg-crescender-800/80 rounded-bl-none'
                  }`}
                >
                  <Text className="text-white text-base leading-snug">{msg.text}</Text>
                </View>
  
                {/* Interactive Elements */}
                {msg.type === 'confirmation' && msg.data && (
                    <View className="mt-2 flex-row gap-2">
                      <TouchableOpacity 
                        onPress={() => {
                          setDraftItem(prev => ({ ...prev, merchant: msg.data.match }));
                          const nextStep = 1;
                          setDetailStep(nextStep);
                          nextQuestion(conversationState === 'IDLE' ? 'education' : draftItem.type!, nextStep); // Fix typing 
                        }}
                        className="bg-gold px-4 py-2 rounded-full"
                      >
                        <Text className="text-crescender-950 font-bold">Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => {
                          handleSend("No");
                          setTimeout(() => nextQuestion(draftItem.type!, 0), 500);
                        }} 
                        className="bg-black/30 px-4 py-2 rounded-full"
                      >
                        <Text className="text-white">No</Text>
                      </TouchableOpacity>
                    </View>
                )}
  
                {msg.type === 'choice' && msg.data?.choices && (
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {msg.data.choices.map((choice: string) => (
                      <TouchableOpacity
                        key={choice}
                        onPress={() => handleSend(choice)}
                        className="bg-crescender-700 border border-crescender-600 px-4 py-2 rounded-full"
                      >
                        <Text className="text-crescender-100">{choice}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
  
                {msg.type === 'date-picker' && (
                   <TouchableOpacity 
                     onPress={() => setShowDatePicker(true)}
                     className="mt-2 bg-crescender-800 border border-gold/30 px-4 py-3 rounded-xl flex-row items-center gap-2"
                   >
                     <Feather name="calendar" size={18} color="#f5c518" />
                     <Text className="text-gold font-bold">Select Date</Text>
                   </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          
          {isTyping && (
            <View className="flex-row justify-start items-center ml-10">
              <View className="flex-row gap-1 bg-crescender-800/40 p-3 rounded-xl rounded-bl-none">
                <View className="w-2 h-2 bg-crescender-400 rounded-full animate-pulse" />
                <View className="w-2 h-2 bg-crescender-400 rounded-full animate-pulse delay-75" />
                <View className="w-2 h-2 bg-crescender-400 rounded-full animate-pulse delay-150" />
              </View>
            </View>
          )}
        </ScrollView>
  
        {/* Input Area */}
        <View 
          style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 10 }}
          className="p-4 bg-crescender-900 border-t border-crescender-800"
        >
          <View className="flex-row items-center gap-2">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#6b7280"
              className="flex-1 bg-crescender-950 text-white px-5 rounded-full border border-crescender-700 text-base"
              style={{ 
                height: 54,
                textAlignVertical: 'center',
                paddingVertical: 10
              }}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity 
              onPress={() => handleSend()}
              disabled={!inputText.trim()}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() ? 'bg-gold' : 'bg-crescender-800'
              }`}
            >
              <Feather 
                name="send" 
                size={20} 
                color={inputText.trim() ? '#2e1065' : '#4b5563'} 
                style={{ marginLeft: 2 }} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Date Picker */}
      <DatePickerModal
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
        selectedDate={null}
        onDateSelect={(dateStr) => {
          setShowDatePicker(false);
          handleSend(dateStr);
        }}
      />
    </View>
  );
}
