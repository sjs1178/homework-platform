/* screenReward.jsx — 리워드 화면 (B 스타일, amber 강조, 탭) */
function RewardItem({emoji, title, cost, owned, locked}){
  return (
    <div className="card" style={{padding:'13px 14px',marginBottom:11,boxShadow:'var(--sh-sm)',opacity:locked?.6:1}}>
      <div className="row between">
        <div className="row" style={{gap:13}}>
          <span style={{width:48,height:48,borderRadius:14,flex:'none',background:locked?'#F1F5F2':'var(--amber-50)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{emoji}</span>
          <div>
            <div style={{fontSize:15,fontWeight:800,whiteSpace:'nowrap'}}>{title}</div>
            <div className="row" style={{gap:4,marginTop:3}}>
              <Icon name="star" size={13} color="var(--amber-d)" stroke={0} style={{fill:'var(--amber-d)'}}/>
              <span style={{fontSize:13,fontWeight:800,color:'var(--amber-d)',whiteSpace:'nowrap'}}>{cost.toLocaleString()}P</span>
            </div>
          </div>
        </div>
        {locked ? (
          <span className="row" style={{gap:4,color:'var(--faint)',fontWeight:800,fontSize:12.5,whiteSpace:'nowrap'}}>
            <Icon name="lock" size={13} color="var(--faint)" stroke={2.2}/>{(cost-1240).toLocaleString()}P 부족
          </span>
        ) : (
          <button style={{height:38,padding:'0 17px',borderRadius:11,border:'none',whiteSpace:'nowrap',
            background:'var(--amber)',color:'#fff',fontWeight:800,fontSize:14,
            boxShadow:'0 6px 14px -6px rgba(245,158,11,.7)'}}>교환</button>
        )}
      </div>
    </div>
  );
}

function ScreenReward(){
  return (
    <div className="dash" style={{background:'#F1F7F3'}}>
      <StatusBar/>
      <div className="row between" style={{flex:'0 0 auto',padding:'6px 20px 14px'}}>
        <h1 style={{fontSize:22,fontWeight:800}}>리워드</h1>
        <button className="row" style={{gap:4,background:'none',border:'none',color:'var(--muted)',fontWeight:700,fontSize:13.5,whiteSpace:'nowrap'}}>
          <Icon name="clock" size={15} color="var(--muted)" stroke={2}/>적립 내역
        </button>
      </div>

      <div className="scroll" style={{padding:'0 20px 22px'}}>
        {/* balance hero (gold) */}
        <div style={{borderRadius:24,padding:'20px 20px 18px',color:'#fff',position:'relative',overflow:'hidden',
          background:'linear-gradient(150deg,#FBBF24,#E5890B)',boxShadow:'0 14px 30px -12px rgba(217,119,6,.7)',marginBottom:22}}>
          <div style={{position:'absolute',right:-26,top:-26,width:110,height:110,borderRadius:'50%',background:'rgba(255,255,255,.14)'}}></div>
          <div className="row" style={{gap:9,position:'relative',marginBottom:6}}>
            <Icon name="star" size={17} color="#fff" stroke={0} style={{fill:'#fff'}}/>
            <span style={{fontSize:13.5,fontWeight:700,opacity:.95,whiteSpace:'nowrap'}}>송지우님이 모은 포인트</span>
          </div>
          <div style={{fontSize:38,fontWeight:800,letterSpacing:'-0.02em',position:'relative'}}>1,240<span style={{fontSize:22}}> P</span></div>
          {/* progress to next reward */}
          <div style={{position:'relative',marginTop:14}}>
            <div className="row between" style={{marginBottom:7}}>
              <span style={{fontSize:12.5,fontWeight:700,opacity:.95,whiteSpace:'nowrap'}}>다음 리워드 · 놀이공원</span>
              <span style={{fontSize:12.5,fontWeight:800,whiteSpace:'nowrap'}}>260P 남음</span>
            </div>
            <div style={{height:9,borderRadius:99,background:'rgba(255,255,255,.3)',overflow:'hidden'}}>
              <div style={{width:'82%',height:'100%',borderRadius:99,background:'#fff'}}></div>
            </div>
          </div>
        </div>

        <div className="row between" style={{margin:'0 4px 13px'}}>
          <h2 style={{fontSize:16,fontWeight:800}}>리워드 교환</h2>
          <span style={{fontSize:13,color:'var(--muted)',fontWeight:700,whiteSpace:'nowrap'}}>부모가 등록</span>
        </div>

        <RewardItem emoji="🎮" title="게임 30분" cost={200}/>
        <RewardItem emoji="📺" title="유튜브 30분" cost={150}/>
        <RewardItem emoji="🍦" title="아이스크림" cost={300}/>
        <RewardItem emoji="💰" title="용돈 5,000원" cost={500}/>
        <RewardItem emoji="🎢" title="놀이공원 가기" cost={1500} locked/>
      </div>

      <BottomNav active="리워드"/>
    </div>
  );
}
Object.assign(window, { ScreenReward });
