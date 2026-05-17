// BuddyChat — Firebase configuration
// ⚠️ Replace these placeholders with the values from your Firebase project:
//    Firebase Console → Project settings → General → Your apps → Web app config
// Then enable in Firebase:
//   • Authentication → Sign-in method → Google + Email/Password
//   • Firestore Database (in production mode, then paste rules below)
//   • Storage (paste rules below)
//   • Cloud Messaging (copy the Web Push certificate "VAPID key")
//
// The AI API key is NEVER shipped in this file. Calls to your AI provider
// must go through a Firebase Cloud Function (see README.md → "Protected AI key").

window.BUDDYCHAT_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDnBayCk5Kkj4Qbq9EC-GIWsuWnacllTqI",
    authDomain: "buddy-chat1.firebaseapp.com",
    projectId: "buddy-chat1",
    storageBucket: "buddy-chat1.appspot.com",
    messagingSenderId: "315056860700",
    appId: "1:315056860700:web:6be1541d2f35d6be4a79d9",
    measurementId: "G-EQ5BP5FPVK"
  },

  // Web Push VAPID key (Cloud Messaging → Web configuration)
  vapidKey: "BOmKnEkLp0O0B-CHUosFAhjY26RDwAQ-4U9Ku5SUrA_HmUe7OmgWDx1Gh0cM4Y29jirUIlKKpzPJMesUmnKWNfQ",

  // URL of your deployed Firebase Cloud Function that proxies AI requests.
  // The function is the only place that knows the real AI API key.
  aiProxyUrl: "https://REGION-PROJECT.cloudfunctions.net/aiProxy",

  // Public STUN servers for WebRTC (add TURN for production NAT traversal).
  rtcIceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ],
};
