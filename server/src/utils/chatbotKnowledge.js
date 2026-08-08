/**
 * FoodHub AI Help Assistant — knowledge base + matcher.
 * Self-contained rule-based assistant (no external API keys). Answers 100+
 * customer questions about the website plus general chit-chat, and can solve
 * simple arithmetic. Highest Regex hit-score wins; else fallback reply.
 */

const FALLBACK = {
  reply:
    "I'm not sure I caught that. You can ask me about placing & tracking orders, delivery, payments, coupons, the menu, your account or support — or just say hi!",
  suggestions: ['How do I place an order?', 'Is delivery free?', 'How do I track my order?'],
};

const solveMath = (text) => {
  const cleaned = String(text).toLowerCase().replace(/[=?]/g, ' ').replace(/\s+/g, ' ').trim();
  let t = cleaned.replace(/^(what is|what.s|what's|calculate|solve|compute)\s*/i, '').replace(/\s+/g, '');
  const m = t.match(/^(-?\d+(?:\.\d+)?)([+\-*/x×÷])(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[3]);
  const op = m[2] === 'x' || m[2] === '×' ? '*' : m[2] === '÷' ? '/' : m[2];
  if (op === '/' && b === 0) return 'Division by zero is not allowed, even for the best chef.';
  const result = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
  if (!Number.isFinite(result)) return null;
  return `${a} ${m[2]} ${b} = ${Math.round(result * 100) / 100}`;
};

const INTENTS = [
  // ============================ ORDERS ============================
  {
    id: 'order-place',
    re: /place( an| my| a)? order|how (do i|to) order|order food|make an order|buy food|new order/,
    reply:
      "Placing an order is easy! 1) Browse the Menu or search a dish, 2) tap Add to cart, 3) open your cart and hit Checkout, 4) pick a delivery address, 5) choose Cash on Delivery or pay online (UPI/Card), and confirm. You'll get an order number right away.",
    suggestions: ['How do I track my order?', 'Is delivery free?', 'What are the payment options?'],
  },
  {
    id: 'order-track',
    re: /track( my| the)? order|where is( my| the)? order|order status|check( my)? order|status of( my)? order/,
    reply: "You can track your order live! Go to My Orders, open the order, and you'll see real-time status: Pending > Confirmed > Preparing > Out for Delivery > Delivered. The delivery OTP appears once your rider is on the way.",
    suggestions: ['Where is my rider?', 'What is the delivery OTP?', 'My order is late'],
  },
  {
    id: 'order-track-rider',
    re: /track( the)? rider|where is( my)? rider|rider location|live location|courier/,
    reply: "Once your order is 'Out for Delivery', a rider is assigned and live status updates in My Orders. You'll get a 4-digit OTP to complete the safe handover.",
  },
  {
    id: 'order-late',
    re: /order (is|was) (late|delayed)|where is my food|food is late|how long( will)?( the)? order|how long.*arrive/,
    reply: "I'm sorry for the wait! Most orders arrive within 30-40 minutes of confirmation. If it's been longer, call/WhatsApp support at +91 98765 43210 and we'll prioritize it.",
  },
  {
    id: 'order-cancel',
    re: /cancel( my| the)? order|how.*cancel|change( my|the) order|want to cancel/,
    reply: "Cancel any order from My Orders > open the order > Cancel Order, while it is still Pending or Confirmed. Orders already Preparing/Out for Delivery can't be cancelled — but support can help. Online payments are auto-refunded on cancellation.",
    suggestions: ['How do I get a refund?', 'How do I track my order?'],
  },
  {
    id: 'order-change-address',
    re: /change( the| my| delivery)? address|update( my)? address|wrong address|edit address/,
    reply: "If your order hasn't been picked up yet, message support and we'll update the address. For future orders you can add/manage addresses under Profile > Addresses.",
  },
  {
    id: 'order-history',
    re: /order history|past orders|previous orders|old orders|my orders list|view my orders/,
    reply: "Your full order history is under 'My Orders' (hamburger menu). You can re-check status, view bills and reorder your favorites there.",
  },
  {
    id: 'order-receipt',
    re: /receipt|invoice|bill|payment receipt|download bill/,
    reply: "Every order shows a full bill — items, price, delivery, tax, total — on its detail page under My Orders. You can screenshot it anytime.",
  },
  {
    id: 'order-deliver-partner',
    re: /become a (delivery )?partner|join.*delivery|delivery rider job|work as rider|earn with foodhub/,
    reply: "We'd love to have you! When registering, choose 'Delivery Partner'. Once approved you get a Delivery Dashboard to accept orders, earn per delivery, and track earnings & ratings.",
  },
  {
    id: 'order-bulk',
    re: /bulk order|party order|catering|group order|large order|corporate order/,
    reply: "For bulk, party or corporate orders (10+ items), contact us at +91 98765 43210 or support@foodhub.app and we'll arrange a special price and scheduled delivery.",
  },
  {
    id: 'order-recommend',
    re: /what (should i|to) (eat|order)|recommend|any (good|best) food|what.*tasty/,
    reply: "Crowd favourites right now: Cheese Burst Pizza, Chicken Tikka Biryani, Masala Potato Chips, Momos and the new Oreo Crunch Shake. Use the veg/non-veg filter on the Menu — every dish shows a green or red dot.",
  },

  // ============================ DELIVERY ============================
  {
    id: 'delivery-free',
    re: /(is|are) delivery (free|charges?)|delivery charge|delivery fee|shipping charge|free delivery|pay for delivery|no delivery charge|delivery cost/,
    reply: "Great news — delivery is FREE when you pay online (UPI, card or net banking) with no minimum order! Cash on Delivery adds a small Rs 30 fee. So pay online and the food price is all you pay.",
    suggestions: ['What payment methods are available?', 'What is the delivery time?'],
  },
  {
    id: 'delivery-time',
    re: /delivery time|how long.*deliver|eta|arriving in|when will( my order| it) arrive|delivery speed|fast delivery/,
    reply: "Most orders arrive in 30-40 minutes: ~15-20 min kitchen prep + ~15-20 min ride. You'll see a live ETA on your order page.",
  },
  {
    id: 'delivery-radius',
    re: /deliver (to|to my)? (area|location|address|pincode)|delivery area|coverage|how far|delivery distance/,
    reply: "We currently deliver within ~10 km of our kitchens. Enter your delivery pincode at checkout and it will confirm instantly if we cover your location.",
  },
  {
    id: 'delivery-otp',
    re: /otp|handover|delivery otp|verification (code|pin)|what.*otp/,
    reply: "For safe handovers, every order gets a 4-digit OTP that appears on your order page once it's Out for Delivery. Share it only with your rider when they arrive.",
  },
  {
    id: 'delivery-live',
    re: /live tracking|real[- ]time|track.*partner|map.*delivery/,
    reply: "You can follow the live journey in My Orders — each status change (Preparing, Out for Delivery) updates automatically.",
  },
  {
    id: 'delivery-minimum',
    re: /minimum order|min order|minimum amount|order limit/,
    reply: "There's no minimum order! You can order a single Rs10 snack — pay online and delivery is free; COD adds Rs30.",
  },

  // ============================ PAYMENTS ============================
  {
    id: 'payment-methods',
    re: /payment (method|option|type|ways)|how can i pay|pay online|mode of payment|what payment/,
    reply: "We accept Cash on Delivery (COD), UPI (Google Pay / PhonePe / Paytm), and Credit/Debit cards & Net Banking via Razorpay. Choosing UPI or card makes delivery FREE!",
    suggestions: ['Is online payment safe?', 'What if my payment fails?'],
  },
  {
    id: 'payment-cod',
    re: /cash on delivery|\bcod\b|pay cash|pay at door|cash payment/,
    reply: "Yes, Cash on Delivery is available! Just select it at checkout. Note COD includes a Rs30 delivery fee — pay online instead and delivery is free.",
  },
  {
    id: 'payment-upi',
    re: /upi|google pay|phonepe|paytm|gp\b/,
    reply: "UPI is supported! At checkout choose 'UPI - Google Pay / PhonePe / Paytm'. On mobile the payment app opens automatically (UPI intent); on desktop you can enter your UPI ID. Free delivery, while the food price is all you pay.",
  },
  {
    id: 'payment-card',
    re: /credit card|debit card|net banking|card payment|visa|master|r[cu]pay/,
    reply: "We accept all major cards (Visa, Mastercard, RuPay) and Net Banking through Razorpay's secure gateway. Card details never touch our servers, and card payment = free delivery!",
  },
  {
    id: 'payment-secure',
    re: /is (it| online)? (safe|secure)|payment safe|secure payment|trust.*payment|razorpay safe|how secure/,
    reply: "Absolutely. All online payments run through Razorpay, a PCI-DSS compliant gateway. We verify every signature server-side and never store card or UPI details.",
  },
  {
    id: 'payment-failed',
    re: /payment (failed|declined|unsuccessful)|transaction failed|money deducted|charged but|payment issue/,
    reply: "I'm sorry about that! If money was deducted but no order was created, your order stays saved as 'pending' and you can retry from My Orders. Auto-refunds for failed payments complete in 3-5 business days.",
    suggestions: ['How do I get a refund?', 'How do I track my order?'],
  },
  {
    id: 'payment-refund',
    re: /refund|money back|return.*money|get.*refund|reversed|credit.*back/,
    reply: "Refunds are automatic! For cancelled orders or failed payments, the amount returns to the original payment method (UPI/card) within 3-5 business days. COD cancellations have nothing to refund.",
  },
  {
    id: 'payment-done',
    re: /payment (success|done)|paid.*order|confirm payment that works/,
    reply: "Once payment succeeds your order is confirmed instantly and you land on the order page with your order number. My Orders will show 'Paid'.",
  },

  // ============================ COUPONS & OFFERS ============================
  {
    id: 'coupon-list',
    re: /^(?!.*\b(apply|use|enter)\b).*\b(coupon|promo code|discount code|voucher|offers|deals|promotions|discount)\b/,
    reply: "We run rotating offers and coupons — check the Menu / Checkout pages for active promo codes. Enter a code in the cart at checkout. PS: paying online already saves Rs30 on delivery!",
    suggestions: ['How do I apply a coupon?', 'Is delivery free?'],
  },
  {
    id: 'coupon-apply',
    re: /\b(apply|use|enter)\b.*\b(coupon|code|promo)|where.*enter.*code|apply.*code/,
    reply: "Easy! Add items to cart > open the cart > find the 'Apply Coupon' box > enter your code > Apply. The discount updates on your order summary right away.",
  },
  {
    id: 'coupon-invalid',
    re: /coupon (not working|invalid|expired)|code doesn.?t work|promo not valid|why.*coupon/,
    reply: "Coupon codes are case-insensitive but may be expired, have minimum-order limits, or be usable once per account. Double-check the code and terms — if it still fails, call +91 98765 43210.",
  },

  // ============================ FOOD & MENU ============================
  {
    id: 'menu-browse',
    re: /see the menu|what.*on.*menu|browse.*food|menu items|what do you serve|what food do you (have|sell)|categories/,
    reply: "Our menu is packed! Categories: Burgers, Pizza, Biryani, Street Food (chips & snacks), Starters, Chinese, Sandwiches, Shakes, Desserts, Beverages, Salads, Pasta and Sushi. Filter by category, veg/non-veg, or sort by price/rating on the Menu page.",
    suggestions: ['What are the bestsellers?', 'Do you have veg options?'],
  },
  {
    id: 'menu-search',
    re: /search.*(food|dish|item)|find.*(food|dish)|looking for.*(dish|food)/,
    reply: "Use the search bar in the top navbar — type any dish name (pizza, biryani, chips) and results appear instantly.",
  },
  {
    id: 'menu-bestseller',
    re: /bestseller|best seller|popular|most ordered|trending|top rated|famous dishes/,
    reply: "Our hottest picks: Cheese Burst Pizza, Chicken Tikka Biryani, Classic Veg Burger, Masala Potato Chips and the Family Feast Platter. Use the 'Most Popular' sort on the Menu.",
  },
  {
    id: 'menu-new',
    re: /new (items?|dishes?|arrivals|food)|just (launched|added)|latest.*(dish|menu)/,
    reply: "Just landed: Steamed Chicken Momos, Oreo Crunch Shake, Mango Shake, Grilled Veg Sandwich and the Family Feast Platter. Look for NEW badges on the menu!",
  },
  {
    id: 'menu-veg',
    re: /veg(etarian)? (options|food|items|dishes|pizza)|pure veg|all veg|is it veg|veg pizz/,
    reply: "Yes — plenty of veg options! Use the 'Vegetarian' filter on the Menu. Every dish shows a green (veg) or red (non-veg) dot, and veg dishes are prepared separately for purity.",
  },
  {
    id: 'menu-nonveg',
    re: /non[- ]?veg|meat|chicken|mutton|fish|egg dishes/,
    reply: "Great non-veg picks: Chicken Tikka Biryani, Chicken Manchurian, Crispy Chicken Burger, Steamed Chicken Momos and Salmon Nigiri. Filter 'Non-Veg' on the menu to see them all.",
  },
  {
    id: 'menu-halal-jain',
    re: /halal|jain/,
    reply: "For Jain meals, our pure-veg kitchens can prepare orders without onion/garlic on request — add a note when ordering or call +91 98765 43210.",
  },
  {
    id: 'menu-ingredients',
    re: /ingredients|allergen|allergy|contains.*(peanut|milk|gluten|egg)|ingredient list/,
    reply: "Every dish page lists its ingredients, allergens (gluten, dairy, eggs, etc.) and nutrition — calories, protein, carbs, fat. Tap any dish to see full details.",
  },
  {
    id: 'menu-nutrition',
    re: /calorie|nutrition|protein|healthy|low[- ]cal|carbs|diet/,
    reply: "Nutrition info is on every dish page. For lighter choices try the Garden Fresh Salad, Fresh Lime Soda or a veg sandwich.",
  },
  {
    id: 'menu-unavailable',
    re: /out of stock|not available|unavailable|sold out|why.*(sold|unavailable)/,
    reply: "Occasionally a dish sells out. The cart shows it as unavailable — it usually restocks within the day. Try the 'Popular' sort for dishes in stock right now.",
  },
  {
    id: 'menu-prices',
    re: /price|cost|how much|cheap|expensive|affordable|rates/,
    reply: "Prices start from Rs49 for street snacks up to Rs399 for platters — check the Menu for exact prices. Pay online and delivery is free, so what you see is what you pay!",
  },
  {
    id: 'food-detail',
    re: /about (the |this )?dish|food detail|more about.*food|what.s (this|that) dish/,
    reply: "Tap any dish card to open its detail page — full description, ingredients, allergens, nutrition, prep time, rating and reviews.",
  },

  // ============================ CART & WISHLIST ============================
  {
    id: 'cart-add',
    re: /add( to| in)? (my )?(cart|basket)|how do i add|remove from cart|cart items/,
    reply: "Hit the + button on any dish card to add it to your cart — the cart icon in the navbar shows your count. Remove items by opening the cart and using minus or the trash icon.",
  },
  {
    id: 'cart-empty',
    re: /cart (empty|not showing)|where.*my cart|don.?t see.*cart/,
    reply: "Your cart lives in the top-right cart icon. If it looks empty, add a dish from the Menu again — the badge count updates instantly.",
  },
  {
    id: 'wishlist',
    re: /wishlist|favorite|favourite|save.*dish|save.*item|bookmark/,
    reply: "Save dishes to your Wishlist with the heart icon (login required). View them anytime from the Wishlist page — handy for quick reordering!",
  },

  // ============================ ACCOUNT & AUTH ============================
  {
    id: 'auth-register',
    re: /create (an )?account|sign ?up|register|new (user|account)|join foodhub/,
    reply: "Signing up takes 30 seconds! Tap 'Sign Up' in the navbar, fill in name/email/phone/password — or use 'Continue with Google' for one-tap registration. Join as a Customer or Delivery Partner.",
    suggestions: ['How do I log in?', 'I forgot my password'],
  },
  {
    id: 'auth-login',
    re: /how do i log ?in|login|sign ?in|log into my account/,
    reply: "Tap 'Login' in the top-right of the navbar and enter your email & password — or use Google. Admins and delivery partners land straight on their dashboards after login.",
  },
  {
    id: 'auth-forgot',
    re: /forgot (my )?password|reset password|change password|can.?t log ?in/,
    reply: "On the Login page tap 'Forgot password?' and we'll email you a reset link. For anything else, support@foodhub.app is here 24/7.",
  },
  {
    id: 'auth-verify',
    re: /verify( my)? email|email verification|otp.*email|account (activation|verify)|didn.?t get.*(email|link)/,
    reply: "After registering, check your inbox (and spam!) for a verification email. If it hasn't arrived in a few minutes, hit Resend on the verification screen or contact support@foodhub.app.",
  },
  {
    id: 'auth-profile',
    re: /profile|update (my )?(name|phone|details)|change.*(name|phone|email)|my details/,
    reply: "Manage your profile — name, phone, addresses and preferences — under 'My Profile' in the menu. Saved addresses auto-fill at checkout.",
  },
  {
    id: 'auth-delete',
    re: /delete (my )?account|close (my )?account|remove my account/,
    reply: "We're sad to see you go! Contact support@foodhub.app with your registered email and we'll process deletion and data removal within 48 hours.",
  },

  // ============================ SUPPORT & GENERAL ============================
  {
    id: 'support-contact',
    re: /contact|support|helpdesk|customer care|phone number|email us|reach.*(you|support)|talk to.*(human|agent)/,
    reply: "We're here 24/7! Call or WhatsApp: +91 98765 43210 · Email: support@foodhub.app. Or just keep chatting with me!",
    suggestions: ['Where is my order?', 'I have a complaint', 'Is delivery free?'],
  },
  {
    id: 'support-hours',
    re: /opening hours|store hours|working hours|open now|timings?|opening|closing time|when.*(open|close)|what time.*(open|close)|till what time|open.*close/,
    reply: "We're open 7 days a week, 10 AM to 11 PM — orders are delivered as fast as possible during those hours.",
  },
  {
    id: 'support-complaint',
    re: /complaint|feedback|issue with.*(order|food|delivery)|food was (cold|bad|wrong)|missing (item|food)|wrong order|dissatisfied/,
    reply: "I'm really sorry to hear that — that's not the FoodHub standard. Share your order number with support@foodhub.app or call +91 98765 43210 and we'll make it right with a refund or replacement.",
  },
  {
    id: 'support-language',
    re: /hindi|language|speak.*hindi|english/,
    reply: "I can answer in English and Hindi! Orders, delivery, payment aur menu ki jaankari dono bhashaon mein milegi. आप हिंदी में भी पूछ सकते हैं!",
  },
  {
    id: 'support-emergency',
    re: /emergency|urgent|help now|ambulance|medical help/,
    reply: "For a medical or safety emergency, please contact local emergency services immediately (112 in India). For anything food-related, I'm right here and at +91 98765 43210.",
  },

  // ============================ CHITCHAT (non-site) ============================
  {
    id: 'chat-hello',
    re: /^(hi|hii+|hey|hello|yo|hola|namaste|hey there|hi there|good (morning|afternoon|evening|night)|goodmorning|goodnight)\b/,
    reply: "Hello! I'm the FoodHub assistant — ask me anything about the menu, orders, delivery, payments, or just chat. What can I help you with?",
    suggestions: ['How do I place an order?', 'Is delivery free?', 'Tell me a joke'],
  },
  {
    id: 'chat-howareyou',
    re: /how are you|how.?s it going|how r u|how are things|are you (ok|okay|good)/,
    reply: "I'm doing great, thanks for asking! Always fresh, never tired — unlike real chefs. How can I help you today?",
  },
  {
    id: 'chat-thanks',
    re: /thank|thx|thanks|\bty\b|appreciate|good job|great help|nice work/,
    reply: "You're very welcome! That's what I'm here for. If you need anything else — orders, offers, delivery — just say the word. Enjoy your meal!",
  },
  {
    id: 'chat-bye',
    re: /bye|goodbye|see you|gtg|tata|cya/,
    reply: "Bye for now! Come back soon — your next delicious meal is waiting. Order now and delivery is free with online payment!",
  },
  {
    id: 'chat-whoareyou',
    re: /who are you|what are you|your name|what.?s your name|tell me about yourself|about you/,
    reply: "I'm Foodie — the FoodHub AI assistant! I know everything about our menu, orders, delivery, coupons and payments, and I'm happy to chat about much else too. What do you want to know?",
  },
  {
    id: 'chat-robot',
    re: /are you (a )?robot|are you human|are you (real|ai)|are you a bot|are you (smart|intelligent)/,
    reply: "Guilty as charged — I'm an AI bot! But a friendly, food-loving one. I can answer 100+ questions about the site, help you order, and even tell a joke or two. Try me!",
  },
  {
    id: 'chat-whatcando',
    re: /what can you do|your (features|abilities)|help me|what do you know|what questions/,
    reply: "I can help with: placing & tracking orders, delivery & free-delivery rules, payments & refunds, coupons, the menu & food info, accounts — and fun stuff like jokes & small talk. Ask me anything!",
  },
  {
    id: 'chat-joke',
    re: /(tell|say|make) (me |us )?(a |some )?joke|funny|make me laugh|another joke/,
    reply: "Why did the tomato turn red? Because it saw the salad dressing! And why don't eggs tell jokes? They'd crack each other up! Want another?",
  },
  {
    id: 'chat-date',
    re: /what (is )?(the )?(date|today)|today.?s date|what day is it/,
    reply: () => new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' — a perfect day for food!',
  },
  {
    id: 'chat-time',
    re: /what time is it|current time|what.?s the time|tell me the time/,
    reply: () => "It's " + new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) + ' right now. Hungry yet?',
  },
  {
    id: 'chat-weather',
    re: /weather|is it raining|hot outside|cold outside|temperature/,
    reply: "I can't see the sky from here, but I CAN promise warm food arriving hot and chilled shakes arriving cold — no matter the weather!",
  },
  {
    id: 'chat-love',
    re: /i love you|love (this|you)|great site|awesome/,
    reply: "Aww, that made my circuits glow! Order a treat and we'll deliver the love to your door.",
  },
  {
    id: 'chat-askme',
    re: /ask me|give me a question|quiz me/,
    reply: "Sure! Here's one: What's our bestseller? (Cheese Burst Pizza 🍕). Want to know more about it?",
  },
  {
    id: 'chat-sorry',
    re: /sorry|my bad|apologize/,
    reply: "No worries at all! We're all friends here. What can I help you with?",
  },
  {
    id: 'chat-ok',
    re: /^(ok|okay|fine|alright|k)\b/,
    reply: "Cool! If you need anything, just type it here — orders, delivery, payment, menu, or a joke. I'm all ears.",
  },
  {
    id: 'chat-whatsnew',
    re: /what.?s (up|new)|anything new|what happened/,
    reply: "Fresh out of the kitchen: Momos, Oreo Crunch Shake, Mango Shake and the Grilled Veg Sandwich — plus free delivery on online payments!",
  },
  {
    id: 'chat-trivia',
    re: /trivia|fun fact|fact/,
    reply: "Fun fact: tomatoes are technically a fruit, but the US Supreme Court ruled in 1893 that they're a vegetable for trade. Whatever you call it, ours is delicious in pizza sauce!",
  },
  {
    id: 'chat-tellme-anything',
    re: /tell me anything|say something random|random fact/,
    reply: "Random food fact: The fear of running out of food is called 'sitophobia'. Good news — with FoodHub, you'll never run out of great options!",
  },
  {
    id: 'chat-insult',
    re: /you.*(stupid|dumb|bad)|i hate you|you.*wrong/,
    reply: "Ouch! I'm still learning, so I appreciate your patience. Tell me what's wrong and I'll do my best to fix it — or connect you to a human at +91 98765 43210.",
  },
  {
    id: 'chat-bestfood',
    re: /best (food|dish|item) here|what.*should i.*order.*first|first order/,
    reply: "For a first order I'd say: Cheese Burst Pizza + Peri Peri Fries + an Oreo Crunch Shake. A classic combo that never disappoints!",
  },
  {
    id: 'chat-capital',
    re: /capital of (india|france|japan|italy)/,
    reply: "New Delhi, Paris, Tokyo and Rome respectively — fun fact from your friendly food assistant! Ask me about the menu and I'll be even more useful.",
  },
{
    id: 'chat-colors',
    re: /favourite color|favorite color|your color/,
    reply: "My favourite colour is... food-coloured! Orange for cheese, red for pizza sauce, green for fresh herbs. What's yours?",
  },
  {
    id: 'menu-crave',
    re: /\b(pizza|burger|biryani|momos|momo|sandwich|fries|chips|pasta|dessert|salad|nigiri|shawarma|wings|fries|tacos)\b/,
    reply: (q) => {
      const w = (q.match(/\b(pizza|burger|biryani|momos?|sandwich|fries|chips|pasta|dessert|salad|nigiri|shawarma|wings|shake|tacos)\b/) || [''])[0];
      return `We've got ${w} on our menu! Open the Menu and search "${w}" or browse the matching category — the top-rated ones are marked with a star. Want me to suggest a combo?`;
    },
    suggestions: ['What are the bestsellers?', 'Tell me about today\'s specials'],
  },
  {
    id: 'chat-yes',
    re: /^(yes|yeah|yep|yup|sure|definitely|absolutely|sounds good|cool)\b/,
    reply: "Great! What would you like next — menu highlights, a discount code, or help tracking an order?",
    suggestions: ['What are the bestsellers?', 'How do I apply a coupon?', 'Tell me a joke'],
  },
  {
    id: 'chat-bye',
    re: /^(bye|goodbye|bye bye|see you|cya|c ya|bbye|gonna go|gtg)\b|^thanks? (for your help|a lot)?$/i,
    reply: "Bye for now! Come back soon — your next delicious meal is just a few clicks away. 🍕",
  },
  {
    id: 'chat-thanks',
    re: /^(thanks|thank you|thank u|thnx|ty|appreciate (it|that)|that helped|helpful|nice job)\b/,
    reply: "You're welcome! Happy to help — anything else about orders, delivery, or the menu?",
    suggestions: ['Is delivery free?', 'How do I track my order?', 'Tell me a joke'],
  },
];

/**
 * Score & select the best intent for a normalized query.
 */
const normalize = (text) => String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();

const matchIntent = (raw) => {
  const q = normalize(raw);
  if (!q) return FALLBACK;

  const mathAnswer = solveMath(q);
  if (mathAnswer) return { reply: 'Let me do the math: ' + mathAnswer, suggestions: ['Is delivery free?', 'Tell me a joke'] };

  const byWords = new Map();
  for (const intent of INTENTS) {
    let score = 0;
    const variants = [intent.re.source].filter(Boolean);
    for (const v of variants) {
      const re = new RegExp(v, 'i');
      if (re.test(q)) score += 2;
    }
    // bonus when the intent's core words appear verbatim
    if (score > 0) byWords.set(intent, score);
  }
  if (byWords.size) {
    const best = [...byWords.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const reply = typeof best.reply === 'function' ? best.reply(q) : best.reply;
    return { reply, suggestions: best.suggestions || [] };
  }
  return FALLBACK;
};

export const answerChatbot = (message) => {
  const { reply, suggestions } = matchIntent(message);
  return { reply, suggestions: suggestions || [] };
};

export const intentCount = INTENTS.length;