// Shared site content. Sections import these as defaults and can be
// overridden per page via props — one source of truth, no duplication.

export const SAMPLE_PROMPT =
  "Create a realistic fashion visualization using the uploaded photo as the reference. " +
  "Keep the person's facial identity, body proportions, hairstyle, and natural appearance consistent. " +
  "Style them in a modern smart-casual outfit in navy and cream tones, relaxed tailored fit, soft daylight, " +
  "photorealistic, natural fabric drape.";

export const NAV_LINKS = [
  ["Home", "/"],
  ["Shop", "/#shop"],
  ["Personalize", "/customize"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Studio", "/studio"],
];

export const TICKER_ITEMS = [
  "Festive", "Wedding", "Smart Casual", "Traditional",
  "Streetwear", "Party", "Date Night", "College",
];

export const STEPS = [
  {
    no: "STEP 01", title: "Choose Your Style",
    text: "Select your preferred occasion, outfit type, colors, fit, and overall style.",
  },
  {
    no: "STEP 02", title: "Get Your AI Prompt",
    text: "Digital Tailor turns your preferences into a detailed, ready-to-use prompt.",
  },
  {
    no: "STEP 03", title: "Add Your Photo",
    text: "Copy the prompt and provide your photo in ChatGPT.",
  },
  {
    no: "STEP 04", title: "Visualize Your Look",
    text: "See how your selected style could look on you.",
  },
];

// Home page: how ordering from the tailor works (local-customer flow).
export const HOME_STEPS = [
  {
    no: "STEP 01", title: "Pick a design",
    text: "Shop father's collection or personalize — cloth, neck front & back, sleeves, plus your own reference photo.",
  },
  {
    no: "STEP 02", title: "Give measurements",
    text: "Add them once after login (or skip and add later in your bag). Reused for every future order.",
  },
  {
    no: "STEP 03", title: "Pay directly via UPI",
    text: "Scan the QR, pay in any UPI app, share the UTR. No gateway, no extra charges.",
  },
  {
    no: "STEP 04", title: "Stitched & delivered",
    text: "The tailor stitches, confirms trial, and delivers — with festival offers like Diwali applied automatically.",
  },
];

export const HOME_WHY = [
  { icon: "📏", title: "Perfect fit", text: "Your measurements saved once, reused for every kurti, suit and gown." },
  { icon: "🧵", title: "Father's craft", text: "Years of Nagpur tailoring — fabric advice, neat finishing, honest pricing." },
  { icon: "📱", title: "Direct UPI", text: "Pay the shop directly by QR. No middlemen, no hidden charges." },
  { icon: "🪔", title: "Festival ready", text: "Diwali, Eid, wedding offers on the homepage — order early, wear on time." },
];

export const STYLES = [
  { title: "Casual", desc: "Easy everyday comfort that still looks put together." },
  { title: "Smart Casual", desc: "Polished but relaxed — dinners, dates, workdays." },
  { title: "Formal", desc: "Sharp tailoring for meetings and ceremonies." },
  { title: "Streetwear", desc: "Bold layers, sneakers and standout attitude." },
  { title: "Traditional", desc: "Festive classics with a modern tailored cut." },
  { title: "Party", desc: "Evening looks made to be noticed." },
  { title: "Date Night", desc: "Effortless, confident and memorable." },
  { title: "College", desc: "Fresh, affordable campus-ready outfits." },
];

export const FACTORS = [
  ["◉", "Occasion"], ["◈", "Outfit type"], ["⬤", "Color preference"], ["▣", "Fit"],
  ["✦", "Style aesthetic"], ["❋", "Accessories"], ["⬔", "Footwear"], ["〜", "Overall vibe"],
];

export const WHY_ITEMS = [
  { icon: "✦", title: "Personalized", text: "Recommendations based on your preferences." },
  { icon: "○", title: "Simple", text: "No complicated fashion terminology required." },
  { icon: "◇", title: "AI-Ready", text: "Get prompts designed for modern AI visual tools." },
  { icon: "♡", title: "Your Choice", text: "You decide the final look and where to use the prompt." },
];

export const AREAS = [
  "Sitabuldi", "Dharampeth", "Sadar", "Civil Lines", "Dhantoli", "Ramdaspeth",
];

export const CHATGPT_URL = "https://chatgpt.com/";
