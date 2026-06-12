/* screenInput.jsx — 숙제 입력 화면 (B 스타일, 하위 페이지) */
function ScreenInput(){
  const Label = ({children}) => <div style={{fontSize:13.5,fontWeight:800,color:'var(--text-soft)',marginBottom:9,marginLeft:2}}>{children}</div>;
  const subjects = [['수학',true],['국어',false],['영어',false],['사회',false],['과학',false]];
  const points = [['50P',true],['100P',false],['200P',false]];
  return (
    <div className="dash">
      <StatusBar/>
      {/* header */}
      <div className="row" style={{flex:'0 0 auto',padding:'4px 18px 14px',gap:6}}>
        <button className="icon-btn" style={{width:40,height:40,borderRadius:12,background:'transparent',marginLeft:-6}}>
          <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2}/>
        </button>
        <h1 style={{fontSize:20,fontWeight:800}}>숙제 입력</h1>
      </div>

      <div className="scroll" style={{padding:'4px 20px 24px'}}>
        {/* child */}
        <Label>자녀</Label>
        <div className="card" style={{padding:'11px 14px',marginBottom:20,boxShadow:'var(--sh-sm)'}}>
          <div className="row between">
            <div className="row" style={{gap:11}}>
              <Avatar label="지우" size={36} hue="green"/>
              <div style={{fontSize:15,fontWeight:800,whiteSpace:'nowrap'}}>송지우 <span style={{color:'var(--muted)',fontWeight:600,fontSize:13}}>· 초등 2학년</span></div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--faint)"/>
          </div>
        </div>

        {/* subject */}
        <Label>과목</Label>
        <div className="row" style={{gap:8,marginBottom:22,flexWrap:'wrap'}}>
          {subjects.map((s,i)=>(
            <button key={i} style={{height:40,padding:'0 16px',borderRadius:12,fontSize:14,fontWeight:800,whiteSpace:'nowrap',
              border:s[1]?'none':'1.5px solid var(--line-strong)',
              background:s[1]?'var(--green)':'#fff',color:s[1]?'#fff':'var(--text-soft)',
              boxShadow:s[1]?'0 6px 14px -6px rgba(22,163,74,.6)':'none'}}>{s[0]}</button>
          ))}
        </div>

        {/* title */}
        <Label>숙제 내용</Label>
        <div style={{background:'#fff',border:'1.5px solid var(--line-strong)',borderRadius:14,padding:'15px 16px',marginBottom:22,boxShadow:'var(--sh-sm)'}}>
          <span style={{fontSize:15.5,fontWeight:700}}>학습지 2장 풀기</span>
        </div>

        {/* due date */}
        <Label>마감일</Label>
        <div className="row between" style={{background:'#fff',border:'1.5px solid var(--line-strong)',borderRadius:14,padding:'14px 16px',marginBottom:22,boxShadow:'var(--sh-sm)'}}>
          <span style={{fontSize:15.5,fontWeight:700,whiteSpace:'nowrap'}}>2026년 6월 10일 (수)</span>
          <Icon name="calendar" size={20} color="var(--green-d)" stroke={2}/>
        </div>

        {/* reward points */}
        <Label>완료 시 리워드</Label>
        <div className="row" style={{gap:8,marginBottom:22}}>
          {points.map((p,i)=>(
            <button key={i} style={{flex:1,height:48,borderRadius:14,fontSize:15,fontWeight:800,whiteSpace:'nowrap',
              border:p[1]?'1.5px solid var(--amber)':'1.5px solid var(--line-strong)',
              background:p[1]?'var(--amber-50)':'#fff',color:p[1]?'var(--amber-d)':'var(--muted)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
              {p[1] && <Icon name="star" size={15} color="var(--amber-d)" stroke={0} style={{fill:'var(--amber-d)'}}/>}+{p[0]}
            </button>
          ))}
        </div>

        {/* attach */}
        <Label>학습지 사진 (선택)</Label>
        <button style={{width:'100%',border:'none',background:'none',padding:0,marginBottom:8}}>
          <div style={{height:96,borderRadius:16,border:'1.5px dashed var(--line-strong)',background:'var(--surface-2)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:7}}>
            <Icon name="camera" size={24} color="var(--green-d)" stroke={1.9}/>
            <span style={{fontSize:13,fontWeight:700,color:'var(--muted)'}}>사진 추가하기</span>
          </div>
        </button>
      </div>

      {/* sticky CTA */}
      <div style={{flex:'0 0 auto',padding:'12px 20px 26px',background:'rgba(244,248,245,.92)',backdropFilter:'blur(8px)',borderTop:'1px solid var(--line)'}}>
        <button style={{width:'100%',height:54,borderRadius:16,border:'none',background:'var(--green)',color:'#fff',fontWeight:800,fontSize:16,
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 8px 20px -8px rgba(22,163,74,.7)'}}>
          <Icon name="plus" size={20} stroke={2.4}/>숙제 추가하기
        </button>
      </div>
    </div>
  );
}
Object.assign(window, { ScreenInput });
