export interface CookingMethod {
  method: string
  label: string
  icon: string
  note?: string
  steps: { ingredients: string[]; instruction: string }[]
}

export const mealAlternatives: Record<string, CookingMethod[]> = {
  'honey-soy-salmon': [
    {
      method: 'air-fryer',
      label: 'Air Fryer',
      icon: '💨',
      note: 'No need to flip — the fan circulates heat evenly around the fillets.',
      steps: [
        {
          ingredients: ['Soy sauce (3 tbsp)', 'Honey (2 tbsp)', 'Garlic (2 cloves, minced)', 'Fresh ginger (1 tsp, grated)', 'Sesame oil (1 tsp)'],
          instruction: 'Mix together the soy sauce, honey, garlic, ginger and sesame oil to make the glaze.',
        },
        {
          ingredients: ['Salmon fillets (4 x 150g, skin-on)'],
          instruction: 'Pat salmon dry and brush generously with half the glaze. Air fry at 200°C for 8–10 minutes. Brush with the remaining glaze at the 5-minute mark. No flipping needed — the air fryer does the work.',
        },
        {
          ingredients: ['Jasmine rice (1½ cups / 300g, uncooked)', 'Broccoli (1 head, cut into florets)', 'Carrots (2 medium, sliced diagonally)', 'Spring onions (2, sliced, to serve)', 'Sesame seeds (1 tsp, to serve)'],
          instruction: 'Cook rice on the stovetop as normal. Steam or microwave the broccoli and carrots for 4–5 minutes. Serve salmon over rice with veggies, spring onions and sesame seeds.',
        },
      ],
    },
  ],

  'roast-chicken': [
    {
      method: 'air-fryer',
      label: 'Air Fryer',
      icon: '💨',
      note: 'Cook in batches if your air fryer is small — never stack the chicken or the skin won\'t crisp.',
      steps: [
        {
          ingredients: ['Chicken thighs (4, bone-in, skin-on)', 'Chicken drumsticks (4)', 'Garlic (4 cloves, minced)', 'Paprika (1 tsp)', 'Dried thyme (1 tsp)', 'Olive oil (1 tbsp)', 'Salt and pepper'],
          instruction: 'Pat chicken pieces completely dry with paper towel — this is the key to crispy skin! Rub with minced garlic, paprika, thyme, olive oil, salt and pepper. Air fry in a single layer at 200°C for 25–28 minutes, turning once at the 12-minute mark, until the skin is deep golden and juices run clear.',
        },
        {
          ingredients: ['Potatoes (800g, cut into wedges)', 'Carrots (3, cut into large chunks)', 'Olive oil (2 tbsp)', 'Salt and pepper'],
          instruction: 'While chicken rests, toss potato wedges and carrot chunks in olive oil, salt and pepper. Air fry at 200°C for 18–20 minutes, shaking the basket halfway, until golden at the edges. Cook in batches if needed.',
        },
        {
          ingredients: ['Broccoli (1 head, cut into florets)'],
          instruction: 'Steam or microwave the broccoli for 4–5 minutes until just tender. Serve everything together.',
        },
      ],
    },
  ],

  'burgers': [
    {
      method: 'air-fryer',
      label: 'Air Fryer',
      icon: '💨',
      note: 'Cook chips first, keep warm in the oven, then cook the patties — most air fryers can\'t fit both at once.',
      steps: [
        {
          ingredients: ['Frozen oven chips (500g bag)'],
          instruction: 'Spread chips in a single layer in the air fryer basket. Air fry at 200°C for 14–16 minutes, shaking the basket halfway, until golden and crispy. Keep warm in a low oven while you cook the patties.',
        },
        {
          ingredients: ['Beef mince (600g)', 'Egg (1, for binding)', 'Worcestershire sauce (1 tbsp)', 'Cheddar cheese slices (4)', 'Salt and pepper'],
          instruction: 'Mix beef mince with egg, Worcestershire sauce, salt and pepper. Form into 4 patties. Air fry at 190°C for 10–12 minutes, flipping once at 5 minutes. Lay a cheese slice on each patty for the last 2 minutes of cooking.',
        },
        {
          ingredients: ['Burger buns (4)', 'Iceberg lettuce (a few leaves, shredded)', 'Tomato (2 medium, sliced)', 'Ketchup (to serve)', 'American mustard (to serve)'],
          instruction: 'Toast buns in the air fryer cut-side up for 1–2 minutes. Assemble: sauce, lettuce, tomato, cheesy patty, more sauce. Serve with the crispy chips.',
        },
      ],
    },
  ],

  'fish-fingers': [
    {
      method: 'air-fryer',
      label: 'Air Fryer',
      icon: '💨',
      note: 'Don\'t overlap the fish fingers — a single layer gives the crispiest result.',
      steps: [
        {
          ingredients: ['Fish fingers (10–12, 1 x 450g box)'],
          instruction: 'Arrange fish fingers in a single layer in the air fryer basket. No oil needed. Air fry at 200°C for 10–12 minutes, turning once at the 6-minute mark, until golden and crispy. They come out much crispier than the oven!',
        },
        {
          ingredients: ['Frozen oven chips (500g bag)', 'Frozen peas (1 cup / 150g)', 'Carrots (2, peeled and sliced into rounds)', 'Tartare sauce (to serve)', 'Lemon wedges (to serve)'],
          instruction: 'After the fish fingers are done, air fry chips at 200°C for 13–15 minutes. Steam peas and carrots separately for 4–5 minutes. Serve together with tartare sauce and lemon wedges.',
        },
      ],
    },
  ],

  'curry': [
    {
      method: 'pressure-cooker',
      label: 'Pressure Cooker',
      icon: '⚡',
      note: 'Requires an Instant Pot or electric pressure cooker with a Sauté function.',
      steps: [
        {
          ingredients: ['Onion (1, diced)', 'Garlic (2 cloves, minced)', 'Mild curry paste (3 tbsp, e.g. Patak\'s)', 'Vegetable oil (2 tbsp)'],
          instruction: 'Set your pressure cooker to Sauté on medium heat. Heat oil, cook the onion for 3 minutes until soft. Add garlic and stir for 1 minute. Add the curry paste and stir constantly for 2 minutes until fragrant — this is the key flavour-building step.',
        },
        {
          ingredients: ['Chicken breast (600g, cut into bite-size pieces)', 'Coconut milk (400ml can)', 'Potatoes (400g, peeled and cut into 2cm cubes)'],
          instruction: 'Add chicken pieces and stir to coat in the paste. Pour in the coconut milk and add potato cubes. Seal the lid and set to High Pressure for 8 minutes. While it cooks, start your rice on the stovetop.',
        },
        {
          ingredients: ['Frozen peas (1 cup / 150g)', 'Salt'],
          instruction: 'Quick release the pressure. Switch back to Sauté. Stir in the frozen peas and cook for 2 minutes. Taste, add salt if needed. Serve over rice — dinner in under 30 minutes!',
        },
      ],
    },
  ],

  'minestrone': [
    {
      method: 'pressure-cooker',
      label: 'Pressure Cooker',
      icon: '⚡',
      note: 'Don\'t add pasta before pressure cooking — it will go completely mushy. Add it after on Sauté.',
      steps: [
        {
          ingredients: ['Onion (1, diced)', 'Garlic (2 cloves, minced)', 'Carrots (2, diced)', 'Celery (3 stalks, diced)', 'Olive oil (2 tbsp)'],
          instruction: 'Set pressure cooker to Sauté. Heat oil and cook onion, carrot and celery for 5 minutes until softened. Add garlic and cook 1 minute more.',
        },
        {
          ingredients: ['Canned crushed tomatoes (2 x 400g cans)', 'Cannellini beans (400g can, drained and rinsed)', 'Zucchini (2, diced)', 'Vegetable stock (1L carton)'],
          instruction: 'Add tomatoes, stock, zucchini and cannellini beans. Seal the lid and cook on High Pressure for 5 minutes. Quick release.',
        },
        {
          ingredients: ['Small pasta shapes (150g, e.g. ditalini or small elbows)', 'Fresh parsley (handful, roughly chopped)', 'Parmesan cheese (to serve)', 'Salt and pepper'],
          instruction: 'Switch back to Sauté. Add pasta and cook for 8–10 minutes, stirring occasionally, until tender. Season well with salt and pepper. Ladle into bowls and finish with fresh parsley and parmesan.',
        },
      ],
    },
  ],

  'chicken-noodle-soup': [
    {
      method: 'pressure-cooker',
      label: 'Pressure Cooker',
      icon: '⚡',
      note: 'Pressure cooking makes an incredibly rich, flavourful broth in a fraction of the time.',
      steps: [
        {
          ingredients: ['Chicken breast (500g, whole)', 'Onion (1, diced)', 'Garlic (2 cloves, whole)', 'Carrots (2, diced)', 'Celery (3 stalks, diced)', 'Chicken stock (1.5L)', 'Salt and pepper'],
          instruction: 'Add the whole chicken breast, onion, garlic, carrots, celery and stock to the pressure cooker. Season. Seal the lid and cook on High Pressure for 15 minutes.',
        },
        {
          ingredients: [],
          instruction: 'Quick release the pressure. Remove the chicken breast and shred with two forks into bite-size pieces. Return the shredded chicken to the broth.',
        },
        {
          ingredients: ['Egg noodles (200g)', 'Fresh parsley (small bunch, roughly chopped)'],
          instruction: 'Switch to Sauté. Add the noodles and cook for 5 minutes until tender. Taste and adjust seasoning. Ladle into big bowls and scatter over fresh parsley.',
        },
      ],
    },
  ],

  'pasta-bolognese': [
    {
      method: 'pressure-cooker',
      label: 'Pressure Cooker',
      icon: '⚡',
      note: 'Pressure cooking deepens the bolognese flavour in minutes. Cook pasta separately on the stovetop.',
      steps: [
        {
          ingredients: ['Onion (1, finely diced)', 'Garlic (3 cloves, minced)', 'Carrots (1, finely diced)', 'Celery (1 stick, finely diced)', 'Beef mince (500g)', 'Olive oil (2 tbsp)'],
          instruction: 'Set pressure cooker to Sauté. Heat oil and cook onion, carrot and celery for 4 minutes. Add garlic for 1 minute. Turn heat to high, add beef mince and break it up well. Cook until browned all over — don\'t rush this.',
        },
        {
          ingredients: ['Pasta sauce (700g jar)', 'Dried oregano (1 tsp)', 'Salt and pepper'],
          instruction: 'Add pasta sauce and dried oregano. Season. Seal the lid and cook on High Pressure for 10 minutes. Natural release for 5 minutes, then quick release.',
        },
        {
          ingredients: ['Spaghetti (400g)', 'Parmesan cheese (50g, to serve)'],
          instruction: 'While the sauce pressure cooks, boil your spaghetti in well-salted water until al dente. Toss pasta with the bolognese sauce, adding a splash of pasta water to loosen. Serve with parmesan.',
        },
      ],
    },
  ],

  'shepherds-pie': [
    {
      method: 'pressure-cooker',
      label: 'Pressure Cooker',
      icon: '⚡',
      note: 'Use the pressure cooker for the filling, then finish in the oven for the golden mash topping.',
      steps: [
        {
          ingredients: ['Lamb mince (700g)', 'Onion (1, diced)', 'Garlic (2 cloves, minced)', 'Carrots (2, diced)', 'Tomato paste (1 tbsp)', 'Worcestershire sauce (1 tbsp)', 'Beef stock (250ml)', 'Olive oil (1 tbsp)'],
          instruction: 'Set pressure cooker to Sauté. Heat oil and cook onion and carrot for 4 minutes. Add garlic for 1 minute. Add lamb mince, breaking it up until browned. Stir in tomato paste, Worcestershire sauce and beef stock. Season. Seal and cook on High Pressure for 8 minutes. Quick release.',
        },
        {
          ingredients: ['Frozen peas (1 cup / 150g)', 'Potatoes (1kg, peeled and quartered)', 'Butter (60g)', 'Milk (100ml, warm)'],
          instruction: 'Stir peas into the lamb filling and pour into a baking dish. Meanwhile, boil potatoes in salted water until tender, drain and mash with butter and warm milk until smooth and creamy.',
        },
        {
          ingredients: [],
          instruction: 'Spread the mash evenly over the filling, run a fork over the surface to create texture, and bake at 180°C for 25–30 minutes until the top is golden. Rest for 5 minutes before serving.',
        },
      ],
    },
  ],

  'homemade-pizza': [
    {
      method: 'air-fryer',
      label: 'Air Fryer',
      icon: '💨',
      note: 'Cook one pizza at a time — the base gets wonderfully crispy underneath, even better than the oven!',
      steps: [
        {
          ingredients: ['Pizza bases (4 small or 2 large, store-bought)', 'Pizza sauce (250g jar)', 'Mozzarella cheese (300g, grated)'],
          instruction: 'Spread pizza sauce over each base leaving a 1–2cm border. Scatter over a generous layer of mozzarella.',
        },
        {
          ingredients: ['Pepperoni (100g, sliced)', 'Red capsicum (1, thinly sliced)', 'Mushrooms (150g, thinly sliced)', 'Dried oregano (1 tsp)', 'Olive oil (for drizzling)'],
          instruction: 'Add toppings, scatter remaining cheese and dried oregano over the top, and drizzle with olive oil. Air fry one pizza at a time at 180°C for 6–8 minutes until the cheese is bubbling and the base is crispy underneath. Check at 6 minutes — air fryers vary.',
        },
      ],
    },
  ],

  'chicken-skewers': [
    {
      method: 'air-fryer',
      label: 'Air Fryer',
      icon: '💨',
      note: 'Use shorter skewers that fit your air fryer basket, or cut wooden skewers down to size.',
      steps: [
        {
          ingredients: ['Jasmine rice (1½ cups / 300g, uncooked)'],
          instruction: 'Cook jasmine rice according to packet instructions. Keep warm.',
        },
        {
          ingredients: ['Chicken breast (600g, cut into 3cm cubes)', 'Soy sauce (4 tbsp)', 'Honey (2 tbsp)', 'Garlic (2 cloves, minced)', 'Sesame oil (1 tsp)', 'Red capsicum (1, cut into 3cm chunks)', 'Green capsicum (1, cut into 3cm chunks)', 'Red onion (1, cut into 3cm chunks)', 'Wooden skewers (12, soaked in water for 30 minutes)'],
          instruction: 'Mix soy sauce, honey, garlic and sesame oil. Add chicken and marinate for at least 10 minutes. Thread onto skewers alternating with capsicum and onion.',
        },
        {
          ingredients: ['Sesame seeds (to serve)'],
          instruction: 'Air fry skewers at 200°C for 12–14 minutes, turning once halfway and brushing with any leftover marinade. The chicken should be cooked through and caramelised on the outside. Serve over rice with sesame seeds.',
        },
      ],
    },
    {
      method: 'oven',
      label: 'Oven',
      icon: '🔥',
      note: 'Great if you\'re cooking a big batch — the oven handles more skewers at once than a grill.',
      steps: [
        {
          ingredients: ['Jasmine rice (1½ cups / 300g, uncooked)'],
          instruction: 'Preheat oven to 220°C. Cook jasmine rice according to packet instructions. Keep warm.',
        },
        {
          ingredients: ['Chicken breast (600g, cut into 3cm cubes)', 'Soy sauce (4 tbsp)', 'Honey (2 tbsp)', 'Garlic (2 cloves, minced)', 'Sesame oil (1 tsp)', 'Red capsicum (1, cut into 3cm chunks)', 'Green capsicum (1, cut into 3cm chunks)', 'Red onion (1, cut into 3cm chunks)', 'Wooden skewers (12, soaked in water for 30 minutes)'],
          instruction: 'Mix soy sauce, honey, garlic and sesame oil. Marinate chicken for at least 10 minutes. Thread onto skewers with capsicum and onion.',
        },
        {
          ingredients: ['Sesame seeds (to serve)'],
          instruction: 'Place skewers on a foil-lined baking tray. Bake at 220°C for 20–22 minutes, turning once halfway and basting with remaining marinade. Serve over rice with sesame seeds.',
        },
      ],
    },
  ],

  'nachos': [
    {
      method: 'air-fryer',
      label: 'Air Fryer',
      icon: '💨',
      note: 'Use a small foil tray or air fryer liner so the chips don\'t fall through the basket.',
      steps: [
        {
          ingredients: ['Corn chips (200g bag)', 'Refried beans or black beans (400g can)', 'Tasty cheese (2 cups / 200g, grated)'],
          instruction: 'Place a foil tray or liner in the air fryer basket. Layer chips, dollop on beans and scatter over cheese. Air fry at 180°C for 4–5 minutes until the cheese is fully melted and the edges are starting to brown. Watch closely!',
        },
        {
          ingredients: ['Salsa (300g jar)', 'Sour cream (200g tub)', 'Avocados (2, diced or sliced)', 'Jalapeños (to taste, optional)', 'Spring onions (2, sliced, to serve)'],
          instruction: 'Bring straight to the table and add cold toppings immediately — salsa, sour cream, avocado, jalapeños and spring onions. Eat straight away before the chips soften.',
        },
      ],
    },
  ],
}
