# UMCE.online

Este proyecto es la evolucion de virtual.udfv.cloud. NO es un proyecto nuevo.

## Reglas criticas

- Stack: Express + vanilla JS + Tailwind CDN (NO Next.js, NO React)
- Auth: Google OAuth @umce.cl (NO Supabase Auth)
- DB: Extender schema `portal` en Supabase self-hosted (NO schema nuevo)
- PIAC: Se lee desde Google Drive API (NO formulario web que reemplaza el Word)
- IA: NO crea ni modifica nada. Solo observa, relaciona, presenta y alerta.
- PRD: Debe ser aprobado por David ANTES de ejecutar Task Master o escribir codigo.

## Contexto obligatorio antes de codificar

1. Leer pagina indice Notion: https://www.notion.so/32e0778552798118ab7dcf2563971f21
2. Leer codigo de virtual.udfv.cloud: ~/Documents/43_VIRTUAL_UMCE_WEB/
3. Leer CEREBRO: ~/Documents/00_CEREBRO/ESTADO-ACTUAL.md (buscar proyecto 10)
