/* dashB.jsx — Variation B: Gamified warm (Duolingo/Khan energy, still calm) */
function DashboardB(){
  const days = [['월',1],['화',1],['수',1],['목',1],['금',0],['토',0],['일',2]]; // 1 done, 0 none, 2 today
  return (
    <div className="dash" style={{background:'#F1F7F3'}}>
      <StatusBar/>
      <div className="scroll">
        <div className="row between" style={{padding:'6px 2px 16px'}}>
          <div style={{fontSize:18,fontWeight:800,whiteSpace:'nowrap'}}>안녕하세요, Jinseok님 <span style={{fontWeight:600}}>👋</span></div>
          <button className="icon-btn" style={{width:40,height:40,borderRadius:'50%',background:'#fff',boxShadow:'var(--sh-sm)'}}>
            <Icon name="bell" size={19} color="var(--text-soft)"/>
          </button>
        </div>

        {/* gradient hero */}
        <div style={{borderRadius:24,padding:'19px 19px 17px',background:'linear-gradient(150deg,#1FB259 0%,#15803D 100%)',color:'#fff',boxShadow:'0 14px 30px -12px rgba(21,128,61,.7)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:-30,top:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,.08)'}}></div>
          <div className="row between" style={{position:'relative'}}>
            <div className="row" style={{gap:12}}>
              <div style={{width:48,height:48,borderRadius:'50%',background:'rgba(255,255,255,.22)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:18,border:'2px solid rgba(255,255,255,.5)',flex:'none',whiteSpace:'nowrap'}}>지우</div>
              <div>
                <div style={{fontSize:17,fontWeight:800}}>송지우</div>
                <div style={{fontSize:12.5,opacity:.85,fontWeight:600,marginTop:1,whiteSpace:'nowrap'}}>초등학교 2학년</div>
              </div>
            </div>
            <div className="pill" style={{background:'rgba(255,193,7,.95)',color:'#7c4a02',padding:'7px 12px',fontSize:13.5,fontWeight:800,boxShadow:'0 4px 10px -3px rgba(0,0,0,.25)'}}>
              <Icon name="star" size={15} color="#7c4a02" stroke={0} style={{fill:'#7c4a02'}}/>1,240P
            </div>
          </div>

          {/* streak + weekly dots */}
          <div className="row between" style={{marginTop:18,position:'relative'}}>
            <div className="row" style={{gap:7}}>
              <Icon name="flame" size={20} color="#FFD27D" stroke={0} style={{fill:'#FFD27D'}}/>
              <span style={{fontSize:14.5,fontWeight:800,whiteSpace:'nowrap'}}>7일 연속!</span>
            </div>
            <span style={{fontSize:13,fontWeight:700,opacity:.92,whiteSpace:'nowrap'}}>이번 주 4/5 완료</span>
          </div>
          <div className="row" style={{marginTop:11,gap:0,justifyContent:'space-between'}}>
            {days.map((d,i)=>(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                <span style={{fontSize:11,fontWeight:700,opacity:d[1]===2?1:.7}}>{d[0]}</span>
                <span style={{width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                  background:d[1]===1?'#fff':d[1]===2?'rgba(255,255,255,.25)':'rgba(255,255,255,.13)',
                  border:d[1]===2?'2px dashed rgba(255,255,255,.8)':'none'}}>
                  {d[1]===1 && <Icon name="check" size={15} color="#16A34A" stroke={3}/>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* pending to-check — friendly callout */}
        <div className="row between" style={{margin:'22px 4px 11px'}}>
          <h2 style={{fontSize:17,fontWeight:800}}>검사 기다리는 숙제</h2>
          <span className="pill" style={{background:'var(--amber-100)',color:'var(--amber-d)',padding:'3px 10px',fontSize:12.5}}>1개</span>
        </div>

        <div className="card" style={{padding:15,marginBottom:12,border:'1.5px solid var(--green-200)'}}>
          <div className="row" style={{gap:13}}>
            <span style={{width:52,height:52,borderRadius:16,background:'var(--green-50)',display:'flex',alignItems:'center',justifyContent:'center',flex:'none'}}>
              <Icon name="clipboard-check" size={24} color="var(--green)" stroke={2}/>
            </span>
            <div style={{flex:1}}>
              <div className="row" style={{gap:8,marginBottom:4}}>
                <span className="tag tag-math">수학</span>
                <span style={{fontSize:12,color:'var(--faint)',fontWeight:600,whiteSpace:'nowrap'}}>어제 제출</span>
              </div>
              <div style={{fontSize:15.5,fontWeight:800}}>학습지 2장 풀기</div>
            </div>
          </div>
          <button style={{width:'100%',height:46,borderRadius:14,border:'none',background:'var(--green)',color:'#fff',fontWeight:800,fontSize:15,marginTop:14,display:'flex',alignItems:'center',justifyContent:'center',gap:7}}>
            지금 검사하기 <Icon name="arrow-right" size={18} stroke={2.4}/>
          </button>
        </div>

        {/* quick actions — playful tiles */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:11,marginTop:16}}>
          {[['square-pen','숙제 입력','linear-gradient(140deg,#34D399,#16A34A)'],
            ['gift','리워드','linear-gradient(140deg,#FBBF24,#F59E0B)'],
            ['users','패밀리','linear-gradient(140deg,#A5B4FC,#6366F1)']].map((a,i)=>(
            <button key={i} style={{padding:'15px 8px 13px',borderRadius:18,border:'none',cursor:'pointer',background:'#fff',boxShadow:'var(--sh-md)',display:'flex',flexDirection:'column',alignItems:'center',gap:9}}>
              <span style={{width:46,height:46,borderRadius:14,background:a[2],display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 5px 12px -4px rgba(16,40,28,.35)'}}>
                <Icon name={a[0]} size={22} color="#fff" stroke={2.2}/>
              </span>
              <span style={{fontSize:13,fontWeight:800,color:'var(--text-soft)'}}>{a[1]}</span>
            </button>
          ))}
        </div>
      </div>
      <BottomNav active="홈"/>
    </div>
  );
}
Object.assign(window, { DashboardB });
