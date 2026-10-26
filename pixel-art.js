/* Pixel art for every monster (2026-10-26): battles, town, followers and the bestiary all use the dot-art version
   from Drive ゲーム用モンスター素材/ドット絵 (cropped, 256px WebP in assets/monsters/<id>.webp), so painted and
   pixel monsters no longer mix. Loaded right after strong-roster.js, once every species exists. */
for(const [id,s] of Object.entries(COMPANION_DATA.species))s.img='assets/monsters/'+id+'.webp';
