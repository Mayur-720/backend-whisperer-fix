
// Generate random nicknames and avatars for anonymous users

// List of adjectives for random nicknames
const adjectives = [
  "Shadow", "Neon", "Cosmic", "Phantom", "Ghost", 
  "Hidden", "Secret", "Mystic", "Cyber", "Silent", 
  "Stealth", "Masked", "Obscure", "Enigma", "Veiled", 
  "Covert", "Shrouded", "Disguised", "Cryptic", "Anonymous"
];

// List of nouns for random nicknames
const nouns = [
  "Fox", "Wolf", "Raven", "Specter", "Whisper", 
  "Ghost", "Phantom", "Shadow", "Spirit", "Wanderer", 
  "Voyager", "Hunter", "Stalker", "Watcher", "Observer", 
  "Guardian", "Sentinel", "Keeper", "Walker", "Drifter"
];

const avatarEmojis = [
  "🎭", "👻", "🕶️", "🦊", "🐺", "🦉", "🦅", "🦇", "🐲", 
  "🌑", "✨", "💫", "⚡", "🔮", "🎪", "🎯", "🎲", "🃏", 
  "🦹", "🥷", "👤", "👥", "🕵️", "🧙", "🧠", "👁️", "💭"
];

export const getRandomEmoji = (): string => {
  return avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
};

export const generateNickname = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}`;
};

// Generate random color from our theme
export const getRandomColor = (): string => {
  const colors = [
    "#8B5CF6", // Primary purple
    "#9b87f5", // Light purple
    "#7E69AB", // Medium purple
    "#6E59A5", // Deep purple
    "#D6BCFA", // Soft purple
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const generateIdentity = () => {
  return {
    nickname: generateNickname(),
    emoji: getRandomEmoji(),
    color: getRandomColor(),
  };
};

// Mock data for development
export const generateMockPosts = (count: number = 10) => {
  const posts = [];
  
  const mockContent = [
    "Just saw the craziest thing in the library today...",
    "Does anyone else feel like professors assign work without talking to each other?",
    "That party last night was legendary 🔥",
    "Hot take: Coffee is overrated. Tea is superior.",
    "When you finally understand that algorithm that's been bugging you all week 🤯",
    "Unpopular opinion: Pineapple DOES belong on pizza.",
    "Thinking of dropping out and starting a cat café. Who's in?",
    "Why do we have to learn calculus when I'm a design major?",
    "I've been keeping a secret... I actually HATE TikTok 🙊",
    "Just submitted an assignment 2 minutes before the deadline. Living on the edge.",
    "Is it just me or is the dining hall food getting worse?",
    "Someone left their notes in the lecture hall and I need to find them!",
    "I think my roommate is a vampire. They're never awake during daylight hours.",
    "Does anyone actually read the terms and conditions?",
    "I miss the early days of the internet when everything wasn't trying to sell you something.",
    "Just realized I've been wearing my shirt inside out all day.",
    "Can't believe I just saw the dean dancing at the club last night.",
    "Thinking about skipping class tomorrow. Anyone want to hit the beach?",
    "Pulling an all-nighter for this exam. Send good vibes ✨",
    "Why is the campus WiFi always so terrible when I actually need to get work done?"
  ];
  
  const timePeriods = [
    "Just now",
    "2 min ago",
    "5 min ago",
    "15 min ago",
    "30 min ago",
    "1 hour ago",
    "2 hours ago",
    "5 hours ago",
    "Yesterday"
  ];
  
  for (let i = 0; i < count; i++) {
    const identity = generateIdentity();
    posts.push({
      id: `post-${i}`,
      content: mockContent[Math.floor(Math.random() * mockContent.length)],
      time: timePeriods[Math.floor(Math.random() * timePeriods.length)],
      likes: Math.floor(Math.random() * 50),
      comments: Math.floor(Math.random() * 20),
      identity,
      clueCount: Math.floor(Math.random() * 3)
    });
  }
  
  return posts;
};
