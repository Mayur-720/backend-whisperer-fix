const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please add a username"],
    unique: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: [true, "Please add your full name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpire: {
    type: Date,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
  anonymousAlias: { type: String, unique: true },
  avatarEmoji: { type: String },
  referralCode: { type: String, unique: true },
  referralCount: { type: Number, default: 0 },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  ghostCircles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GhostCircle",
    },
  ],
  recognizedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  identityRecognizers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  recognitionAttempts: { type: Number, default: 0 },
  successfulRecognitions: { type: Number, default: 0 },
  recognitionRevocations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  bio: { type: String, default: "" },
  claimedRewards: [
    {
      tierLevel: { type: Number, required: true },
      rewardType: {
        type: String,
        enum: ["badge", "cash", "premium"],
        required: true,
      },
      rewardDescription: { type: String, required: true },
      status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending",
      },
      claimedAt: { type: Date, default: Date.now },
      paymentDetails: { type: String },
    },
  ],
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: false,
  },
  interests: {
    type: [String],
    default: [],
  },
  premiumMatchUnlocks: {
    type: Number,
    default: 0,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationOTP: {
    type: String,
  },
  emailVerificationOTPExpire: {
    type: Date,
  },
});

// Generate unique anonymous alias
userSchema.methods.generateAnonymousAlias = async function () {
  const adjectives = [
    "Shadow", "Neon", "Phantom", "Mystic", "Ghost", "Cosmic", "Stealth", "Hidden", "Secret", "Enigma",
    "Veiled", "Cryptic", "Silent", "Echo", "Dusk", "Twilight", "Starlit", "Gloom", "Frost", "Ember",
    "Void", "Nebula", "Aurora", "Lunar", "Solar", "Drift", "Haze", "Mist", "Glimmer", "Shade",
    "Specter", "Wraith", "Chroma", "Velvet", "Obsidian", "Sapphire", "Emerald", "Ruby", "Onyx", "Quartz",
    "Dagger", "Cloak", "Vapor", "Ash", "Flame", "Tide", "Storm", "Thunder", "Lightning", "Breeze",
    "Raven", "Falcon", "Owl", "Hawk", "Eagle", "Sparrow", "Crow", "Dove", "Swan", "Phoenix",
    "Serpent", "Dragon", "Wyrm", "Griffin", "Sphinx", "Chimera", "Basilisk", "Hydra", "Kraken", "Leviathan",
    "Wolf", "Fox", "Lynx", "Panther", "Tiger", "Lion", "Bear", "Stag", "Elk", "Moose",
    "Viper", "Cobra", "Python", "Scorpion", "Spider", "Hornet", "Wasp", "Beetle", "Mantis", "Locust",
    "Comet", "Meteor", "Galaxy", "Orbit", "Nexus", "Pulse", "Quantum", "Radiant", "Ethereal", "Celestial",
  ];

  const nouns = [
    "Fox", "Wolf", "Spirit", "Specter", "Raven", "Whisperer", "Phantom", "Ghost", "Shadow", "Guardian",
    "Knight", "Wanderer", "Sage", "Seer", "Oracle", "Prophet", "Mystic", "Shaman", "Druid", "Bard",
    "Rogue", "Assassin", "Hunter", "Tracker", "Scout", "Ranger", "Warrior", "Paladin", "Sorcerer", "Wizard",
    "Star", "Moon", "Sun", "Dawn", "Dusk", "Night", "Day", "Sky", "Cloud", "Storm",
    "Tide", "Wave", "Current", "Stream", "River", "Lake", "Ocean", "Sea", "Island", "Shore",
    "Flame", "Ember", "Spark", "Blaze", "Fire", "Ash", "Smoke", "Mist", "Fog", "Haze",
    "Blade", "Sword", "Dagger", "Axe", "Spear", "Bow", "Shield", "Armor", "Helm", "Cloak",
    "Path", "Trail", "Road", "Journey", "Quest", "Voyage", "Odyssey", "Trek", "Venture", "Pilgrim",
    "Echo", "Chime", "Pulse", "Rhythm", "Harmony", "Melody", "Song", "Hymn", "Ballad", "Dirge",
    "Peak", "Ridge", "Cliff", "Valley", "Canyon", "Forest", "Grove", "Meadow", "Plain", "Desert",
  ];

  const maxAttempts = 10;
  let attempt = 0;
  let alias;

  while (attempt < maxAttempts) {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    alias = `${randomAdjective}${randomNoun}`;

    const existingUser = await this.model("User").findOne({ anonymousAlias: alias });
    if (!existingUser) {
      this.anonymousAlias = alias;
      return alias;
    }
    attempt++;
  }

  const randomNum = Math.floor(Math.random() * 10000);
  alias = `${alias}${randomNum}`;
  this.anonymousAlias = alias;
  return alias;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

// Generate random avatar emoji
const avatarEmojis = [
  "🎭", "👻", "🕶️", "🦊", "🐺", "🦉", "🦅", "🦇", "🐲",
  "🌑", "✨", "💫", "⚡", "🔮", "🎪", "🎯", "🎲", "🃏",
  "🦹", "🥷", "👤", "👥", "🕵️", "🧙", "🧠", "👁️", "💭",
  "🌟", "🌙", "🌞", "🌈", "🍀", "🎃", "🎄", "🎆", "🎇",
  "🏹", "🛡️", "⚔️", "🔥", "💧", "🌊", "🌪️", "❄️", "🍁",
  "🐴", "🐘", "🐆", "🐍", "🦎", "🦂", "🕸️", "🐝", "🐞",
  "🚀", "🌌", "🪐", "☄️", "🌠", "💎", "🎸", "🎹", "🎻",
];

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  if (!this.avatarEmoji) {
    const randomIndex = Math.floor(Math.random() * avatarEmojis.length);
    this.avatarEmoji = avatarEmojis[randomIndex];
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
