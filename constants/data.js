export const plans = [
  { 
    id: "starter", 
    name: "Starter", 
    price: "14.99", 
    stripeUrl: "https://buy.stripe.com/4gMeV5crj7NX6ho2us6Zy00",
    features: ["1500 extractions / mois", "2 filtres sauvegardés", "2 champs de données par filtre"] 
  },
  { 
    id: "pro", 
    name: "Pro", 
    price: "29.99", 
    popular: true, 
    stripeUrl: "https://buy.stripe.com/5kQfZ9dvn3xH9tAgli6Zy01",
    features: ["7500 extractions / mois", "5 filtres sauvegardés", "5 champs de données par filtre"] 
  },
  { 
    id: "prime", 
    name: "Prime", 
    price: "59.99", 
    stripeUrl: "https://buy.stripe.com/eVq9ALfDvb096ho1qo6Zy02",
    features: ["25 000 extractions / mois", "10 filtres sauvegardés", "10 champs de données par filtre"] 
  },
];