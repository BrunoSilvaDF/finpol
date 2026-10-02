# 016 — Barra superior e painel de dados no celular

- [x] Barra superior fixa (só ≤ 760px) com o nome do app e botão ☰ (`aria-expanded`, `aria-controls`)
- [x] Lateral vira painel deslizante: fecha com ×, clique no fundo escurecido ou Esc; trava a rolagem
      da página enquanto aberto; abre no topo; foco vai para o × e volta ao ☰
- [x] Menu de abas fixo logo abaixo da barra; desktop inalterado
- [x] Tutorial no celular abre o painel nos passos dos campos e fecha no passo do menu (sem animação
      do painel durante o tour; `animate: false` no driver.js para tolerar cliques rápidos)
- [x] Corrige estilos do rodapé duplicados dentro do bloco `@media`
- [x] Verificação no navegador: celular e desktop, claro e escuro, Esc real, cliques normais e rápidos
