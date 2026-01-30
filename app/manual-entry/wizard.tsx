import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState, useMemo, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MANUAL_ENTRY_SCHEMA, WizardStep, FieldDefinition } from '@lib/manual-entry/schema';
import { TransactionRepository } from '@lib/repository';
import { DatePickerModal } from '@components/calendar/DatePickerModal';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';

// --- Constants ---
const CATEGORY_COLORS: Record<string, string> = {
  gear: '#f5c518',
  service: '#f97316',
  education: '#3b82f6',
  event: '#a855f7',
  money: '#22c55e',
  default: '#f5c518'
};

// --- Helper for Nested Data ---
const setNestedValue = (obj: any, path: string, value: any): any => {
  const newObj = JSON.parse(JSON.stringify(obj)); // Deep clone simple way
  const keys = path.split('.');
  let current = newObj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return newObj;
};

const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
};

// --- Field Components ---

const TextField = ({ field, value, onChange, themeColor }: { field: FieldDefinition, value: string, onChange: (v: string) => void, themeColor: string }) => (
  <View className="mb-4">
    <Text style={{ color: themeColor }} className="font-bold text-xs uppercase mb-2 ml-1">
      {field.label} {field.required && '*'}
    </Text>
    <TextInput 
      value={value || ''}
      onChangeText={onChange}
      placeholder={field.placeholder}
      placeholderTextColor="#6b7280"
      className="bg-crescender-900 border border-crescender-800 p-4 rounded-xl text-white text-base"
      keyboardType={field.type === 'number' || field.type === 'currency' ? 'numeric' : 'default'}
      multiline={field.type === 'textarea'}
      textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
      style={field.type === 'textarea' ? { minHeight: 100 } : undefined}
    />
  </View>
);

const DateField = ({ field, value, onChange, themeColor }: { field: FieldDefinition, value: string, onChange: (v: string) => void, themeColor: string }) => {
  const [showPicker, setShowPicker] = useState(false);
  
  // Format for display
  const displayDate = value ? new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric'
  }) : 'Select Date';

  return (
    <View className="mb-4">
      <Text style={{ color: themeColor }} className="font-bold text-xs uppercase mb-2 ml-1">
        {field.label} {field.required && '*'}
      </Text>
      <TouchableOpacity 
        onPress={() => setShowPicker(true)}
        className="bg-crescender-900 border border-crescender-800 p-4 rounded-xl flex-row justify-between items-center"
      >
        <Text className={value ? "text-white text-base" : "text-gray-500 text-base"}>
          {displayDate}
        </Text>
        <Feather name="calendar" size={18} color={themeColor} />
      </TouchableOpacity>
      
      <DatePickerModal 
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
        onDateSelect={(date) => {
          onChange(date);
          setShowPicker(false);
        }}
        selectedDate={value}
      />
    </View>
  );
};

const SelectField = ({ field, value, onChange, themeColor }: { field: FieldDefinition, value: string, onChange: (v: string) => void, themeColor: string }) => (
  <View className="mb-4">
    {field.label && (
      <Text style={{ color: themeColor }} className="font-bold text-xs uppercase mb-4 ml-1">
        {field.label} {field.required && '*'}
      </Text>
    )}
    <View className="gap-3">
      {field.options?.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}1A` } : {}}
            className={`p-4 rounded-xl border flex-row items-center gap-4 ${
              isSelected 
                ? '' 
                : 'bg-crescender-900 border-crescender-800'
            }`}
          >
            {opt.icon && (
               <View 
                 style={isSelected ? { backgroundColor: themeColor } : {}}
                 className={`w-10 h-10 rounded-full items-center justify-center ${
                 isSelected ? '' : 'bg-crescender-800'
               }`}>
                  <Feather name={opt.icon as any} size={20} color={isSelected ? '#2e1065' : themeColor} />
               </View>
            )}
            <Text style={isSelected ? { color: themeColor } : {}} className={`text-lg font-medium ${isSelected ? '' : 'text-white'}`}>
              {opt.label}
            </Text>
            <View className="flex-1" />
            {isSelected && <Feather name="check" size={20} color={themeColor} />}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const ImagePickerField = ({ field, value, onChange, themeColor }: { field: FieldDefinition, value: string[], onChange: (v: string[]) => void, themeColor: string }) => {
  const pickImage = async () => {
    // Request permission if needed (usually managed by Expo automatically for media library)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Start simple
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });

    if (!result.canceled) {
      const uris = result.assets.map(asset => asset.uri);
      const existing = value || [];
      onChange([...existing, ...uris]);
    }
  };

  const removeImage = (index: number) => {
    const existing = value || [];
    onChange(existing.filter((_, i) => i !== index));
  };

  const images = value || [];

  return (
    <View className="mb-4">
      <Text style={{ color: themeColor }} className="font-bold text-xs uppercase mb-2 ml-1">
        {field.label || 'Images'}
      </Text>
      
      <View className="flex-row flex-wrap gap-2">
        {images.map((uri, idx) => (
          <View key={idx} className="w-24 h-24 relative rounded-xl overflow-hidden bg-crescender-900 border border-crescender-800">
            <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
            <TouchableOpacity 
              onPress={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"
            >
              <Feather name="x" size={12} color="white" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity 
          onPress={pickImage}
          className="w-24 h-24 rounded-xl border-dashed border-2 border-crescender-700 items-center justify-center bg-crescender-900/50"
        >
          <Feather name="camera" size={24} color={themeColor} />
          <Text className="text-crescender-400 text-xs mt-1">Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HeaderField = ({ field }: { field: FieldDefinition }) => (
  <View className="mb-4 mt-6 border-b border-crescender-800 pb-2">
    <Text className="text-white text-xl font-bold">{field.label}</Text>
  </View>
);

// --- Main Wizard Component ---

export default function WizardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<any>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [gearOptions, setGearOptions] = useState<any[]>([]);

  // Derived Theme Color
  const themeColor = useMemo(() => {
    return CATEGORY_COLORS[formData.category] || CATEGORY_COLORS.default;
  }, [formData.category]);

  // Load dynamic data (Gear List)
  useEffect(() => {
    const loadData = async () => {
      try {
        const items = await TransactionRepository.getAllGearItems();
        setGearOptions(items.map((i: any) => ({ 
          value: i.id, 
          label: i.label 
        })));
      } catch (e) {
        console.error('Failed to load gear options:', e);
      }
    };
    loadData();
  }, []);

  // Filter visible steps based on conditions
  const visibleSteps = useMemo(() => {
    return MANUAL_ENTRY_SCHEMA.filter(step => 
      !step.condition || step.condition(formData)
    );
  }, [formData]);

  const currentStep = visibleSteps[currentStepIndex];

  // Initialize deafult values
  useEffect(() => {
    const defaults: any = {};
    MANUAL_ENTRY_SCHEMA.forEach(step => {
      step.fields.forEach(field => {
        if (field.defaultValue !== undefined && getNestedValue(formData, field.id) === undefined) {
           // We can't set state in loop easily, so we just check manually
           // This is a simplification
        }
      });
    });
  }, []);

  const handleFieldChange = (path: string, value: any) => {
    setFormData((prev: any) => {
      const newData = setNestedValue(prev, path, value);
      
      // Auto-advance logic for Category step
      if (path === 'category' && currentStepIndex === 0) {
        // We need to wait for state update to settle usually, but here we can just trigger next
        // However, we want the visual feedback. Let's do a small timeout or just relying on user tap is often better?
        // User requested: "Automating progression after a single selection in the category step."
        setTimeout(() => {
            // Check if we are still on step 0 and match the value
            // We use a safe check here
            setCurrentStepIndex(1); // Advance to next
        }, 200);
      }
      
      return newData;
    });
  };

  const validateStep = () => {
    if (!currentStep) return true;
    for (const field of currentStep.fields) {
      if (field.required) {
        const val = getNestedValue(formData, field.id);
        if (!val) {
          Alert.alert('Missing Field', `Please provide a value for ${field.label || 'required fields'}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Last step
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      router.back();
    }
  };

  const handleFinish = async () => {
    if (isCreating) return;
    setIsCreating(true);

    console.log('[Wizard] Finishing with formData:', JSON.stringify(formData, null, 2));

    try {
      const transactionId = Crypto.randomUUID();
      const itemId = Crypto.randomUUID();
      
      // Extract data
      const category = formData.category || 'other';
      const description = formData.description || 'Manual Entry';
      const merchant = formData.merchant || 'Unknown Merchant';
      
      // Handle Date: Prefer selected date, fallback to today
      let date = formData.transactionDate;
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      } else if (date.includes('T')) {
        // If it's a full ISO string (from default value), split it
        date = date.split('T')[0];
      }
      
      // Prepare nested details objects
      // We explicitly access them to ensure they are objects
      const gearDetails = formData.gearDetails || {};
      const educationDetails = formData.educationDetails || {};
      const serviceDetails = formData.serviceDetails || {};
      const eventDetails = formData.eventDetails || {};
      const moneyDetails = formData.moneyDetails || {};

      // Handle Image Uploads (Array of URIs)
      // Save to lineItem images field as JSON
      const imagesRaw = formData.images || [];
      const imagesJson = imagesRaw.length > 0 ? JSON.stringify(
        imagesRaw.map((uri: string) => ({ uri, tag: 'manual', date: new Date().toISOString() }))
      ) : null;

      // Calculate totals
      const priceRaw = parseFloat(formData.totalPrice || '0');
      const priceCents = Math.round(priceRaw * 100);

      // Create Draft
      await TransactionRepository.createDraft({
        id: transactionId,
        merchant,
        merchantAbn: null,
        merchantPhone: null,
        merchantEmail: null,
        merchantWebsite: null,
        merchantAddress: null,
        merchantSuburb: null,
        merchantState: null,
        merchantPostcode: null,
        transactionDate: date,
        total: priceCents,
        subtotal: priceCents,
        tax: 0,
        paymentStatus: 'paid',
        paymentMethod: 'card', 
        summary: description,
        documentType: 'receipt',
        syncStatus: 'pending',
        rawOcrData: JSON.stringify(formData), // Save raw form data for debug
      }, [{
        id: itemId,
        transactionId: transactionId,
        description: description,
        category: category,
        quantity: 1,
        unitPrice: priceCents,
        totalPrice: priceCents,
        images: imagesJson,
        
        // Map top-level specific columns
        brand: formData.brand || null,
        model: formData.model || null,
        serialNumber: formData.serialNumber || null,
        
        // Map event details to notes or extend DB if needed. 
        // For now, if category is Money or Event, store details in notes as well to persist them.
        notes: [
          formData.notes || 'Added via Manual Wizard',
          category === 'money' ? `Money Details: ${JSON.stringify(moneyDetails)}` : '',
          category === 'event' ? `Event Details: ${JSON.stringify(eventDetails)}` : '',
        ].filter(Boolean).join('\n\n'),
        
        // JSON columns (only save if relevant to category to keep DB clean)
        gearDetails: category === 'gear' ? JSON.stringify(gearDetails) : null,
        educationDetails: category === 'education' ? JSON.stringify(educationDetails) : null,
        serviceDetails: category === 'service' ? JSON.stringify(serviceDetails) : null, 
        
        // Map event details to notes or extend DB if needed. 
        // For now, if category is Money, store details in notes as well or a specific field?
        // Current DB schema doesn't have moneyDetails or eventDetails column.
        // We will append to notes for now to persist it.
        // Or store in `gearDetails` if we want to abuse a column, but better to put in notes.
      }]);

      router.replace({
        pathname: '/review',
        params: { 
          transactionId: transactionId,
          forceMonolithic: 'true' 
        }
      });
    } catch (e) {
      console.error('Failed to save wizard entry:', e);
      Alert.alert('Error', 'Failed to save entry.');
      setIsCreating(false);
    }
  };

  if (!currentStep) return null; // Should not happen

  return (
    <View className="flex-1 bg-crescender-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 10 }} className="px-4 pb-4 border-b border-crescender-800 flex-row items-center justify-between">
          <TouchableOpacity onPress={handleBack} className="p-2">
            <Feather name="chevron-left" size={24} color={themeColor} />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">Manual Entry</Text>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="h-1 bg-crescender-900 w-full flex-row">
           {visibleSteps.map((_, idx) => (
             <View key={idx} 
               style={{ backgroundColor: idx <= currentStepIndex ? themeColor : 'transparent' }}
               className="flex-1 h-full mx-[1px]" 
             />
           ))}
        </View>
        
        <ScrollView className="flex-1 p-6" keyboardShouldPersistTaps="handled">
          <Text className="text-crescender-400 font-bold uppercase tracking-widest text-xs mb-1">
            Step {currentStepIndex + 1} of {visibleSteps.length}
          </Text>
          <Text className="text-white text-3xl font-bold mb-2 leading-tight">
            {currentStep.title}
          </Text>
          {currentStep.description && (
            <Text className="text-crescender-300 text-base mb-8">
              {currentStep.description}
            </Text>
          )}

          <View className="mt-4 pb-20">
            {currentStep.fields.map(field => {
              // Check field-level condition
              if (field.condition && !field.condition(formData)) return null;

              const val = getNestedValue(formData, field.id);

              switch (field.type) {
                case 'select':
                  // Inject gear options if it's the specific field
                  const fieldWithOptions = field.id === 'serviceDetails.relatedGearId' 
                    ? { ...field, options: gearOptions } 
                    : field;
                    
                  return (
                    <SelectField 
                      key={field.id}
                      field={fieldWithOptions} 
                      value={val} 
                      onChange={(v) => handleFieldChange(field.id, v)} 
                      themeColor={themeColor}
                    />
                  );
                case 'date':
                   return (
                    <DateField 
                      key={field.id}
                      field={field} 
                      value={val} 
                      onChange={(v) => handleFieldChange(field.id, v)} 
                      themeColor={themeColor}
                    />
                   );
                case 'image':
                   return (
                     <ImagePickerField 
                       key={field.id}
                       field={field}
                       value={val}
                       onChange={(v) => handleFieldChange(field.id, v)}
                       themeColor={themeColor}
                     />
                   );
                case 'header':
                   return <HeaderField key={field.id} field={field} />;
                case 'currency':
                case 'number':
                case 'text':
                case 'textarea':
                default:
                  return (
                    <TextField 
                      key={field.id}
                      field={field} 
                      value={val} 
                      onChange={(v) => handleFieldChange(field.id, v)} 
                      themeColor={themeColor}
                    />
                  );
              }
            })}
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View 
          style={{ paddingBottom: insets.bottom + 10 }}
          className="p-4 bg-crescender-950 border-t border-crescender-800"
        >
          <TouchableOpacity 
            onPress={handleNext}
            style={{ backgroundColor: themeColor }}
            className="w-full p-4 rounded-xl items-center flex-row justify-center gap-2"
          >
            <Text className="text-crescender-950 font-bold text-lg">
              {currentStepIndex === visibleSteps.length - 1 
                ? (isCreating ? 'Saving...' : 'Review & Finish') 
                : 'Continue'}
            </Text>
            {currentStepIndex < visibleSteps.length - 1 && (
               <Feather name="arrow-right" size={20} color="#2e1065" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}


