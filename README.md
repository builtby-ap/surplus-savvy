# Phoe La Min

Build the frontend for Surplus Rescue, a food-waste-rescue marketplace web app. Restaurants, cafes, bakeries, grocery stores, fresh markets, snack shops, convenience stores, and food producers list surplus food as discounted "mystery bags" with a limited quantity and a pickup/delivery time window. Customers browse bags, reserve one, and pay cash on delivery or pickup.

Design system — use these exact tokens everywhere, don't substitute a default palette:
- Background: cream #FFFBF2
- Primary / headings / nav: navy #526B91
- Accent (prices, highlights, CTAs): gold #E9B949
- Warning / urgency (low stock, closing soon): coral #E87552
- Success / eco stats: sage #6F9B78
Warm, food-forward, generous rounded cards, mobile-first, real photography-style placeholder images (not icons) for bags and businesses.

Set up three experiences behind route groups: a public marketplace, a business dashboard, and an admin dashboard, plus /login, /register, /forgot-password. Build a sticky header with logo, search bar, cart/orders icon, and a notification bell.

No backend yet — everything runs on realistic mock data: create sample data for 8-10 businesses across types (restaurant, cafe, bakery, grocery, fresh_market, snack_shop, convenience, producer) and 15-20 mystery bags across categories (mixed_meals, rice & meals, noodles, fast food, BBQ & grills, bakery, desserts & cakes, cafe & tea, beverages), each with an original price, a discounted price, quantity left, and an available-until time.

Scaffold empty routes for every page we'll build next (marketplace home, bag detail, business profile, search, checkout, order confirmation, customer dashboard with orders/favorites/addresses/settings, business dashboard with mystery-bags/orders/delivery/analytics, admin dashboard with users/businesses/settings) — placeholder content is fine, we'll fill each one in over the next prompts.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a104f6fa-5116-4e9f-822d-dcee58556f6c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
