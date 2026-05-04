# P0 QA Checklist

Use este checklist depois de mudanças de qualidade/base no frontend.

## Comandos

- `npm run check:p0`
- `npm run build`

## Home

- Abrir `/`.
- Confirmar que hero, carrossel/painel, botões e CTA final renderizam.
- Confirmar que os botões de login e cadastro continuam navegando.
- Confirmar que não há textos com acentos quebrados.

## Admin

- Abrir `/admin/links`.
- Confirmar que sidebar, topbar, cards, botões, campos e modal de adicionar link mantêm o visual padronizado.
- Abrir `/admin/shop`.
- Confirmar que lista/galeria de produtos, importação e modais mantêm contraste e legibilidade.
- Abrir `/admin/design`.
- Confirmar que opções de tema, marca, fundo, superfície, fonte, botão e redes renderizam sem overflow.
- Abrir `/admin/analytics`.
- Confirmar que KPIs, gráficos, tabelas e estados vazios aparecem sem texto cortado.

## Página Pública

- Abrir uma página pública `/:slug`.
- Confirmar que a página real não herdou estilos visuais do admin.
- Abrir `/:slug/shop`.
- Confirmar que produtos e CTAs continuam funcionando.

## Regressão Visual

- Verificar desktop e mobile.
- Procurar sobreposição de textos, botões estourados e cards com contraste ruim.
- Conferir que o fallback "Carregando..." aparece brevemente quando uma rota lazy é carregada.
