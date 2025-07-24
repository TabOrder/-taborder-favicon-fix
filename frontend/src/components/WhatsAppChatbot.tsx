import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  CardHeader,
  Badge,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Send as SendIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  School as SchoolIcon,
} from '@mui/icons-material';

// Interfaces
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type: 'text' | 'quick_reply' | 'faq' | 'onboarding';
  quickReplies?: string[];
  faqData?: FAQItem;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'orders' | 'payments' | 'inventory' | 'onboarding';
  keywords: string[];
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: string;
}

interface WhatsAppChatbotProps {
  vendorData?: {
    name: string;
    email: string;
    phone: string;
    business_name: string;
  };
  onClose?: () => void;
  isOpen?: boolean;
}

const WhatsAppChatbot: React.FC<WhatsAppChatbotProps> = ({
  vendorData,
  onClose,
  isOpen = false,
}) => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // FAQ Database
  const faqDatabase: FAQItem[] = [
    {
      id: '1',
      question: 'How do I add new products to my inventory?',
      answer: 'Go to Inventory → Add New Item. Fill in product details including name, category, price, and quantity. Click "Add Stock Item" to save.',
      category: 'inventory',
      keywords: ['add', 'product', 'inventory', 'new', 'item'],
    },
    {
      id: '2',
      question: 'How do I update order status?',
      answer: 'Go to Orders → Find the order → Click "View Details" → Use the status buttons (Mark as Packed, Mark as Fulfilled) to update.',
      category: 'orders',
      keywords: ['order', 'status', 'update', 'packed', 'fulfilled'],
    },
    {
      id: '3',
      question: 'How do I set up WhatsApp notifications?',
      answer: 'Go to Settings → Notification Preferences → Toggle "WhatsApp Notifications" to ON. Make sure your phone number is correct.',
      category: 'general',
      keywords: ['whatsapp', 'notification', 'setup', 'phone'],
    },
    {
      id: '4',
      question: 'How do I calculate my profit margins?',
      answer: 'The system automatically calculates margins: (Retail Price - Wholesale Price) / Retail Price × 100. View in Inventory table under "Margin %".',
      category: 'inventory',
      keywords: ['profit', 'margin', 'calculate', 'wholesale', 'retail'],
    },
    {
      id: '5',
      question: 'How do I sync with USSD menu?',
      answer: 'Your products automatically sync with USSD when you add/update them. Changes appear in USSD within 2-3 minutes.',
      category: 'general',
      keywords: ['sync', 'ussd', 'menu', 'automatic'],
    },
    {
      id: '6',
      question: 'How do I handle customer complaints?',
      answer: '1. Listen to the customer\n2. Apologize if needed\n3. Offer solutions (refund, replacement, discount)\n4. Update order status accordingly\n5. Document the issue',
      category: 'orders',
      keywords: ['complaint', 'customer', 'refund', 'replacement'],
    },
    {
      id: '7',
      question: 'How do I set up bank details for payments?',
      answer: 'Go to Settings → Business Information → Enter your bank account details in the "Bank Details" field. This is used for payout processing.',
      category: 'payments',
      keywords: ['bank', 'details', 'payment', 'payout', 'account'],
    },
    {
      id: '8',
      question: 'How do I track my earnings?',
      answer: 'View your earnings on the Dashboard. You can see daily earnings, total earnings, and detailed breakdowns in the Analytics section.',
      category: 'payments',
      keywords: ['earnings', 'track', 'money', 'income', 'revenue'],
    },
  ];

  // Onboarding Steps
  const onboardingSteps: OnboardingStep[] = [
    {
      id: '1',
      title: 'Welcome to TabOrder! 🎉',
      description: 'Let\'s get your business set up in 5 minutes. I\'ll guide you through everything you need to know.',
      completed: false,
    },
    {
      id: '2',
      title: 'Add Your First Products 📦',
      description: 'Start by adding 5-10 essential products. Focus on your best-selling items first.',
      completed: false,
      action: 'Go to Inventory',
    },
    {
      id: '3',
      title: 'Set Up Notifications 🔔',
      description: 'Enable WhatsApp notifications to get instant alerts for new orders.',
      completed: false,
      action: 'Go to Settings',
    },
    {
      id: '4',
      title: 'Test USSD Sync 📱',
      description: 'Verify your products appear in the USSD menu for customers.',
      completed: false,
      action: 'Test USSD',
    },
    {
      id: '5',
      title: 'You\'re Ready! 🚀',
      description: 'Your TabOrder business is now live! Start receiving orders and growing your business.',
      completed: false,
    },
  ];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (chatOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        text: `Hello ${vendorData?.name || 'Vendor'}! 👋\n\nI'm your TabOrder assistant. How can I help you today?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'text',
        quickReplies: ['Help with Orders', 'Inventory Questions', 'Payment Issues', 'Onboarding Guide', 'FAQ'],
      };
      setMessages([welcomeMessage]);
    }
  }, [chatOpen, vendorData?.name]);

  // Simulate typing indicator
  const simulateTyping = async (callback: () => void) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    setIsTyping(false);
    callback();
  };

  // Process user input and generate bot response
  const processUserInput = async (input: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMessage]);

    // Find relevant FAQ
    const relevantFAQ = faqDatabase.find(faq =>
      faq.keywords.some(keyword =>
        input.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    await simulateTyping(() => {
      let botResponse: ChatMessage;

      if (input.toLowerCase().includes('faq') || input.toLowerCase().includes('help')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: 'Here are some frequently asked questions:',
          sender: 'bot',
          timestamp: new Date(),
          type: 'faq',
          faqData: relevantFAQ,
        };
      } else if (input.toLowerCase().includes('onboarding') || input.toLowerCase().includes('setup')) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: 'Let me guide you through the onboarding process:',
          sender: 'bot',
          timestamp: new Date(),
          type: 'onboarding',
        };
      } else if (relevantFAQ) {
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: `**${relevantFAQ.question}**\n\n${relevantFAQ.answer}`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'text',
          quickReplies: ['More Help', 'Onboarding Guide', 'Contact Support'],
        };
      } else {
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: 'I understand you\'re asking about "' + input + '". Let me help you find the right information. What specific area do you need help with?',
          sender: 'bot',
          timestamp: new Date(),
          type: 'text',
          quickReplies: ['Orders', 'Inventory', 'Payments', 'Settings', 'FAQ'],
        };
      }

      setMessages(prev => [...prev, botResponse]);
    });
  };

  // Handle quick reply clicks
  const handleQuickReply = (reply: string) => {
    setInputText(reply);
    processUserInput(reply);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (inputText.trim()) {
      processUserInput(inputText.trim());
      setInputText('');
    }
  };

  // Handle Enter key
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Render quick replies
  const renderQuickReplies = (replies: string[]) => (
    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {replies.map((reply, index) => (
        <Chip
          key={index}
          label={reply}
          size="small"
          variant="outlined"
          onClick={() => handleQuickReply(reply)}
          sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'primary.light', color: 'white' } }}
        />
      ))}
    </Box>
  );

  // Render FAQ section
  const renderFAQSection = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">📚 Frequently Asked Questions</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {faqDatabase.map((faq) => (
            <ListItem key={faq.id} divider>
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={faq.question}
                secondary={faq.answer}
                primaryTypographyProps={{ fontWeight: 'bold' }}
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );

  // Render onboarding guide
  const renderOnboardingGuide = () => (
    <Card>
      <CardHeader title="🚀 Onboarding Guide" />
      <CardContent>
        <List>
          {onboardingSteps.map((step, index) => (
            <ListItem key={step.id}>
              <ListItemIcon>
                <Avatar sx={{ bgcolor: step.completed ? 'success.main' : 'grey.300' }}>
                  {step.completed ? '✓' : index + 1}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={step.title}
                secondary={step.description}
              />
              {step.action && (
                <Button size="small" variant="outlined">
                  {step.action}
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  // Main chat interface
  const renderChatInterface = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'success.main', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <WhatsAppIcon sx={{ mr: 1 }} />
            <Typography variant="h6">TabOrder Support</Typography>
          </Box>
          <Box>
            <IconButton color="inherit" onClick={() => setShowFAQ(!showFAQ)}>
              <HelpIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setShowOnboarding(!showOnboarding)}>
              <SchoolIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setChatOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Chat Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: message.sender === 'user' ? 'primary.main' : 'white',
                color: message.sender === 'user' ? 'white' : 'text.primary',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {message.text}
              </Typography>
              {message.quickReplies && renderQuickReplies(message.quickReplies)}
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}
        
        {isTyping && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Box display="flex" alignItems="center">
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Typing...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Box display="flex" alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={3}
            sx={{ mr: 1 }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  // Floating chat button
  const renderFloatingButton = () => (
    <Fade in={!chatOpen}>
      <Zoom in={!chatOpen}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          <Tooltip title="Chat with TabOrder Support">
            <IconButton
              onClick={() => setChatOpen(true)}
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                width: 60,
                height: 60,
                '&:hover': {
                  bgcolor: 'success.dark',
                },
                boxShadow: 3,
              }}
            >
              <Badge badgeContent={1} color="error">
                <WhatsAppIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
      </Zoom>
    </Fade>
  );

  // Main component render
  return (
    <>
      {renderFloatingButton()}
      
      {chatOpen && (
        <Dialog
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              height: '80vh',
              maxHeight: '600px',
            },
          }}
        >
          {renderChatInterface()}
        </Dialog>
      )}

      {/* FAQ Dialog */}
      <Dialog
        open={showFAQ}
        onClose={() => setShowFAQ(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📚 FAQ & Help Center</DialogTitle>
        <DialogContent>
          {renderFAQSection()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFAQ(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Onboarding Dialog */}
      <Dialog
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>🚀 Onboarding Guide</DialogTitle>
        <DialogContent>
          {renderOnboardingGuide()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOnboarding(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default WhatsAppChatbot; 