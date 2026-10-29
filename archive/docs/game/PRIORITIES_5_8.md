# Spisning og prioriteter 5–8

Denne opdatering ændrer jagtens belønning til et aktivt valg: dræb dyret, find et
sikkert øjeblik og hold F ved liget. En portion tager 0,6 sekunder og giver én
kødværdi. Bevægelse, angreb, evner eller skade afbryder portionen; optjent kød
beholdes. Der bruges ingen stamina. Lig mørkner og forsvinder efter 25–30 sekunder.

| Punkt | Implementeret i prototypen |
| --- | --- |
| 5 — lyd | Separate naturlyde, biomeprofiler for vind/vand/insekter/dyrekald, musikmotiver varierer efter 64 beats, eksisterende crossfade og livslag. |
| 6 — input | Joystick med flytbar berøringsstart, gamepad, valgfrit autoangreb, individuelle bogstav/Space/Shift-bindinger, tekst/HUD 85–140 %, reduceret kosmetisk bevægelse og symboler for fare/rarity. |
| 7 — verden | Minimap-fog fra synsfeltet, to små seedede opdagelser pr. kort, biomeegnede bossrydninger med tre profiler, seed-input og kopierbart seed-link. |
| 8 — performance | Aktuelle dyreframes forudindlæses; resten efter behov. Farvelag fremstilles ved brug, gamle frames frigives ved baneskift. 128-pixel kollisionsgitter, viewport-culling før sortering, telefonstørrelse-benchmark. |

Begge runtime-rapporter beskriver opstart, 180 frames med 45 dyr ved 390×844 og
estimeret RGBA-lager. Det er cloud-browsermålinger, ikke fysisk telefon-FPS.
Browsercache, GPU og driverhukommelse er ikke inkluderet i billedestimatet.

Reder og DNA beholder deres opsamling, og bosser beholder den garanterede
DNA-belønning. Seed gentager kortet, ikke alle loot-rul. Større/bedre lig kræver
flere portioner. Pauser og mutationsvalg fryser både spisning og nedbrydning.
Space vælger fortsat ikke mutationer og går ikke videre fra boss-skærmen.

Alle eksisterende PNGs og art-manifester er bevaret; mørkning er et pixelmaske-lag
ved rendering. Sprites er fortsat prototype-assets uden produktionsgodkendelse.
