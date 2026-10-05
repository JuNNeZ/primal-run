# PRIMAL RUN v5
Open demo.html. WASD/arrows move in four directions; Space bites, R restarts.
Import individual PNGs from assets/player, not the Source_Generated sheets.
Create Idle_S/N/E/W and Walk_S/N/E/W. Import frames _000 through _005 in order.
Use 0.125 seconds per walk frame, loop enabled, nearest-neighbor pixel rendering.
Set each animation origin from animation_manifest.json: S 64,72; N 64,56;
E 68,64; W 60,64. Keep a fixed torso collision shape independent of animation.
North is a lossless 180-degree South rotation, including its lighting, as a demo
shortcut. East and West are separately drawn top-down poses. Diagonal input
uses a cardinal view. Facing persists on stop; blockage does not animate walking.
This is a browser-tested prototype, not a GDevelop project/runtime certification.
Generated texture/shape variation remains for visual review. All prior packs remain.
Built-in imagegen was used; final directional prompt is included.
