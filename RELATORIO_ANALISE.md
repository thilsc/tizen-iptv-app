# Relatório de Análise — Tizen IPTV OTT App

**Projeto:** `tizen-iptv-app`  
**Diretório:** `/home/thiago/Documentos/src/tizen-iptv-app`  
**Data da análise:** 28/10/2026  
**Branch:** `master` (working tree limpo)

---

## 1. Visão geral

Aplicativo OTT estilo Netflix para TVs Samsung Tizen, desenvolvido em **React 19 + TypeScript + Vite**, com **Styled Components**, **Zustand**, **Shaka Player**, **i18next** e **React Router**. Conecta-se a painéis **Xtream Codes** para Live TV, VOD (filmes) e Séries, e enriquece metadados via **TMDB**.

- Build de produção: **OK** (`tsc -b && vite build`).
- Lint: **38 problemas** (24 erros, 14 avisos).
- Testes automatizados: **nenhum**.
- Cobertura de i18n: **75 chaves usadas na UI**, das quais **~47 não existem** nos arquivos `en.json`/`tr.json`.

---

## 2. Features implementadas

### 2.1 Autenticação e sessão
- Login com servidor Xtream Codes (URL, usuário, senha).
- "Lembrar-me" e auto-login a partir de credenciais salvas no `localStorage`.
- Logout e limpeza de credenciais.
- Rota protegida (`ProtectedRoute`) redirecionando para `/login`.

### 2.2 Home
- Hero slider com conteúdo em destaque (gerado a partir de listas carregadas).
- Seções: "Continuar assistindo", "Favoritos", "TV ao vivo", "Filmes", "Séries".

### 2.3 TV ao vivo
- Categorias de canais e listagem.
- Card de canal com EPG "agora" e "a seguir".
- Player de canal ao vivo (`/live/:id`).

### 2.4 Filmes (VOD)
- Categorias e grade de filmes.
- Página de detalhe com backdrop/poster, metadados TMDB, elenco, gêneros, sinopse.
- Botões "Reproduzir" e "Favoritar".
- Filmes similares (mesma categoria).

### 2.5 Séries
- Categorias e grade de séries.
- Página de detalhe com temporadas/episódios.
- Player de episódio com progresso por episódio.

### 2.6 Player de vídeo (Shaka Player)
- Reprodução de HLS/TS/MP4/MKV.
- Controles: play/pause, seek ±10s, barra de progresso, tempo.
- Seleção de qualidade, legendas e faixa de áudio.
- Velocidade de reprodução (0.5x–2x).
- Salvamento de progresso (a cada 5s) e marcação de concluído (>90%).
- Overlay de loading/erro com retry.

### 2.7 Busca
- Busca local em filmes, séries e canais (≥2 caracteres).

### 2.8 Favoritos e histórico
- Store de favoritos e histórico de reprodução (`userDataStore`).
- Exportar/importar dados do usuário.
- "Continuar assistindo" e "Assistidos recentemente".

### 2.9 Configurações
- Tema claro/escuro.
- Idioma (tr/en).
- Controle parental (toggle + PIN de 4 dígitos).
- Logout e informações de versão.

### 2.10 Navegação por controle remoto
- `FocusProvider` com navegação espacial por setas.
- `useFocusable` / `useKeyboardNavigation` com keycodes de TV (Enter, Back, cores, etc.).
- Suporte a grupos e mapeamento explícito de direções.

### 2.11 Internacionalização
- i18next com recursos `tr` e `en`.
- Troca de idioma sincronizada com `settingsStore`.

### 2.12 Integração TMDB
- Busca de filme/série por título/ano.
- Detalhes, elenco, vídeos, similares, trending.

---

## 3. Arquitetura (resumo)

```
src/
├── App.tsx                 # Rotas e providers
├── components/
│   ├── content/            # Cards, HeroSlider, VideoPlayer
│   ├── layout/             # Layout, Navbar
│   └── ui/                 # Button, Card, Carousel, Grid, Input, Loading, Modal, Tabs
├── hooks/                  # useFocusable, useKeyboardNavigation, usePlayer
├── i18n/                   # index.ts, en.json, tr.json
├── pages/                  # 12 páginas
├── providers/              # FocusProvider, ThemeProvider
├── services/               # xtreamService, tmdbService
├── store/                  # auth, content, settings, tmdb, userData
├── styles/                 # theme, globalStyles
├── types/                  # Tipagens
└── utils/                  # dateUtils, keyboardUtils
```

---

## 4. Bugs encontrados

### 4.1 Críticos / funcionais

| # | Arquivo | Descrição |
|---|---------|-----------|
| B1 | `store/contentStore.ts` (`fetchLiveStreams`, `fetchMovies`, `fetchSeries`) | As páginas chamam apenas `fetch*Categories`. **Nunca são chamados `fetchLiveStreams`, `fetchMovies`, `fetchSeries`**, então `liveChannels`, `movies` e `series` permanecem vazios. Resultado: Home, Live TV, Filmes, Séries e Busca ficam sem conteúdo. |
| B2 | `store/contentStore.ts` | `liveChannels` nunca é populado (apenas `liveStreams`). Consumers usam `liveChannels` → listas vazias mesmo após fetch. |
| B3 | `store/contentStore.ts` | `fetchSeries` popula apenas `seriesList`, mas UI usa `series` → séries não aparecem. |
| B4 | `pages/MoviesPage.tsx`, `SeriesPage.tsx`, `LiveTVPage.tsx` | Filtro local por categoria, mas não disparam fetch das streams; `selectedCategory` inicial não carrega dados. |
| B5 | `pages/HomePage.tsx` (`featuredContent`) | `HeroSlider` recebe objetos `{id,type,streamId}` mas espera `Movie/Series/Channel` (com `name`, `cover`, `stream_id`). Hero renderiza vazio e navegação quebrada (`'stream_id' in item` é falso). |
| B6 | `pages/HomePage.tsx` (Favoritos) | Busca filme/série/canal por `item.id`, mas `Favorite.id` é `Date.now()` (id do favorito). Deveria usar `item.streamId`. Favoritos nunca resolvidos. |
| B7 | `pages/MovieDetailPage.tsx` / `SeriesDetailPage.tsx` | Favorito verificado por `f.id === stream_id` (deveria ser `f.streamId`). `removeFavorite(stream_id)` passa id de stream em vez do id do favorito → não remove. |
| B8 | `pages/MovieDetailPage.tsx` / `SeriesDetailPage.tsx` | `handlePlay`/`handleEpisodeClick` chamam fetch de stream e setam `isPlaying=true` **antes** da promise resolver. `VideoPlayer` recebe `url=null` → erro de reprodução. |
| B9 | `pages/SeriesDetailPage.tsx` / `usePlayer` | Watch history de série salva `streamId = episode.id`, mas `SeriesCard`/Home verificam `series_id` → "Continuar assistindo"/badges de série nunca aparecem. |
| B10 | `components/content/ChannelCard.tsx` | EPG usa `formatTime(parseInt(epg_now.start))`, mas `start` é string de data; `parseInt` retorna `NaN`. Horários incorretos (deveria usar `start_timestamp`). |
| B11 | `pages/SettingsPage.tsx` | `handleParentalControlToggle` usa `!parentalControl` onde `parentalControl` é objeto → sempre `false` (toggle inoperante). Condicional de PIN usa `parentalControl &&` (sempre truthy). |
| B12 | `components/ui/Tabs.tsx` | Chama `useFocusable` dentro de `.map()` (callback) → violação das Rules of Hooks. Pode quebrar foco/render. |
| B13 | `i18n/index.ts` | Usa `require()` dentro de `setTimeout` (proibido pelo ESLint/bundler). Risco de falha em build/produção e circular dependency frágil. |
| B14 | `config.xml` | Referencia `icon.png`, mas o arquivo não existe no projeto → empacotamento Tizen pode falhar. |
| B15 | `pages/MovieDetailPage.tsx` | `t('movieDetail.noDescription')`, etc. não existem nos JSONs → UI exibe a chave literal. |

### 4.2 Médios

| # | Arquivo | Descrição |
|---|---------|-----------|
| B16 | `store/userDataStore.ts` (`addToFavorites`) | `id: Date.now()` pode colidir em cliques rápidos; `removeFromFavorites(id)` depende desse id. |
| B17 | `store/contentStore.ts` (`fetchFeaturedContent`) | Usa `.sort()` in-place sobre arrays do store → muta ordem de movies/series/channels. |
| B18 | `hooks/usePlayer.ts` | `addToWatchHistory` chamado a cada 5s com `name: 'Unknown'` → histórico com nome genérico. |
| B19 | `pages/LiveTVPlayerPage.tsx` | `isLoading` inicial `false`; se canal não for encontrado, tela pode travar em loading ou erro inconsistente. |
| B20 | `pages/SeriesDetailPage.tsx` | `isLoading` do store compartilhado; troca de temporada pode não refletir loading corretamente. |
| B21 | `services/xtreamService.ts` | `loadCredentials` faz `JSON.parse` sem try/catch → crash se storage corrompido. |
| B22 | `services/tmdbService.ts` | Chave/token TMDB hardcoded no código (segurança + rate limit). |
| B23 | `authStore.ts` | `authenticate` sempre salva credenciais no service; `login` remove depois se `!rememberMe` (ordem frágil). |
| B24 | `pages/HomePage.tsx` | `HeroSlider` `handleInfo` navega para `/movie/:id/details` (rota inexistente) → fallback para home. |
| B25 | `components/content/HeroSlider.tsx` | `itemType` determinado por `'stream_id' in currentItem`; para featured (que usa `streamId`) sempre "series"/errado. |
| B26 | `components/ui/Carousel.tsx` | `useKeyboardNavigation` global pode capturar setas mesmo fora de foco (condição `isFocused` ajuda, mas efeito não reexecuta ao mudar foco). |
| B27 | `pages/SettingsPage.tsx` | `setParentalControl(!parentalControl)` passa boolean para função que espera `(enabled, pin?)`, e `set` com cast `as AppSettings` pode sobrescrever campos. |

### 4.3 Menores / estilo

- `index.html` com título "Vite + React + TS" e favicon padrão do Vite.
- `tsconfig.app.json` com `strict: false`, `noImplicitAny: false`, `strictNullChecks: false` (mascara erros).
- `@ts-ignore` em `usePlayer.ts` (deveria ser `@ts-expect-error`).
- `any` disseminado em vários arquivos.
- `node_modules` e `dist.zip` commitados? `dist.zip` está no repo (1.3MB) — artefato binário versionado.
- `config.xml` e `config_new.xml` duplicados e idênticos.

---

## 5. Gaps (funcionalidades ausentes/incompletas)

1. **Página de Favoritos (`/favorites`)** referenciada na Navbar, mas não existe rota nem componente → navega para fallback (home).
2. **Página de Perfil (`/profile`)** referenciada na Navbar/ProfileMenu, mas não existe → fallback.
3. **Controle parental não aplicado**: `isContentBlocked`/`validateParentalPin` existem, mas nenhuma página filtra conteúdo ou pede PIN.
4. **Limpar dados do usuário** (`clearUserData`) não está exposto nas configurações.
5. **Exportar/importar backup** (`exportUserData`/`importUserData`) não exposto na UI.
6. **EPG completo**: apenas short EPG; não há grade de programação por canal/tempo.
7. **Busca remota Xtream**: `searchAll` existe no service mas a UI só busca no que já foi carregado (listas vazias → busca inútil hoje).
8. **Múltiplos perfis de usuário**: não implementado.
9. **Legendas externas / seleção de áudio real**: player expõe, mas depende do stream.
10. **DRM**: parâmetros aceitos no player, mas nunca passados por nenhuma página.
11. **Notificações/erros globais**: sem boundary de erro.
12. **Acessibilidade/TV**: foco em Navbar não usa `useFocusable`; navegação por controle remoto limitada em algumas telas.
13. **Testes**: nenhum teste unitário/e2e.
14. **Icon do app (`icon.png`)** ausente.
15. **Analytics/telemetria**: ausente (opcional).
16. **Persistência de posição ao trocar de página**: parcial (salva a cada 5s, mas não restaura `startPosition` nas páginas).
17. **Internacionalização incompleta**: ~47 chaves usadas não traduzidas; textos hardcoded (ex.: "See All", "✓ Watched", "Watching", "S/E").

---

## 6. Pontos de melhoria

### 6.1 Qualidade de código
- Habilitar `strict: true`, `noImplicitAny`, `strictNullChecks` e corrigir erros resultantes.
- Substituir `any` por tipos adequados (especialmente em services e handlers de input).
- Resolver violação de hooks em `Tabs.tsx` (extrair `TabItem`).
- Trocar `require()` por import dinâmico em `i18n/index.ts`.
- Remover `@ts-ignore`.

### 6.2 Performance
- Code-splitting: `player` chunk tem 714KB. Usar `React.lazy`/dynamic import para páginas e player.
- `fetchFeaturedContent` recalcula a cada visita; cachear/memoizar.
- Evitar `.sort()` in-place; usar cópias.
- Imagens: usar tamanhos TMDB apropriados e lazy loading.

### 6.3 Segurança
- Mover credenciais TMDB para variáveis de ambiente (Vite `import.meta.env`).
- Não persistir senha em texto plano no `localStorage` sem criptografia (ou ao menos documentar risco).
- Validar/sanitizar URLs de servidor (XSS via `dangerouslySetInnerHTML` não usado, mas URLs injetadas em `src`).

### 6.4 UX / TV
- Restaurar foco e posição de scroll ao navegar.
- Indicador visual de foco consistente em todos os componentes interativos (Navbar, Tabs).
- Tratamento de estados vazios/erro com retry em todas as páginas.
- Feedback de carregamento em ações (favoritar, etc.).
- Suporte a botão "Back" do controle remoto em todas as telas (hoje principalmente no player).

### 6.5 Dados / estado
- Centralizar fetch inicial (ex.: ao autenticar, carregar categorias + streams).
- Unificar `liveChannels`/`liveStreams` e `series`/`seriesList`.
- Corrigir mapeamento de favoritos (`streamId` vs `id`).
- Corrigir rastreamento de progresso de séries (armazenar `seriesId` além de `episodeId`).

### 6.6 Tizen / build
- Adicionar `icon.png` (ou ajustar `config.xml`).
- Remover `config_new.xml` duplicado.
- Remover `dist.zip` do versionamento.
- Validar `required_version` e perfil alvo.
- Adicionar CSP/whitelist de domínios no `config.xml` se necessário.

---

## 7. Recomendações priorizadas

**P0 (bloqueiam uso básico):**
1. Chamar `fetchLiveStreams`/`fetchMovies`/`fetchSeries` nas páginas (B1, B4).
2. Unificar `liveChannels`/`liveStreams` e `series`/`seriesList` (B2, B3).
3. Corrigir favoritos (`streamId`) (B6, B7).
4. Corrigir play assíncrono (B8).
5. Corrigir controle parental toggle (B11).

**P1 (qualidade/estabilidade):**
6. Refatorar `Tabs.tsx` (B12).
7. Corrigir i18n `require()` (B13) e adicionar chaves faltantes.
8. Corrigir EPG time (B10).
9. Corrigir HeroSlider (B5, B24, B25).
10. Adicionar `icon.png` (B14).

**P2 (melhorias):**
11. Implementar páginas Favoritos/Perfil ou remover links.
12. Aplicar controle parental.
13. Code-splitting e testes.
14. Hardening de segurança (TMDB keys).

---

## 8. Métricas coletadas

- Arquivos de código (src): ~60.
- Páginas: 12 (`Home`, `Login`, `LiveTV`, `LiveTVPlayer`, `Movies`, `MovieDetail`, `Series`, `SeriesDetail`, `Search`, `Settings`).
- Stores: 5 (`auth`, `content`, `settings`, `tmdb`, `userData`).
- Serviços: 2 (`xtreamService`, `tmdbService`).
- Build: sucesso (6 chunks; player 714KB).
- Lint: 24 erros, 14 avisos.
- i18n: 75 chaves usadas; ~47 ausentes em `en.json`/`tr.json`.

---

*Relatório gerado por análise estática do código-fonte e execução de build/lint. Recomenda-se validação manual em emulador/dispositivo Tizen para confirmar comportamento de navegação e reprodução.*
