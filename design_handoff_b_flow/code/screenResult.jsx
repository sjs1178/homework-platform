/* screenResult.jsx — 숙제 검사 결과 상세 (B 스타일, 하위 페이지) */
function QCard({ok, qnum, q, ans, correct, fb}){
  const accent = ok ? 'var(--green)' : '#F2607D';
  return (
    <div className="card" style={{padding:0,marginBottom:13,overflow:'hidden',display:'flex'}}>
      <div style={{width:5,flex:'none',background:accent}}></div>
      <div style={{flex:1,padding:'15px 16px 16px'}}>
        <div className="row between" style={{alignItems:'flex-start',gap:10,marginBottom:9}}>
          <div className="row" style={{gap:10,alignItems:'flex-start'}}>
            <span style={{width:24,height:24,borderRadius:'50%',flex:'none',marginTop:1,
              background:ok?'var(--green-100)':'#FCE4EA',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Icon name={ok?'check':'x'} size={15} color={ok?'var(--green-d)':'#E11D48'} stroke={3}/>
            </span>
            <div style={{fontSize:14.5,fontWeight:800,lineHeight:1.4}}>
              <span style={{color:'var(--muted)'}}>{qnum}.</span> {q}
            </div>
          </div>
          <button className="row" style={{gap:3,flex:'none',background:'none',border:'none',color:'var(--green-d)',fontWeight:800,fontSize:12.5,marginTop:2}}>
            <Icon name="edit-3" size={13} color="var(--green-d)" stroke={2.2}/>수정
          </button>
        </div>
        <div style={{paddingLeft:34}}>
          <div style={{fontSize:13.5,color:'var(--text-soft)',fontWeight:600,marginBottom:correct?4:0,lineHeight:1.5}}>
            <span style={{color:'var(--muted)'}}>학생 답</span> · {ans}
          </div>
          {correct && (
            <div style={{fontSize:13.5,fontWeight:800,color:'var(--green-d)',marginBottom:11,lineHeight:1.5}}>
              <span style={{fontWeight:700}}>정답</span> · {correct}
            </div>
          )}
          {fb && (
            <div style={{background:'var(--surface-2)',borderRadius:13,padding:'11px 13px',marginTop:correct?0:11}}>
              <div className="row" style={{gap:5,marginBottom:5}}>
                <Icon name="sparkles" size={13} color="var(--green)" stroke={2}/>
                <span style={{fontSize:11.5,fontWeight:800,color:'var(--green-d)',whiteSpace:'nowrap'}}>AI 해설</span>
              </div>
              <div style={{fontSize:13,color:'var(--text-soft)',fontWeight:500,lineHeight:1.62}}>{fb}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScreenResult(){
  return (
    <div className="dash">
      <StatusBar/>
      {/* header */}
      <div className="row" style={{flex:'0 0 auto',padding:'4px 18px 14px',gap:8}}>
        <button className="icon-btn" style={{width:40,height:40,borderRadius:12,background:'transparent',marginLeft:-6}}>
          <Icon name="arrow-left" size={23} color="var(--text)" stroke={2.2}/>
        </button>
        <div>
          <h1 style={{fontSize:20,fontWeight:800,lineHeight:1.1}}>숙제 검사</h1>
          <div style={{fontSize:13,color:'var(--muted)',fontWeight:600,marginTop:2,whiteSpace:'nowrap'}}>수학 · 학습지 2장 풀기</div>
        </div>
      </div>

      <div className="scroll" style={{padding:'4px 20px 26px'}}>
        {/* score hero */}
        <div style={{borderRadius:24,padding:20,background:'linear-gradient(150deg,#1FB259,#15803D)',color:'#fff',
          boxShadow:'0 14px 30px -12px rgba(21,128,61,.7)',position:'relative',overflow:'hidden',marginBottom:18}}>
          <div style={{position:'absolute',right:-30,top:-30,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,.08)'}}></div>
          <div className="row" style={{gap:20,position:'relative'}}>
            <div style={{width:92,height:92,borderRadius:'50%',flex:'none',
              background:'conic-gradient(#fff 0% 60%, rgba(255,255,255,.22) 60% 100%)',
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:70,height:70,borderRadius:'50%',background:'#16823f',display:'flex',alignItems:'baseline',justifyContent:'center'}}>
                <span style={{fontSize:27,fontWeight:800}}>60</span>
                <span style={{fontSize:13,fontWeight:700,marginLeft:1}}>점</span>
              </div>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,opacity:.9}}>10문제 중</div>
              <div style={{fontSize:30,fontWeight:800,letterSpacing:'-0.02em',margin:'2px 0 4px'}}>6개 정답</div>
              <div className="row" style={{gap:6}}>
                <Icon name="check-circle" size={15} color="#fff" stroke={2.4}/>
                <span style={{fontSize:13,fontWeight:700,opacity:.92,whiteSpace:'nowrap'}}>도형의 특징을 잘 이해했어요</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI 총평 */}
        <div className="card" style={{padding:16,marginBottom:22}}>
          <div className="row" style={{gap:6,marginBottom:9}}>
            <Icon name="sparkles" size={16} color="var(--green)" stroke={2}/>
            <span style={{fontSize:13.5,fontWeight:800,color:'var(--green-d)'}}>AI 총평</span>
          </div>
          <p style={{fontSize:13.5,color:'var(--text-soft)',fontWeight:500,lineHeight:1.7}}>
            꼭짓점과 변의 개수를 정확하게 알고 있는 점이 정말 훌륭해요! 삼각형과 원을 고를 때 빠뜨린 도형이 있었는데, 앞으로 도형을 하나하나 꼼꼼히 세어보는 습관을 길러봐요. 조금만 더 집중하면 훨씬 좋은 결과를 얻을 수 있을 거예요. 화이팅! ✨
          </p>
        </div>

        <div className="row between" style={{margin:'0 4px 13px'}}>
          <h2 style={{fontSize:16,fontWeight:800}}>문항별 결과</h2>
          <span style={{fontSize:13,color:'var(--muted)',fontWeight:700,whiteSpace:'nowrap'}}>오답 3 · 정답 6</span>
        </div>

        <QCard ok={false} qnum="1번" q="도형 중에서 삼각형을 고르시오 (가~차)"
          ans="차, 라" correct="라, 사, 차"
          fb="삼각형은 변이 3개, 꼭짓점이 3개인 도형이에요. 그림에서 삼각형은 '라', '사', '차' 3개예요. '사'도 삼각형인데 빠뜨렸어요. 도형의 변 개수를 꼼꼼히 세어보는 습관을 길러요!"/>
        <QCard ok={true} qnum="2번" q="도형 중에서 사각형을 고르시오 (가~차)"
          ans="가, 마, 아"/>
        <QCard ok={false} qnum="3번" q="도형 중에서 원을 고르시오 (가~차)"
          ans="바, 자 (바는 취소선으로 지움)" correct="나, 다, 바, 자"
          fb="원은 둥근 모양의 도형이에요. 그림에서 원은 '나', '다', '바', '자' 4개예요. '나'와 '다'도 원인데 빠뜨렸고, '바'는 지웠는데 사실 원이 맞아요! 동그란 모양을 모두 찾아보는 연습을 해봐요."/>
        <QCard ok={false} qnum="4번" q="삼각형·사각형·원이 아닌 도형은 모두 몇 개입니까?"
          ans="4종개 (3개로 추정)" correct="3개"
          fb="삼각형(라,사,차), 사각형(가,마,아), 원(나,다,바,자)에 해당하지 않는 도형을 찾아야 해요. 남은 도형을 다시 분류해서 세어보면 정답은 3개예요."/>
        <QCard ok={true} qnum="5번" q="도형의 꼭짓점이 가장 많은 것을 고르시오"
          ans="차"/>
      </div>
    </div>
  );
}
Object.assign(window, { ScreenResult });
