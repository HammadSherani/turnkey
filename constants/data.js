export const plans = [
  { 
    id: "starter", 
    name: "Starter", 
    price: "14.99", 
    // Frontend ke liye NEXT_PUBLIC_ hona zaroori hai
    priceId: process.env.NEXT_PUBLIC_STARTER_PRICE_ID, 
    stripeUrl: "https://buy.stripe.com/test_4gMeV5crj7NX6ho2us6Zy00",
    features: ["1500 extractions / mois", "3 filtres sauvegardés", "3 champs de données par filtre"],
    limits: { extractions: 1500, filters: 3, fields: 3 }
  },
  { 
    id: "pro", 
    name: "Pro", 
    price: "29.99", 
    popular: true, 
    priceId: process.env.NEXT_PUBLIC_PRO_PRICE_ID, 
    stripeUrl: "https://buy.stripe.com/test_5kQfZ9dvn3xH9tAgli6Zy01",
    features: ["7500 extractions / mois", "5 filtres sauvegardés", "5 champs de données par filtre"],
    limits: { extractions: 7500, filters: 5, fields: 5 }
  },
  { 
    id: "prime", 
    name: "Prime", 
    price: "59.99", 
    priceId: process.env.NEXT_PUBLIC_PRIME_PRICE_ID, 
    stripeUrl: "https://buy.stripe.com/test_eVq9ALfDvb096ho1qo6Zy02",
    features: ["25 000 extractions / mois", "10 filtres sauvegardés", "10 champs de données par filtre"],
    limits: { extractions: 25000, filters: 10, fields: 10 }
  },
];