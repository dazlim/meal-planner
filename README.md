# What's for Dinner? 🍽️

A fun visual menu app for toddlers to help choose family dinners!

## Getting Started

1. **Add your meal images** to `public/images/` folder
   - Name them to match the entries in `data/meals.ts` (e.g., `honey-soy-salmon.png`, `lasagna.png`, etc.)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Deploy to Vercel

1. Push this folder to a GitHub repository
2. Import to Vercel
3. Deploy!

## Required Environment Variables (Vercel)

For AI meal generation and custom-recipe storage:

- `OPENAI_API_KEY`
- `ADMIN_PASSWORD`
- One KV/Redis option:
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` (Vercel KV)
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (Upstash REST)

If you accidentally set `VK_REST_API_URL` / `VK_REST_API_TOKEN`, rename them to `KV_*`.

## Meal Images Needed

Add these 21 images to `public/images/`:
- honey-soy-salmon.png
- noodle-stir-fry.png
- lasagna.png
- pasta-bolognese.png
- roast-chicken.png
- sushi.png
- prawn-pasta.png
- sausage-pasta.png
- burgers.png
- fish-fingers.png
- curry.png
- tacos.png
- minestrone.png
- nachos.png
- chicken-noodle-soup.png
- eggs-on-toast.png
- pork-rice.png
- prawn-rice-bowls.png
- shepherds-pie.png
- homemade-pizza.png
- chicken-skewers.png
