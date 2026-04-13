export const knowledgeBase = [
  {
    keywords: ['hi', 'hello', 'hey', 'start', 'help'],
    answer: "Hello! I'm NestAI, your CloudNest assistant. How can I help you today? You can ask me about security, pricing, or our cloud features!"
  },
  {
    keywords: ['security', 'safe', 'protect', 'secure', 'hashed', 'encryption'],
    answer: "CloudNest uses enterprise-grade security. We protect your account with bcrypt-hashed 6-digit PINs, automatic account lockout after 5 failed attempts, and secure JWT-based sessions. Your files are encrypted at rest in AWS S3."
  },
  {
    keywords: ['pin', '6 digit', 'six digit', 'security pin'],
    answer: "Every Administrator account requires a 6-digit Security PIN for access. You can set or update your PIN in the Settings page. If you forget it, please contact your system super-admin."
  },
  {
    keywords: ['otp', 'sms', 'phone', 'verify', 'verification'],
    answer: "We use SMS OTP (One-Time Password) to verify your phone number. This is required for 2FA and sensitive account alerts. You can trigger a verification SMS from your Settings page."
  },
  {
    keywords: ['price', 'pricing', 'cost', 'plan', 'plans', 'free', 'pro', 'enterprise'],
    answer: "We offer three tiers: \n1. **Free**: 2GB storage, 5MB file limit.\n2. **Pro ($9/mo)**: 50GB storage, 25MB file limit.\n3. **Enterprise ($49/mo)**: Unlimited storage and priority 24/7 support."
  },
  {
    keywords: ['upload', 'file', 'limit', 'size', 'pdf', 'image'],
    answer: "You can upload Images (JPEG, PNG, WEBP, GIF) and PDFs up to 10MB each. Use the Dashboard or Storage page to drag and drop your files."
  },
  {
    keywords: ['analytics', 'chart', 'usage', 'storage info'],
    answer: "The Dashboard provides real-time analytics on your storage usage, breaking down your data by cloud provider and file types so you can manage your space efficiently."
  },
  {
    keywords: ['who are you', 'what is this', 'about'],
    answer: "I am NestAI, the virtual assistant for CloudNest (formerly CloudVault). We provide secure, high-performance cloud storage solutions with advanced administrator controls."
  }
];

export const fallbackResponse = "I'm not quite sure about that yet. Could you try asking about 'security', 'pricing', or 'how to upload'? You can also contact support if you need human help!";
