# BuddyChat

A single-file PWA that blends the core of WhatsApp, Instagram and Snapchat
(minus Reels and Channels) into one installable web app.

```
BuddyChat/
├── index.html        ← the entire app (UI + logic)
├── config.js         ← Firebase + VAPID + AI-proxy config
├── sw.js             ← service worker (offline shell + push)
├── manifest.json     ← PWA manifest
├── icons/            ← 72 / 96 / 128 / 192 / 512 / maskable
├── assets/
│   ├── sounds/       ← drop send.mp3, recv.mp3, call.mp3, story.mp3 here
│   ├── bg/           ← optional chat wallpapers
│   └── fonts/        ← optional self-hosted fonts
└── README.md
```

## 1. Run locally

Service workers and Firebase Auth require a real origin. From the folder root:

```
npx serve .          # or:  python3 -m http.server 8080
```

then open `http://localhost:3000/` (or `:8080/`). On first load you'll be
prompted to sign in.

## 2. Configure Firebase

1. Create a Firebase project → add a **Web app**.
2. Enable **Authentication → Google** and **Email/Password**.
3. Enable **Firestore** (production mode) and **Storage**.
4. Enable **Cloud Messaging** and copy the Web-Push **VAPID key**.
5. Paste all values into `config.js`.

### Firestore rules (minimum)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    match /users/{uid} {
      allow read: if signedIn();
      allow write: if signedIn() && request.auth.uid == uid;
    }
    match /chats/{cid} {
      allow read, write: if signedIn() && request.auth.uid in resource.data.members;
      allow create: if signedIn() && request.auth.uid in request.resource.data.members;
      match /messages/{mid} {
        allow read, write: if signedIn();
      }
    }
    match /stories/{sid} {
      allow read: if signedIn();
      allow create: if signedIn() && request.auth.uid == request.resource.data.authorId;
      allow update, delete: if signedIn() && request.auth.uid == resource.data.authorId;
    }
    match /calls/{cid} {
      allow read, write: if signedIn();
    }
    match /fcmTokens/{uid} {
      allow read, write: if signedIn() && request.auth.uid == uid;
    }
  }
}
```

### Storage rules (minimum)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /media/{uid}/{file=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## 3. Protected AI key (Firebase Cloud Function)

Never ship your AI provider key to the browser. Deploy a tiny proxy:

```js
// functions/index.js
const functions = require("firebase-functions");
const fetch = (...a) => import("node-fetch").then(({default:f}) => f(...a));

exports.aiProxy = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Sign in");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.AI_KEY}`, // set with: firebase functions:secrets:set AI_KEY
    },
    body: JSON.stringify({ model: "gpt-4o-mini", messages: data.messages }),
  });
  return await r.json();
});
```

Set the secret and deploy:

```
firebase functions:secrets:set AI_KEY
firebase deploy --only functions
```

Paste the resulting URL into `config.js → aiProxyUrl`.

## 4. Push notifications

`sw.js` already handles `push` and `notificationclick`. The app requests
permission on first sign-in and registers an FCM token under
`fcmTokens/{uid}`. Send notifications from your server with the FCM HTTP
v1 API to that token.

## 5. Feature list (100+)

Auth & profile (1–12): Google sign-in · Email sign-up with required phone
number · Email verification gate · Display name · Avatar upload · About
text · Last-seen tracking · Online presence · Profile glow that reacts to
behaviour (active = green pulse, social = blue, quiet = dim) · Theme
toggle · Density toggle · Sign out.

Chat (13–34): 1-to-1 chats · Group chats · Realtime sync · Read receipts
(✓ / ✓✓) · Typing indicator · Reply-to-message · Forward · Delete for me /
delete for everyone · Edit message · Star / pin · Search messages · Mute
chat · Archive · Mark unread · Wallpaper picker · Font size · Bubble
colours · Link preview · Mentions in groups · Reactions (❤ 👍 😂 😮 😢 🙏)
· Code-block formatting · Voice note recording with waveform.

Media (35–58): Photo capture · Video capture (up to 60 s) · Gallery picker
· Audio note · File attach · Image editor (crop, rotate, brightness,
contrast, saturate, blur, sepia, grayscale) · Video editor (trim, mute,
playback rate) · Audio editor (trim, gain) · Filters · Stickers · Text
overlay · Drawing · Compression before upload · Firebase Storage upload
with progress · Thumbnail cache · Download to device · View-once mode ·
Disappearing media · Quality picker · EXIF strip · Long-press preview ·
Pinch-zoom viewer · Swipe-to-dismiss viewer · Per-chat media gallery.

Stories (59–72): 24-h auto-expire · Photo / video / text stories ·
Background gradients · Music sticker stub · Mentions · Polls · Questions ·
Quick reactions · Reply to story (DM) · Viewer list · **Only people who
*missed* your story can see it later** (toggleable per story) · Close
friends · Highlights · Mute author.

Calls (73–86): 1-to-1 audio call via WebRTC · 1-to-1 video call via
WebRTC · Mute mic · Toggle camera · Switch front/back camera · Hang up ·
Incoming-call ringer · Outgoing ringtone · Call accept/decline · Call
history · Missed-call badge · Picture-in-picture stub · Speaker toggle ·
Bluetooth route hint.

Social (87–94): Followers / following · Public profile page · DM from
profile · Block user · Report user · Suggested friends · Activity feed ·
Discover.

Platform (95–108): Installable PWA · Offline shell (service worker) ·
Push notifications (FCM) · In-app notification toasts · Sound effects
(send / receive / call / story) · Vibration API for Android · iOS haptics
via Taptic patterns where available · App badge (where supported) ·
Share-target manifest hook · Shortcuts (New chat / Stories / Camera) ·
Maskable icon · Splash colours · Dark theme · A11y labels.

> Some items are intentionally lightweight stubs (e.g. in-call PiP, music
> sticker, sub-second video trimming) so the file stays a single shippable
> page. Each stub is clearly marked in the source and is structured so you
> can extend it without re-plumbing the surrounding feature.

## 6. Optional assets

Drop the following into `assets/sounds/` and they'll be picked up automatically:

* `send.mp3` — short click for outgoing messages
* `recv.mp3` — soft chime for incoming
* `call.mp3` — ringtone (looped)
* `story.mp3` — story-posted ping

Wallpapers in `assets/bg/` appear in the chat-wallpaper picker.

## 7. License

MIT — fork freely.
