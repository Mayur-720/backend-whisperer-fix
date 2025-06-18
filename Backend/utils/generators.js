
// Backend/utils/generators.js

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

const generateAnonymousAlias = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}`;
};

const generateAvatar = () => {
  return avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
};

module.exports = {
  generateAnonymousAlias,
  generateAvatar
};
