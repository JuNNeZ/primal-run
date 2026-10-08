# Utahraptor bite — genererede kilder v1

Alle ark er nye billedværktøjs-genereringer med de eksisterende Utahraptor-poses
som visuelle referencer. De oprindelige billeder ændres ikke. Arkene er 1536×1024,
tre kolonner og to rækker; hver celle er en 4× reference til native128×128.

Promptens fælles mål: orange/oker Utahraptor, mørke chevronstriber, lys fra øvre
venstre, overhead med let synlig side, små brystarme og et fast hoftepunkt.
Seks poses: neutral, head pullback, åbent gab, snappende kontakt, recoil, neutral.
Transparent baggrund, hard pixel clusters, ingen labels eller blur. Retningerne
genereres separat; der bruges ingen rotation/mirroring til de nye angreb.

- bite_S_sheet.png: reference var den eksisterende South-idle og det oprindelige
  actions_sheet. Prompten prioriterede et tydeligt gab og konsistent karakter.
- bite_N_sheet.png: reference var North-idle og den nye South-serie. Prompten
  krævede separat North-perspektiv med konstant lys og samme karakter.
- bite_E_candidate.png / bite_W_candidate.png: første forsøg med de tilsvarende
  idle-poses og South-serien. Fravalgt på grund af sideprofil i frame2's hoved.
- bite_E_sheet.png / bite_W_sheet.png: billedværktøjs-redigeringer af candidates.
  Rettelsesinstruksen krævede bevaret 3×2-layout/torso/striber, samme overhead-
  hoved som neutralframen, et beskedent gab højst1.15× neutralhovedets bredde,
  lille mørkt mundgab og små tænder i stedet for en stor trekantet profilmund.

Dette er promptsammenfatninger og reviewhistorik, ikke et løfte om deterministisk
gen-generering. Kildernes SHA256 og de præcise eksport-crops/offsets er gemt i
player_combat_manifest.json. Eksportværktøjet tegner ingen nye kropsdele.
