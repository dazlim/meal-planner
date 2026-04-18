export interface ShoppingHintResult {
  packageHint: string
  crossMealIds: string[]
}

const HINTS: Array<{
  keywords: string[]
  packageHint: string
  crossMealIds: string[]
}> = [
  {
    keywords: ['pasta sauce', 'passata'],
    packageHint: 'Sold in 700g jars — one jar is perfect for this meal.',
    crossMealIds: ['lasagna', 'pasta-bolognese', 'sausage-pasta'],
  },
  {
    keywords: ['canned tomatoes', 'crushed tomatoes', 'tinned tomatoes'],
    packageHint: 'Sold in 400g cans — you\'ll need 2 cans for this recipe.',
    crossMealIds: ['minestrone'],
  },
  {
    keywords: ['coconut milk'],
    packageHint: 'Sold in 400ml cans — one can is exactly right for this recipe.',
    crossMealIds: ['curry'],
  },
  {
    keywords: ['cannellini beans', 'white beans'],
    packageHint: 'Sold in 400g cans — one can, drained and rinsed.',
    crossMealIds: ['minestrone'],
  },
  {
    keywords: ['jasmine rice'],
    packageHint: 'Sold in 2kg bags — keeps for months in the pantry.',
    crossMealIds: ['honey-soy-salmon', 'curry', 'pork-rice', 'prawn-rice-bowls', 'chicken-skewers'],
  },
  {
    keywords: ['beef mince'],
    packageHint: 'Usually sold in 500g packs — check the quantity needed above.',
    crossMealIds: ['lasagna', 'pasta-bolognese', 'burgers', 'tacos'],
  },
  {
    keywords: ['chicken breast'],
    packageHint: 'Sold loose or in ~600g packs — buy what the recipe calls for.',
    crossMealIds: ['noodle-stir-fry', 'curry', 'chicken-noodle-soup', 'chicken-skewers'],
  },
  {
    keywords: ['chicken stock', 'chicken broth'],
    packageHint: 'Sold in 1L cartons — check the pantry, you might already have one!',
    crossMealIds: ['chicken-noodle-soup'],
  },
  {
    keywords: ['vegetable stock', 'vegetable broth'],
    packageHint: 'Sold in 1L cartons — great to keep a couple in the pantry.',
    crossMealIds: ['minestrone'],
  },
  {
    keywords: ['beef stock', 'beef broth'],
    packageHint: 'Sold in 500ml cartons — one carton is more than enough.',
    crossMealIds: ['shepherds-pie'],
  },
  {
    keywords: ['soy sauce'],
    packageHint: 'Sold in 250ml–500ml bottles — a little goes a long way.',
    crossMealIds: ['honey-soy-salmon', 'noodle-stir-fry', 'pork-rice', 'prawn-rice-bowls', 'chicken-skewers'],
  },
  {
    keywords: ['frozen peas', 'peas'],
    packageHint: 'Sold in 1kg bags — keep in the freezer, lasts for months.',
    crossMealIds: ['curry', 'pork-rice', 'shepherds-pie', 'fish-fingers'],
  },
  {
    keywords: ['frozen chips', 'oven chips'],
    packageHint: 'Sold in 750g–1kg bags — easy to keep in the freezer.',
    crossMealIds: ['burgers', 'fish-fingers'],
  },
  {
    keywords: ['mozzarella', 'mozzarella cheese'],
    packageHint: 'Sold in 300g–400g blocks or pre-grated — grate your own for better melt.',
    crossMealIds: ['lasagna', 'homemade-pizza'],
  },
  {
    keywords: ['parmesan', 'parmesan cheese'],
    packageHint: 'Sold in 100g blocks — a little goes a long way. Keep leftovers wrapped in the fridge.',
    crossMealIds: ['lasagna', 'pasta-bolognese', 'sausage-pasta'],
  },
  {
    keywords: ['ricotta'],
    packageHint: 'Sold in 500g tubs — check the recipe quantity; leftovers work great on toast.',
    crossMealIds: ['lasagna'],
  },
  {
    keywords: ['prawns', 'raw prawns'],
    packageHint: 'Sold fresh or frozen in 400g packs — frozen is great value.',
    crossMealIds: ['prawn-pasta', 'prawn-rice-bowls'],
  },
  {
    keywords: ['sour cream'],
    packageHint: 'Sold in 200g–300g tubs — buy one tub and use across both these meals.',
    crossMealIds: ['tacos', 'nachos'],
  },
  {
    keywords: ['avocado'],
    packageHint: 'Buy a day ahead if they\'re firm — ripen at room temp on the bench.',
    crossMealIds: ['sushi', 'tacos', 'nachos'],
  },
  {
    keywords: ['lasagne sheets', 'lasagna sheets'],
    packageHint: 'Sold in 250g boxes — dried sheets work perfectly here.',
    crossMealIds: ['lasagna'],
  },
  {
    keywords: ['taco seasoning'],
    packageHint: 'Sold in 35g sachets — one sachet is exactly right for 500g of mince.',
    crossMealIds: ['tacos'],
  },
  {
    keywords: ['taco shells', 'hard taco shells'],
    packageHint: 'Sold in boxes of 12 — one box feeds the whole family.',
    crossMealIds: ['tacos'],
  },
  {
    keywords: ['corn chips', 'tortilla chips'],
    packageHint: 'Sold in 175g–200g bags — one bag covers a full baking tray.',
    crossMealIds: ['nachos'],
  },
  {
    keywords: ['nori', 'nori sheets'],
    packageHint: 'Sold in packs of 10 sheets — keep leftovers in an airtight container.',
    crossMealIds: ['sushi'],
  },
  {
    keywords: ['fish fingers'],
    packageHint: 'Sold in boxes of 10–12 (around 450g) — one box is perfect for this meal.',
    crossMealIds: ['fish-fingers'],
  },
  {
    keywords: ['curry paste'],
    packageHint: 'Sold in 283g jars — a jar lasts several meals. Patak\'s mild is great for kids.',
    crossMealIds: ['curry'],
  },
  {
    keywords: ['pizza sauce', 'pizza base sauce'],
    packageHint: 'Sold in 250g jars — one jar does 4 pizza bases.',
    crossMealIds: ['homemade-pizza'],
  },
  {
    keywords: ['pizza bases', 'pizza base'],
    packageHint: 'Sold in packs of 2 (large) or 4 (small) — check the fridge or bakery section.',
    crossMealIds: ['homemade-pizza'],
  },
  {
    keywords: ['lamb mince'],
    packageHint: 'Usually sold in 500g packs — you\'ll need 700g so grab 2 packs.',
    crossMealIds: ['shepherds-pie'],
  },
  {
    keywords: ['hokkien noodles', 'egg noodles', 'stir-fry noodles', 'noodles'],
    packageHint: 'Sold in 450g–500g packs in the fridge section — fresh noodles cook in minutes.',
    crossMealIds: ['noodle-stir-fry', 'chicken-noodle-soup'],
  },
]

export function getHintForIngredient(
  ingredient: string,
  currentMealId: string
): ShoppingHintResult | null {
  const lower = ingredient.toLowerCase()
  const match = HINTS.find((h) => h.keywords.some((k) => lower.includes(k)))
  if (!match) return null
  const crossMealIds = match.crossMealIds.filter((id) => id !== currentMealId)
  return { packageHint: match.packageHint, crossMealIds }
}
