(function(global){
'use strict';
const NS='http://www.w3.org/2000/svg';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fmt=v=>Number(v.toFixed(3));
const line=(x1,y1,x2,y2,extra='')=>`<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(y2)}" ${extra}/>`;
const text=(x,y,value,size=14)=>`<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="#18304e" stroke="none" font-family="Arial,sans-serif">${esc(value)}</text>`;
function frame(inner,w=160,h=160,label='Reasoning figure'){
 return `<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><g stroke="#172c45" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
}
function item(spec,x=0,y=0,w=160,h=160){
 return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 160 160">${drawing(spec)}</svg>`;
}
function tile(v){
 const a=(v.a||0)*45,d=(v.d||0)*Math.PI/4;
 let p=`<circle cx="80" cy="80" r="65" stroke="#bcc8d6" stroke-width="1.3"/>`;
 const glyph=v.m===1?'<path d="M54 91 L80 51 L106 91 Z" stroke="#8d9eb1" stroke-width="1.2"/>':v.m===2?'<rect x="53" y="53" width="54" height="54" rx="5" stroke="#8d9eb1" stroke-width="1.2"/>':'<circle cx="80" cy="80" r="27" stroke="#8d9eb1" stroke-width="1.2"/>';
 p+=glyph+`<g transform="rotate(${a} 80 80)"><path d="M73 105 L73 72 L62 72 L80 48 L98 72 L87 72 L87 105 Z" fill="${v.fill?'#172c45':'#fff'}"/><line x1="87" y1="93" x2="96" y2="93" stroke-width="3"/></g>`;
 p+=`<circle cx="${fmt(80+55*Math.sin(d))}" cy="${fmt(80-55*Math.cos(d))}" r="5.5" fill="#172c45" stroke="none"/>`;
 for(let i=0;i<(v.n||1);i++)p+=line(68+i*9,115,68+i*9,123,'stroke-width="2.6"');
 const transforms=[];
 if(v.rot)transforms.push(`rotate(${v.rot} 80 80)`);
 if(v.flip==='h')transforms.push('translate(160 0) scale(-1 1)');
 if(v.flip==='v')transforms.push('translate(0 160) scale(1 -1)');
 if(v.flip==='hv')transforms.push('translate(160 160) scale(-1 -1)');
 return transforms.length?`<g transform="${transforms.join(' ')}">${p}</g>`:p;
}
function cube(v){
 const [top,front,right]=v.faces;
 return '<polygon points="80,18 139,49 80,82 21,49" fill="#f4f7fb"/>'+ '<polygon points="21,49 80,82 80,145 21,111" fill="#fff"/>'+'<polygon points="80,82 139,49 139,111 80,145" fill="#e7eef6"/>'+text(80,57,top,24)+text(50,104,front,24)+text(110,104,right,24);
}
function regions(v){
 const c=v.circle,s=v.square,t=v.triangle;
 let p=`<circle cx="${c[0]*140+10}" cy="${c[1]*140+10}" r="${c[2]*140}"/>`;
 p+=`<rect x="${s[0]*140+10}" y="${s[1]*140+10}" width="${s[2]*140}" height="${s[3]*140}"/>`;
 p+=`<polygon points="${t.map(([x,y])=>(x*140+10)+','+(y*140+10)).join(' ')}"/>`;
 for(const [x,y] of v.dots)p+=`<circle cx="${x*140+10}" cy="${y*140+10}" r="4" fill="#172c45" stroke="#fff" stroke-width="1"/>`;
 return p;
}
function holes(v){
 let p='<rect x="18" y="18" width="124" height="124" fill="#fff"/>';
 for(const [x,y] of v.points)p+=`<circle cx="${18+x*124}" cy="${18+y*124}" r="4.5" fill="#172c45"/>`;
 return p;
}
function drawing(v){
 if(!v)return '';
 if(v.k==='tile')return tile(v);
 if(v.k==='cube')return cube(v);
 if(v.k==='unknown')return '<rect x="16" y="16" width="128" height="128" rx="12" stroke="#bbcadd" stroke-dasharray="5 5"/>'+text(80,95,'?',42);
 if(v.k==='regions')return regions(v);
 if(v.k==='holes')return holes(v);
 if(v.k==='segments'){
  const scale=124/v.size;
  return v.segments.map(([a,b])=>line(18+a[0]*scale,18+a[1]*scale,18+b[0]*scale,18+b[1]*scale)).join('');
 }
 if(v.k==='grid'){
  const unit=124/Math.max(v.cols,v.rows),ox=(160-v.cols*unit)/2,oy=(160-v.rows*unit)/2;let p='';
  for(let i=0;i<=v.cols;i++)p+=line(ox+i*unit,oy,ox+i*unit,oy+v.rows*unit);
  for(let i=0;i<=v.rows;i++)p+=line(ox,oy+i*unit,ox+v.cols*unit,oy+i*unit);return p;
 }
 throw Error('Unsupported figure '+v.k);
}
function render(spec){
 if(!spec)return '';
 if(spec.k==='strip'){
  const n=spec.items.length,w=n*160,h=spec.labels?190:160;
  return frame(spec.items.map((v,i)=>item(v,i*160,0)+(spec.labels?text(i*160+80,181,spec.labels[i]):'')).join(''),w,h,'Reference figures in left-to-right order');
 }
 if(spec.k==='matrix')return frame(spec.rows.map((row,r)=>row.map((v,c)=>item(v,c*140,r*140,140,140)).join('')).join(''),420,420,'Three by three figure matrix; final cell is missing');
 if(spec.k==='reflection'){
  let p=item(spec.item,0,0);
  if(spec.axis==='h')p+=line(170,10,170,150,'stroke-dasharray="6 4"')+text(170,180,'Mirror',12);
  else p+=line(10,170,150,170,'stroke-dasharray="6 4"')+text(80,193,'Water line',12);
  return frame(p,190,205,'Original figure and '+(spec.axis==='h'?'vertical mirror line':'horizontal water line'));
 }
 if(spec.k==='net'){
  const cols=Math.max(...spec.cells.map(c=>c[0]))+1,rows=Math.max(...spec.cells.map(c=>c[1]))+1;
  return frame(spec.cells.map(([x,y,n])=>`<rect x="${x*50+10}" y="${y*50+10}" width="50" height="50" fill="#fff"/>`+text(x*50+35,y*50+43,n,20)).join(''),cols*50+20,rows*50+20,'Flat numbered sheet to fold into a cube');
 }
 if(spec.k==='fold'){
  const mode=spec.mode;let panels=[];
  let p='<rect x="18" y="18" width="124" height="124" fill="#fff"/>';
  if(mode==='diag')p+=line(18,18,142,142,'stroke-dasharray="5 4"')+'<path d="M47 92 Q82 96 109 62"/>'+ '<path d="M102 65 L109 62 L108 70"/>';
  else p+=line(80,18,80,142,'stroke-dasharray="5 4"')+'<path d="M40 72 Q79 40 116 72"/>'+'<path d="M107 67 L116 72 L108 77"/>';
  panels.push(p);
  if(mode==='vh')panels.push('<rect x="80" y="18" width="62" height="124" fill="#eaf0f7"/>'+line(80,80,142,80,'stroke-dasharray="5 4"')+'<path d="M103 40 Q135 80 103 118"/>'+'<path d="M102 109 L103 118 L111 114"/>');
  const [x,y]=spec.point;
  let folded=mode==='diag'?'<polygon points="18,18 142,142 142,18" fill="#eaf0f7"/>':mode==='vh'?'<rect x="80" y="80" width="62" height="62" fill="#eaf0f7"/>':'<rect x="80" y="18" width="62" height="124" fill="#eaf0f7"/>';
  folded+=`<circle cx="${18+x*124}" cy="${18+y*124}" r="4.5" fill="#172c45"/>`;panels.push(folded);
  return frame(panels.map((p,i)=>`<g transform="translate(${i*180} 0)">${p}${text(80,177,i===panels.length-1?'Punch':'Fold '+(i+1),13)}</g>`+(i<panels.length-1?text(i*180+165,87,'→',18):'')).join(''),panels.length*180,190,'Paper folding steps followed by the hole punch');
 }
 return frame(drawing(spec),160,160,'Answer or reference figure');
}
global.OIRFigures={render};
})(typeof window!=='undefined'?window:globalThis);
