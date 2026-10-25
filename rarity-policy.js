/* Recruitment policy: existing owned individuals and recipes are never removed. */
for(const species of Object.values(COMPANION_DATA.species))if(species.rarity>=7)species.fusionOnly=true;
