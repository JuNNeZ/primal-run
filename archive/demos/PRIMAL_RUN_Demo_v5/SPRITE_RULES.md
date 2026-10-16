# PRIMAL RUN - four-direction prototype v5
Follow the included v1/v2 references. Preserve V4.
Four directions: S/N/E/W, six walk frames each at 8 fps, one matching idle each.
Every player image is native RGBA 128x128, fixed 24-color palette, binary alpha,
transparent RGB zero, at least two pixels padding. Export whole poses.
Logical origins: S=(64,72), N=(64,56), E=(68,64), W=(60,64).
Direction origins are fixed throughout each series. Collision stays at gameplay
position with a fixed radius; visible tails and limbs do not alter collision.
E/W are separately generated overhead poses; never use rejected side-profile art.
N is a user-requested lossless 180-degree South rotation. Its light also rotates;
this explicit prototype exception must be resolved before production approval.
No filtering or smoothed rotation. Cardinal facing persists when stopped.
Diagonal movement selects a cardinal view, with vertical input winning ties.
Review light/dark loops, frame seams, anatomy and texture variation. Generated
pose details may vary; export checks do not certify perfect animation.
Browser movement tests are separate from GDevelop runtime, which is NOT RUN.
All sprites remain prototypes, production_approved=false.
