/* shared.jsx — Icon set (Lucide paths), StatusBar, Avatar */

// Minimal Lucide-style line icons. Simple, recognizable, not hand-drawn slop.
const ICONS = {
  'square-pen': 'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7|M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z',
  'gift': 'M20 12v10H4V12|M2 7h20v5H2z|M12 22V7|M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z|M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  'users': 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2|M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z|M22 21v-2a4 4 0 0 0-3-3.87|M16 3.13a4 4 0 0 1 0 7.75',
  'check': 'M20 6 9 17l-5-5',
  'check-circle': 'M21.801 10A10 10 0 1 1 17 3.335|m9 11 3 3L22 4',
  'clipboard-check': 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2|M9 2a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z|m9 14 2 2 4-4',
  'chevron-right': 'm9 18 6-6-6-6',
  'arrow-right': 'M5 12h14|m12 5 7 7-7 7',
  'flame': 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  'star': 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.69 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.453 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
  'bell': 'M10.268 21a2 2 0 0 0 3.464 0|M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.41 5.956-2.738 7.326',
  'plus': 'M5 12h14|M12 5v14',
  'calendar': 'M8 2v4|M16 2v4|M3 10h18|M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  'sparkles': 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
  'trophy': 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6|M18 9h1.5a2.5 2.5 0 0 0 0-5H18|M4 22h16|M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22|M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22|M18 2H6v7a6 6 0 0 0 12 0V2z',
  'target': 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z|M18 12a6 6 0 1 1-12 0 6 6 0 0 1 12 0z|M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  'book-open': 'M12 7v14|M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
  'x': 'M18 6 6 18|M6 6l12 12',
  'home': 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8|M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  'user': 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2|M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  'arrow-left': 'm12 19-7-7 7-7|M19 12H5',
  'chevron-left': 'm15 18-6-6 6-6',
  'minus': 'M5 12h14',
  'image': 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z|M11 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0z|m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21',
  'camera': 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z|M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  'clock': 'M12 6v6l4 2|M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  'edit-3': 'M12 20h9|M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z',
  'zap': 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  'lock': 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z|M7 11V7a5 5 0 0 1 10 0v4',
};

function Icon({name, size=22, stroke=2, color='currentColor', style={}}){
  const paths = (ICONS[name]||'').split('|');
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{display:'block',flex:'none',...style}}>
      {paths.map((d,i)=><path key={i} d={d}/>)}
    </svg>
  );
}

function StatusBar(){
  return (
    <div className="statusbar">
      <span>9:41</span>
      <div className="sb-right">
        <svg className="sb-dot" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="14" width="3.5" height="6" rx="1"/><rect x="7" y="10" width="3.5" height="10" rx="1"/><rect x="12" y="6" width="3.5" height="14" rx="1"/><rect x="17" y="3" width="3.5" height="17" rx="1"/></svg>
        <svg className="sb-dot" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C7.5 4 3.7 5.9 1 9l11 13L23 9c-2.7-3.1-6.5-5-11-5z"/></svg>
        <span className="sb-bar"></span>
      </div>
    </div>
  );
}

// Soft striped avatar placeholder with initials
function Avatar({label='지우', size=48, hue='green', img=null}){
  const bg = hue==='green' ? 'linear-gradient(135deg,#34D399,#16A34A)'
           : hue==='amber' ? 'linear-gradient(135deg,#FBBF24,#F59E0B)'
           : 'linear-gradient(135deg,#94A3B8,#64748B)';
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,
      display:'flex',alignItems:'center',justifyContent:'center',flex:'none',
      color:'#fff',fontWeight:800,fontSize:size*0.36,letterSpacing:0,
      boxShadow:'0 2px 8px -2px rgba(16,40,28,.35), inset 0 0 0 2px rgba(255,255,255,.5)'}}>
      {label}
    </div>
  );
}

Object.assign(window, { Icon, StatusBar, Avatar, BottomNav, GoogleG, Stripe });

// Standard Google sign-in mark
function GoogleG({size=20}){
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{display:'block',flex:'none'}}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/>
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
    </svg>
  );
}

// Diagonal-striped image placeholder
function Stripe({h=160, label='이미지', r=18, style={}}){
  return (
    <div style={{height:h,borderRadius:r,border:'1.5px dashed var(--line-strong)',
      background:'repeating-linear-gradient(135deg,#F1F5F2 0 10px,#E9F0EB 10px 20px)',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
      color:'#8B988F',...style}}>
      <Icon name="image" size={26} color="#A6B2AB" stroke={1.8}/>
      <span style={{fontFamily:'ui-monospace,Menlo,monospace',fontSize:11.5,fontWeight:600,letterSpacing:0}}>{label}</span>
    </div>
  );
}

function BottomNav({active='홈'}){
  const tabs=[['home','홈'],['calendar','캘린더'],['gift','리워드'],['user','내정보']];
  return (
    <div style={{flex:'0 0 auto',display:'flex',alignItems:'flex-start',justifyContent:'space-around',
      padding:'10px 14px 26px',background:'rgba(255,255,255,.92)',backdropFilter:'blur(10px)',
      borderTop:'1px solid var(--line)'}}>
      {tabs.map((t,i)=>{
        const on=t[1]===active;
        return (
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
            <Icon name={t[0]} size={23} stroke={on?2.4:2} color={on?'var(--green)':'#A6B2AB'}/>
            <span style={{fontSize:11,fontWeight:on?800:600,color:on?'var(--green-d)':'#9AA8A0',whiteSpace:'nowrap'}}>{t[1]}</span>
          </div>
        );
      })}
    </div>
  );
}
