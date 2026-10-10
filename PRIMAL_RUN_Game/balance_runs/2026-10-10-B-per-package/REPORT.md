# Del B pr. pakke (bots, ikke mennesker) · 10. okt. 2026

Koden er `claude/part-b` @ 712d34c. Kommandoen er `tools/playstyle_sim.cjs --runs 1 --seconds 600 --threads 3 [--off <flag>]`.
Det giver 84 runs pr. kørsel (12 arter × 7 stilarter × 1 seed). **Med 1 seed er støjen ca. ±3 dødsfald.** Tallene er en retning, ikke et bevis.

| Kørsel | Døde /84 | Gns. bane | Bosser | DNA | Skade taget | Dræbt af Carnotaurus |
|---|---|---|---|---|---|---|
| alt til | 76 | 2,52 | 1,52 | 53,1 | 222 | 52 |
| `scentTrails` af (B3) | 70 | 2,68 | 1,68 | 59,2 | 238 | 38 |
| `dayNight` af (B2) | 73 | 2,51 | 1,51 | 52,7 | 228 | 43 |
| `raptorPack` af (B5) | 76 | 2,49 | 1,49 | 52,8 | 225 | 52 |
| `bossSignatures` af (B1c) | 71 | 2,56 | 1,56 | 53,4 | 226 | 53 |
| `drought` af (B4) | 75 | 2,51 | 1,51 | 53,1 | 223 | 50 |

- **B3 (rovdyr der følger spor) giver den største enkelteffekt.** Slået fra giver det 6 færre dødsfald, 14 færre drab af Carnotaurus, +0,16 bosser og +6 DNA pr. run. B3 er altså en stor del af, hvorfor del B gør spillet sværere.
- **B2 (nat)** fjerner 9 Carnotaurus-drab, men kun 3 dødsfald, hvilket er tæt på støjen.
- **B1c, B4 og B5** ligger inden for støjen.
- Ikke målt her: B1a/B1b (boss-rækkevidde og lavakrydsninger). Det er retfærdighedsændringer, der fjerner gratis bossdrab, og de testes for sig.
- **Anbefaling, venter på Jonas:**
  1. Spil selv.
  2. Føles det for svært, så dæmp B3 først, fx kortere spor-levetid i `TRACKS` eller lavere følge-chance for Carnotaurus. Slå ikke hele pakken fra.
