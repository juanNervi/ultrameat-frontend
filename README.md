# Ultra Meat — Demo comercial

Aplicación Nuxt para TERMILCO SAS / Ultra Meat: consolida ventas diarias, KPIs, crédito por canal y exportación contable (demo con datos mock).

**Demo en vivo (GitHub Pages):** https://juannervi.github.io/ultrameat-frontend/

## Stack

- Nuxt 3 + Vue 3 + TypeScript
- Tailwind CSS
- Chart.js
- Persistencia en `localStorage`

## Pantallas

Acceso simple por nombre (sin roles):

- Dashboard
- Canales y crédito
- Carga de ventas
- Exportación contable

## Desarrollo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000), ingresá un nombre y recorré las pantallas.

## Deploy a GitHub Pages

1. Subí el código a `main` (el workflow `.github/workflows/deploy-pages.yml` corre solo).
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cuando el workflow termine, la demo queda en:
   `https://juannervi.github.io/ultrameat-frontend/`

Generación local:

```bash
# PowerShell
$env:NUXT_APP_BASE_URL="/ultrameat-frontend/"; npm run generate
```

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build server
- `npm run generate` — sitio estático (Pages)
- `npm run preview` — previsualizar build
