const fs=require('fs');
const grid=JSON.parse(fs.readFileSync(__dirname+'/surface-64x36.json','utf8'));
function hsv([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}return [h,mx?d/mx:0,mx]}
const out=grid.map((row,y)=>row.map(([r,g,b,w],x)=>{const [h,s,v]=hsv([r,g,b]);
 if(b>r+25&&b>=g-6)return '~';
 if(w>.3)return (y<9&&x>14&&x<52)?'^':'~';
 if(h>165&&h<215&&s>.25)return '~';
 if(s<.2&&v>.3)return '^';
 if(r>g+35&&v<.5&&h<25)return 'L';
 if(h>=18&&h<=50&&s>.28){return v>.62?'s':'M'}
 if(h>50&&h<170){return v<.42?'T':'.'}
 return '^'}).join(''));
console.log(out.map((l,i)=>String(i).padStart(2)+' '+l).join('\n'));
