export const mockUser = {
  display_name: "Rafael W",
  avatar: "",
  followers: 42,
  following: 128,
  playlists_count: 23,
  member_since: "2018",
};

export const mockTopArtists = [
  { id: 1, name: "The Weeknd", image: "", genres: ["R&B", "Pop"], plays: 892 },
  { id: 2, name: "Stromae", image: "", genres: ["Electronic", "Hip Hop"], plays: 654 },
  { id: 3, name: "RÜFÜS DU SOL", image: "", genres: ["Electronic", "Indie Dance"], plays: 521 },
  { id: 4, name: "Daft Punk", image: "", genres: ["Electronic", "French House"], plays: 487 },
  { id: 5, name: "Arctic Monkeys", image: "", genres: ["Indie Rock", "Alternative"], plays: 445 },
  { id: 6, name: "Tame Impala", image: "", genres: ["Psychedelic", "Indie"], plays: 398 },
  { id: 7, name: "Frank Ocean", image: "", genres: ["R&B", "Soul"], plays: 367 },
  { id: 8, name: "Tyler, The Creator", image: "", genres: ["Hip Hop", "Rap"], plays: 334 },
];

export const mockTopTracks = [
  { id: 1, name: "Ma Meilleure Ennemie", artist: "Stromae", album: "Multitude", plays: 151, duration: "3:24" },
  { id: 2, name: "Blinding Lights", artist: "The Weeknd", album: "After Hours", plays: 143, duration: "3:20" },
  { id: 3, name: "Innerbloom", artist: "RÜFÜS DU SOL", album: "Bloom", plays: 128, duration: "9:38" },
  { id: 4, name: "Do I Wanna Know?", artist: "Arctic Monkeys", album: "AM", plays: 119, duration: "4:32" },
  { id: 5, name: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories", plays: 112, duration: "6:09" },
  { id: 6, name: "Let It Happen", artist: "Tame Impala", album: "Currents", plays: 105, duration: "7:47" },
  { id: 7, name: "Nights", artist: "Frank Ocean", album: "Blonde", plays: 98, duration: "5:07" },
  { id: 8, name: "NEW MAGIC WAND", artist: "Tyler, The Creator", album: "IGOR", plays: 91, duration: "3:15" },
];

export const mockRecentTracks = [
  { id: 1, name: "Save Your Tears", artist: "The Weeknd", played_at: "2 min ago" },
  { id: 2, name: "Papaoutai", artist: "Stromae", played_at: "8 min ago" },
  { id: 3, name: "Alive", artist: "RÜFÜS DU SOL", played_at: "15 min ago" },
  { id: 4, name: "Instant Crush", artist: "Daft Punk", played_at: "22 min ago" },
  { id: 5, name: "505", artist: "Arctic Monkeys", played_at: "30 min ago" },
];

export const mockPlaylists = [
  { id: 1, name: "Late Night Vibes", tracks: 47, image: "" },
  { id: 2, name: "Workout Energy", tracks: 32, image: "" },
  { id: 3, name: "Chill Electronic", tracks: 64, image: "" },
  { id: 4, name: "Indie Discoveries", tracks: 28, image: "" },
  { id: 5, name: "Road Trip Mix", tracks: 55, image: "" },
  { id: 6, name: "Focus Mode", tracks: 41, image: "" },
];

export const mockWrappedData = {
  totalMinutes: 48729,
  totalTracks: 3421,
  totalArtists: 287,
  topGenres: ["Electronic", "R&B", "Indie Rock", "Pop", "Hip Hop"],
  audioFeatures: {
    energy: 72,
    danceability: 68,
    valence: 55,
    acousticness: 32,
  },
  artistTrends: [
    { name: "The Weeknd", monthlyPlays: [45, 52, 78, 92, 110, 98, 87, 102, 95, 88, 72, 65] },
    { name: "RÜFÜS DU SOL", monthlyPlays: [30, 35, 40, 55, 60, 72, 85, 90, 78, 65, 50, 42] },
  ],
  topTrack: {
    name: "Ma Meilleure Ennemie",
    artist: "Stromae",
    firstPlayed: "January 14, 2025",
    totalMinutes: 512,
  },
  moodClub: {
    name: "Soft Hearts Club",
    description: "You vibed with emotional, introspective tracks that hit right in the feels.",
    emoji: "💜",
  },
};

export const authMethods = ["google", "facebook", "apple", "phone", "email"] as const;
export type AuthMethod = (typeof authMethods)[number];
