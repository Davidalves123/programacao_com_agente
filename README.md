# Space Invaders

Projeto desenvolvido para a disciplina de **Programação com Agente**.

## Integrantes

- David
- Caio
- René

## Sobre o jogo

Uma versão web de Space Invaders feita com HTML, CSS e JavaScript. Enfrente os invasores espaciais no modo solo ou jogue com duas pessoas no mesmo computador. Durante a partida, ganhe pontos, escolha melhorias e use poderes para continuar na batalha.

O jogo também conta com música e efeitos sonoros gerados no navegador usando a Web Audio API, sem arquivos de áudio externos.

## Recursos

- Modos solo e multiplayer local
- Diferentes naves selecionáveis como visuais de jogador
- Pontuação e recorde local
- Melhorias e poderes durante a partida
- Música e efeitos sonoros sintetizados
- Interface em canvas HTML5

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Canvas API e Web Audio API

## Como executar

Não é necessário instalar dependências. Abra `spaceinvaders2/index.html` em um navegador. Para executar usando um servidor local, na pasta raiz do repositório rode:

```bash
python3 -m http.server 8000
```

Depois, acesse [http://localhost:8000/spaceinvaders2/](http://localhost:8000/spaceinvaders2/) no navegador.

## Controles

No menu, pressione `1` para iniciar no modo solo ou `2` para iniciar no modo multiplayer. Também é possível selecionar o modo com o mouse.

| Ação | Jogador 1 | Jogador 2 (multiplayer) |
| --- | --- | --- |
| Mover para esquerda | `A` ou `←` | `←` |
| Mover para direita | `D` ou `→` | `→` |
| Atirar | `W`, `S` ou `Espaço` | `↑` ou `↓` |

No modo solo, as setas esquerda e direita também movimentam a nave. Ao escolher uma melhoria, use as teclas `1`, `2` ou `3`, ou clique na opção. Na tela de fim de jogo, pressione `Enter`, `Espaço` ou clique para voltar ao menu.
