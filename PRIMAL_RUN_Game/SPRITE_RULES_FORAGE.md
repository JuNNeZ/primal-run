# Edible ground-food props

Native64, origin32,32, fixed32-colour palette and binary alpha. Two static variants each of fallen fruit, dug-up roots/tubers, edible mushrooms and toxic mushrooms. Actual forage uses these props, not a decorative whole fruit bush. Ordinary herb uses existing ecology/herb.png.

Toxic food is only mushrooms, with olive speckled caps **and** an explicit proximity warning; do not rely on colour alone. Poison lasts six simulation seconds, deals small periodic damage, freezes in pause and causes a subtle slow hue/border effect. Reduced motion disables hue motion. Never force a flashing full-screen effect.

Source_Generated/forage/food_pickups.png is immutable; exports use fixed4 ×2 cells and integer stride8. No procedural painting or invented replacement assets. Atlas and native previews are prototypes; retain existing plant props for scenery. Rules distinguish visual food variety from rarity/resource value, so new visuals never grant extra food implicitly.
