/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Card {
  id: string;
  word: string; // The primary guess word in Bangla
  englishTranslit: string; // Dynamic english phonetic pronunciation or translation
  tabooWords: string[]; // Avoid mentioning these words during game
  category: string; // Category keyword
  funHint: string; // A humorous hint in Bangla/English
}

export interface Category {
  id: string;
  nameBangla: string;
  nameEnglish: string;
  icon: string; // Lucide icon keyword
  color: string; // Tailwind tint
  borderColor: string;
  textColor: string;
  glowColor: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "movies_series",
    nameBangla: "মুভি ও সিরিজ",
    nameEnglish: "Movies & Series",
    icon: "Film",
    color: "bg-pink-950/40",
    borderColor: "border-pink-500",
    textColor: "text-pink-400",
    glowColor: "glow-border-pink"
  },
  {
    id: "celebrities_creators",
    nameBangla: "সেলিব্রিটি ও ক্রিয়েটর",
    nameEnglish: "Celebrities & Creators",
    icon: "Tv",
    color: "bg-blue-950/40",
    borderColor: "border-blue-500",
    textColor: "text-blue-400",
    glowColor: "glow-border-blue"
  },
  {
    id: "dhaka_memes_slang",
    nameBangla: "মেম ও জেন-জি স্ল্যাং",
    nameEnglish: "Dhaka Gen-Z Memes & Slang",
    icon: "Sparkles",
    color: "bg-purple-950/40",
    borderColor: "border-purple-500",
    textColor: "text-purple-400",
    glowColor: "glow-border-purple"
  },
  {
    id: "food_culture",
    nameBangla: "খাবার ও সংস্কৃতি",
    nameEnglish: "Food & Culture",
    icon: "Utensils",
    color: "bg-yellow-950/40",
    borderColor: "border-yellow-500",
    textColor: "text-yellow-400",
    glowColor: "glow-border-pink"
  }
];

export const DEFAULT_CARDS: Card[] = [
  // Dhaka Gen-Z Memes & Slang
  {
    id: "g1",
    word: "খেলা হবে",
    englishTranslit: "Khela Hobe",
    tabooWords: ["রাজনীতি", "শামীম", "উত্তেজনা", "স্টেডিয়াম"],
    category: "dhaka_memes_slang",
    funHint: "Iconic slogan frequently used before any clash, test or friendship matches!"
  },
  {
    id: "g2",
    word: "ভাবা নিছেন?",
    englishTranslit: "Vaiba Nisen?",
    tabooWords: ["বোকা", "স্মার্ট", "জিজ্ঞাসা", "বুঝেছি"],
    category: "dhaka_memes_slang",
    funHint: "When someone thinks you're clueless but you are 10 steps ahead."
  },
  {
    id: "g3",
    word: "প্যারা নাই চিল",
    englishTranslit: "Pera Nai Chill",
    tabooWords: ["সমস্যা", "শান্তি", "টেনশন", "লাইফ"],
    category: "dhaka_memes_slang",
    funHint: "The supreme life philosophy of every Bangladeshi student before finals."
  },
  {
    id: "g4",
    word: "পারবে না রিকশা চালাতে",
    englishTranslit: "Parbe na rishka chalate",
    tabooWords: ["ভার্সিটি", "পড়ালেখা", "কঠিন", "চাকরি"],
    category: "dhaka_memes_slang",
    funHint: "The final threat parents issue when you score poor grades in exams."
  },
  {
    id: "g5",
    word: "আস্তে লেডিস",
    englishTranslit: "Aste Ladis",
    tabooWords: ["মেয়ে", "বাস", "রাস্তা", "মহিলা"],
    category: "dhaka_memes_slang",
    funHint: "Local bus helper yelling at passengers to walk carefully while getting down."
  },
  {
    id: "g6",
    word: "ব্রো ভাই",
    englishTranslit: "Bro Bhai",
    tabooWords: ["বন্ধু", "দোস্ত", "ভাইয়া", "পাবলিক"],
    category: "dhaka_memes_slang",
    funHint: "Double emphasis on brotherhood, used in every roadside tong conversation."
  },
  {
    id: "g7",
    word: "কোপা শামসু",
    englishTranslit: "Kopa Samsu",
    tabooWords: ["পুরানো", "কাটা", "মারধোর", "অস্থির"],
    category: "dhaka_memes_slang",
    funHint: "Classic 2000s meme phrase used to express ultimate style or clean energy."
  },
  {
    id: "g8",
    word: "আলগা পিরিতি",
    englishTranslit: "Alga Piriti",
    tabooWords: ["ভালোবাসা", "প্রেম", "মিথ্যা", "নাটক"],
    category: "dhaka_memes_slang",
    funHint: "When a toxic friend suddenly showers you with exaggerated sweet compliments."
  },
  {
    id: "g9",
    word: "ক্র্যাশ খাওয়া",
    englishTranslit: "Crash khawa",
    tabooWords: ["পছন্দ", "মেয়ে", "ছেলে", "ভাললাগা"],
    category: "dhaka_memes_slang",
    funHint: "Instantly falling for someone you saw on the 13A route bus."
  },
  {
    id: "g10",
    word: "পিনিক",
    englishTranslit: "Pinik",
    tabooWords: ["অবস্থা", "চা", "নেশা", "জোস"],
    category: "dhaka_memes_slang",
    funHint: "That special euphoric high you get right after sipping raw black pepper 'Tong er Cha'."
  },
  {
    id: "g11",
    word: "লুল",
    englishTranslit: "Lul",
    tabooWords: ["হাসি", "বোকা", "পাগল", "ছেলে"],
    category: "dhaka_memes_slang",
    funHint: "A funny, slightly sketchy person or reaction from Facebook comments."
  },
  {
    id: "g12",
    word: "খাইসে আমারে!",
    englishTranslit: "Khaise amare!",
    tabooWords: ["বিপদ", "খাওয়া", "অবাক", "সর্বনাশ"],
    category: "dhaka_memes_slang",
    funHint: "Standard Dhakaiya exclamation when everything goes sideways in the script."
  },

  // Celebrities & Creators
  {
    id: "c1",
    word: "আইমান সাদিক",
    englishTranslit: "Ayman Sadiq",
    tabooWords: ["ইশকুল", "মিলিটারি", "লেকচার", "উদ্যোক্তা"],
    category: "celebrities_creators",
    funHint: "The pioneer of digital education and the most famous teacher of Bangladesh."
  },
  {
    id: "c2",
    word: "হিরো আলম",
    englishTranslit: "Hero Alom",
    tabooWords: ["মিউজিক", "ভিডিও", "ভোট", "বগুড়া"],
    category: "celebrities_creators",
    funHint: "The internet superstar who sings in various accents and runs for elections."
  },
  {
    id: "c3",
    word: "শাকিব খান",
    englishTranslit: "Shakib Khan",
    tabooWords: ["সিনেমা", "কিং", "নায়ক", "অপু"],
    category: "celebrities_creators",
    funHint: "The undisputed King Star of Dhallywood cinema for over two decades."
  },
  {
    id: "c4",
    word: "তাহসান",
    englishTranslit: "Tahsan Khan",
    tabooWords: ["গান", "প্রেম", "আলো", "মিথিলা"],
    category: "celebrities_creators",
    funHint: "The clean-cut heartthrob, keyboard master, and soulful voice of 2000s hits."
  },
  {
    id: "c5",
    word: "চঞ্চল চৌধুরী",
    englishTranslit: "Chanchal Chowdhury",
    tabooWords: ["আয়নাবাজি", "কারাগার", "তাকদীর", "অভিনয়"],
    category: "celebrities_creators",
    funHint: "Master-class actor known for Allen Swapan, Monpura, and unbelievable makeovers."
  },
  {
    id: "c6",
    word: "সোলায়মান সুখন",
    englishTranslit: "Solaiman Shukhon",
    tabooWords: ["মোটিভেশন", "ইউটিউব", "চাকরি", "ল্যাপটপ"],
    category: "celebrities_creators",
    funHint: "Popular corporate speaker who motivates people while holding a paper cup."
  },
  {
    id: "c7",
    word: "রাফসান দ্য ছোটভাই",
    englishTranslit: "Rafsan The Chotobhai",
    tabooWords: ["খাবার", "বার্গার", "ইউটিউবার", "ভিডিও"],
    category: "celebrities_creators",
    funHint: "Vibrant culinary content creator who is always excited about eating loaded burgers."
  },
  {
    id: "c8",
    word: "খালিদ ফারহান",
    englishTranslit: "Khalid Farhan",
    tabooWords: ["প্যাসিভ", "মার্কেটিং", "আয়ারল্যান্ড", "টাকা"],
    category: "celebrities_creators",
    funHint: "Business creator giving marketing tips from Dublin while wearing nice coats."
  },
  {
    id: "c9",
    word: "ড. মাহফুজুর রহমান",
    englishTranslit: "Dr. Mahfuzur Rahman",
    tabooWords: ["টিভি", "এটিএন", "গান", "ঈদ"],
    category: "celebrities_creators",
    funHint: "TV channel head who holds an annual solo singing concert every Eid night."
  },
  {
    id: "c10",
    word: "হানিফ সংকেত",
    englishTranslit: "Hanif Sanket",
    tabooWords: ["ইত্যাদি", "বিটিভি", "কৌতুক", "স্টেডিয়াম"],
    category: "celebrities_creators",
    funHint: "Host of the legendary cultural show that starts with an iconic signature tune."
  },

  // Movies & Series
  {
    id: "m1",
    word: "হাওয়া",
    englishTranslit: "Hawa",
    tabooWords: ["সাদা", "পাখি", "নৌকা", "চঞ্চল"],
    category: "movies_series",
    funHint: "A mystery thriller set on the deep waters starring a girl named 'Gulti'."
  },
  {
    id: "m2",
    word: "তুফান",
    englishTranslit: "Toofan",
    tabooWords: ["শাকিব", "ডন", "অ্যাকশন", "চুল"],
    category: "movies_series",
    funHint: "2024 blockbuster featuring stylish sunglasses, vintage coats, and dual roles."
  },
  {
    id: "m3",
    word: "আয়নাবাজি",
    englishTranslit: "Aynabaji",
    tabooWords: ["জেলখানা", "অভিনেতা", "কোকিল", "আয়না"],
    category: "movies_series",
    funHint: "Sharafat Karim changes his face to spend jail sentences for other corrupt guys."
  },
  {
    id: "m4",
    word: "ব্যাচেলর পয়েন্ট",
    englishTranslit: "Bachelor Point",
    tabooWords: ["কাবিলা", "নোয়াখালী", "পলাশ", "কাজল"],
    category: "movies_series",
    funHint: "The viral mega-serial showcasing the hilarious lives of bachelors renting flat."
  },
  {
    id: "m5",
    word: "মহানগর",
    englishTranslit: "Mohanagar",
    tabooWords: ["পুলিশ", "ওসি", "থানা", "হারুন"],
    category: "movies_series",
    funHint: "OC Harun handles an influential rich brat in a single chaotic night at Kotwali Thana."
  },
  {
    id: "m6",
    word: "সুরঙ্গ",
    englishTranslit: "Shurongo",
    tabooWords: ["ব্যাংক", "টাকা", "কূপ", "সুড়ঙ্গ"],
    category: "movies_series",
    funHint: "A desperate miner digs an underground passage into a secure bank vault."
  },
  {
    id: "m7",
    word: "মনপুরা",
    englishTranslit: "Monpura",
    tabooWords: ["দ্বীপ", "নৌকা", "গান", "মেতিহা"],
    category: "movies_series",
    funHint: "Legendary romantic tragedy on an isolated island with the song 'Shonar Moyna'."
  },
  {
    id: "m8",
    word: "পথের পাঁচালী",
    englishTranslit: "Pather Panchali",
    tabooWords: ["রেলগাড়ি", "অপু", "দুর্গা", "সত্যজিৎ"],
    category: "movies_series",
    funHint: "The cinematic masterpiece that put Bengali cinema on the world map in 1955."
  },

  // Food & Culture
  {
    id: "f1",
    word: "কাচ্চি বিরিয়ানি",
    englishTranslit: "Kachchi Biryani",
    tabooWords: ["খাসি", "বাসমতি", "আলু", "বিয়ে"],
    category: "food_culture",
    funHint: "The King of Bangladeshi dishes, layered with tender mutton and gold-like potato!"
  },
  {
    id: "f2",
    word: "ফুচকা",
    englishTranslit: "Fuchka",
    tabooWords: ["টক", "ঝাল", "আলু", "তেঁতুল"],
    category: "food_culture",
    funHint: "Crispy hollow globes filled with spiced chickpea mash and poured with hot tamarind juice!"
  },
  {
    id: "f3",
    word: "চটপটি",
    englishTranslit: "Chotpoti",
    tabooWords: ["ডাবল", "ডাল", "ডিম", "মশলা"],
    category: "food_culture",
    funHint: "Tangy chickpea snack topped with grated hardboiled egg and crushed crispy shells."
  },
  {
    id: "f4",
    word: "মোরগ পোলাও",
    englishTranslit: "Morog Polao",
    tabooWords: ["মুরগি", "ডিম", "বিয়েবাড়ি", "পোলাও"],
    category: "food_culture",
    funHint: "A wedding-style feast with rich seasoned rice and a massive chicken leg piece."
  },
  {
    id: "f5",
    word: "বাকরখানি",
    englishTranslit: "Bakarkhani",
    tabooWords: ["চা", "মিষ্টি", "পুরান", "ঢাকা"],
    category: "food_culture",
    funHint: "Crunchy dry biscuit-style circular bread, the absolute pride of Old Dhaka."
  },
  {
    id: "f6",
    word: "তেহারি",
    englishTranslit: "Beef Tehari",
    tabooWords: ["সরিষা", "তেল", "গরু", "ছোট"],
    category: "food_culture",
    funHint: "Spiced rice cooked with tiny pieces of beef, strongly scented with pure mustard oil."
  },
  {
    id: "f7",
    word: "চা-সিঙারা",
    englishTranslit: "Cha-Shingara",
    tabooWords: ["টং", "আড্ডা", "গরম", "আলু"],
    category: "food_culture",
    funHint: "The absolute classic afternoon snack pairing that spawns countless gossips."
  },
  {
    id: "f8",
    word: "পান্তা ইলিশ",
    englishTranslit: "Panta Ilish",
    tabooWords: ["বৈশাখ", "পহেলা", "ইলিশ", "পানি"],
    category: "food_culture",
    funHint: "Fermented soaked rice with fried hilsa consumed on Bangladeshi New Year morning!"
  },
  {
    id: "f9",
    word: "কালা ভুনা",
    englishTranslit: "Kala Bhuna",
    tabooWords: ["মেজবান", "কালো", "গরু", "পেঁয়াজ"],
    category: "food_culture",
    funHint: " Chittagong's legendary block-dark slow-roasted beef spiced to perfection."
  },
  {
    id: "f10",
    word: "ভাপা পিঠা",
    englishTranslit: "Vapa Pitha",
    tabooWords: ["শীত", "খেঁজুর", "গুড়", "ভাপ"],
    category: "food_culture",
    funHint: "Winter steam rice cake stuffed with sweet date molasses and fresh coconut flakes."
  }
];
