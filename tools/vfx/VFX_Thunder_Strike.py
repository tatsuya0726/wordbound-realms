"""VFX_Thunder_Strike: a targeted lightning strike from the sky onto the target (雷 skills in ごちゃまぜモンスター).

Lightning does not travel: the bolt is struck whole on one frame, re-struck mirrored (the return stroke) and flickers
once more later, each on different frames. The bolt is the shipped painted arc strand (T_ArcStrand01) chained from
the sky to the ground with charge_chain, so no complex shape is drawn in code.
"""
from vfxkit.primitives import *


def recipe():
 white=(255,252,225,255); gold=(255,215,90,255); deep=(255,170,40,255); night=(40,40,90,150)
 sky=4.8
 # Three different jagged paths from the sky to the ground: main strike, return stroke, after-flicker.
 main=[(0,sky,0),(.35,3.9,.05),(-.2,3.0,-.05),(.3,2.1,.08),(-.15,1.2,0),(.05,.15,0)]
 back=[(0,sky,0),(-.3,3.8,0),(.25,2.9,.06),(-.25,2.0,-.04),(.2,1.1,.03),(0,.15,0)]
 flick=[(.05,sky,0),(.4,3.7,0),(.05,2.6,0),(.35,1.6,0),(-.1,.6,0),(0,.15,0)]
 return effect('Thunder_Strike','Thunder Strike','element','lightning',1.3,[
  # Anticipation: the sky above the target gathers light and a faint ring marks the ground.
  glow('Sky charge',(255,235,160,160),2.4,life=6,position=[0,sky,0],size_curve=[[0,.3],[100,1]],fade_in=4,fade_out=1),
  shock_ring('Ground warning',(255,220,120,120),1.4,life=6,ground=True,thickness=.08,position=[0,.06,0],size_curve=[[0,1.2],[100,.6]]),
  # Dark backing so the additive bolt reads against a bright stage.
  shadow('Dark backing',night,4.2,life=14,delay=5,position=[0,1.6,0]),
  # Joint glows stay tiny on the sky strikes so the bolt reads as one line, not a string of beads.
  # Main strike, mirrored re-strikes every 2 frames, then the return stroke and a late after-flicker on other frames.
  *charge_chain('Main bolt',main,gold,white,step=0,delay=5,until=15,restrike=2,width=.42,glow=.12),
  *charge_chain('Return stroke',back,deep,white,step=0,delay=10,until=16,restrike=2,width=.3,glow=.08),
  *charge_chain('After flicker',flick,(255,200,90,200),(255,245,210,230),step=0,delay=21,until=26,restrike=3,width=.2,glow=.06),
  # Contact: the brightest frame of the effect, at the strike.
  flash('Strike flash',white,5,life=4,delay=5,position=[0,1.0,0],angle=12),
  glow('Impact bloom',(255,215,90,200),3.2,life=16,delay=5,position=[0,.6,0]),
  shock_ring('Ground shock',(255,225,130,200),2.8,life=14,delay=6,ground=True,thickness=.2,position=[0,.08,0]),
  # Ground: a visible scorch (dark elements need values about 90-150), glowing cracks that cool to blue and stay to ~f58, and arcs that crawl outward along the floor.
  decal('Scorch','T_Smoke02',(128,104,88,235),2.6,life=70,delay=6,blend='Blend',size_curve=[[0,.4],[10,1],[100,1.05]],cutoff=dict(start=.05,end=.55,easing='EaseInQuadratic'),fade_in=0,fade_out=12,angle=-20),
  decal('Hot cracks','T_Crack01',(255,230,130,255),3.0,life=66,delay=6,size_curve=[[0,.5],[10,1],[100,1.02]],color_curve=ramp((0,(255,235,150,255)),(35,(150,170,255,235)),(75,(90,120,255,170)),(100,(70,90,200,0)))['color_curve'],fade_in=0,fade_out=8,emissive=1.6,angle=-20),
  *charge_chain('Ground arc A',[(0,.12,0),(.7,.14,.25),(1.4,.1,-.05)],gold,white,step=2,delay=8,until=24,restrike=3,width=.16,glow=.07),
  *charge_chain('Ground arc B',[(0,.12,0),(-.75,.12,-.2),(-1.3,.1,.15)],gold,white,step=2,delay=11,until=26,restrike=3,width=.14,glow=.06),
  # Secondary: sparks thrown off the strike that land, and static motes crawling low.
  *spark_burst('Strike sparks',10,white,deep,distance=(1.2,2.8),life=(14,28),length=(.4,.9),delay=5,gravity=.0014,floor=.02),
  motes('Static motes',8,(255,240,170,255),color_end=(120,150,255,255),size=(.05,.1),life=(18,34),distance=(.4,1.4),delay=8,turbulence=.006,hemisphere=True,radius=(.1,.6)),
  # Dissipation: thin ozone smoke drifts up where the bolt hit.
  smoke('Ozone smoke',(150,155,175,150),count=6,size=(.6,.9),grow=2.1,life=(50,58),delay=10,interval=2,rise=.0004,radius=(0,.4),position=[0,.3,0]),
 ],attach='ground',peak=.09,impact=.9,light=(1,.95,.6),delivery=TARGETED,
 design='A brief glow gathers in the sky, then a jagged golden-white bolt strikes the target whole on one frame with a white flash; it re-strikes mirrored, a return stroke and a late after-flicker follow on other frames; arcs crawl out along the ground over glowing cracks that cool to blue on a scorch, sparks land and ozone smoke drifts up.')
