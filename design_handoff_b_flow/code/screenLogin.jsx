/* screenLogin.jsx — 로그인 / 시작 화면 (B 스타일) */
function ScreenLogin(){
  return (
    <div className="dash" style={{background:'#F1F7F3'}}>
      <StatusBar/>
      <div style={{flex:1,display:'flex',flexDirection:'column',padding:'0 28px 30px',minHeight:0}}>

        {/* brand lockup */}
        <div style={{flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'center',paddingTop:54}}>
          <div style={{width:78,height:78,borderRadius:24,background:'linear-gradient(150deg,#22C55E,#15803D)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 14px 30px -10px rgba(21,128,61,.65)'}}>
            <Icon name="clipboard-check" size={38} color="#fff" stroke={2.1}/>
          </div>
          <div style={{fontSize:25,fontWeight:800,marginTop:20,letterSpacing:'-0.02em',whiteSpace:'nowrap'}}>오늘숙제</div>
          <div style={{fontSize:14.5,color:'var(--muted)',fontWeight:600,marginTop:7,whiteSpace:'nowrap'}}>부모와 자녀가 함께하는 숙제 캘린더</div>
        </div>

        {/* hero illustration placeholder */}
        <div style={{flex:'1 1 auto',display:'flex',alignItems:'center',padding:'26px 0'}}>
          <Stripe h={240} r={24} label="부모–자녀 숙제 일러스트" style={{width:'100%'}}/>
        </div>

        {/* sign-in */}
        <div style={{flex:'0 0 auto'}}>
          <button style={{width:'100%',height:56,borderRadius:16,border:'1.5px solid var(--line-strong)',
            background:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:11,
            fontSize:16,fontWeight:800,color:'var(--text)',boxShadow:'var(--sh-sm)'}}>
            <GoogleG size={21}/> Google로 시작하기
          </button>
          <div className="row" style={{justifyContent:'center',gap:6,marginTop:16,color:'var(--faint)'}}>
            <Icon name="lock" size={13} color="var(--faint)" stroke={2}/>
            <span style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>가입 시 이용약관 및 개인정보 처리방침에 동의합니다</span>
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { ScreenLogin });
