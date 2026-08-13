function CarrierScreen() {
  return (
    <div className="bg-[#f2f2f2] text-on-background font-body-md min-h-screen">
      <nav className="fixed top-0 z-[200] flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop" aria-label="역할 선택">
        <div className="flex items-center">
          <span className="mr-xl text-headline-md font-black tracking-[-0.04em] text-on-surface">Mov!n</span>
          <div className="flex gap-lg">
            <a className="py-2 text-label-md text-secondary transition-colors hover:text-on-surface" href="/shipper">화주</a>
            <a className="border-b-2 border-primary py-2 text-label-md font-bold text-primary" href="/carrier">운송인</a>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button type="button" aria-label="알림" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">notifications</span>
          </button>
          <button type="button" aria-label="설정" className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container sm:flex">
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">settings</span>
          </button>
          <div className="ml-xs flex h-9 w-9 items-center justify-center rounded-full bg-on-secondary-fixed text-label-sm font-black text-primary-fixed" aria-label="운송인 프로필">운송</div>
        </div>
      </nav>

      <div className="flex min-h-screen items-center justify-center p-lg pt-[88px]">
        <div className="flex items-center gap-xl max-w-6xl w-full">
        {/* Left Side: Stepper Menu */}
        <div className="hidden md:flex flex-col gap-lg w-1/3 p-lg bg-surface rounded-xl shadow-sm border border-tertiary-fixed h-[600px] justify-center relative">
          <div className="font-headline-md text-headline-md text-on-surface mb-lg">운송 진행 상황</div>
          <div className="relative pl-8 border-l-2 border-surface-variant flex flex-col gap-8">
            {/* Step 1: Dispatch */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-surface border-2 border-primary-fixed flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-primary-fixed" style={{ fontSize: '16px' }}>check</span>
              </div>
              <div className="font-label-md text-label-md text-on-surface-variant">오전 08:00</div>
              <div className="font-headline-sm text-headline-sm text-on-surface">배차 완료</div>
              <div className="font-body-md text-body-md text-secondary mt-xs">기사 배정 후 상차지로 이동 중입니다.</div>
            </div>
            {/* Step 2: Loading (Active) */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-primary-container border-2 border-primary-fixed flex items-center justify-center z-10 shadow-sm">
                <div className="w-3 h-3 bg-on-primary-container rounded-full"></div>
              </div>
              <div className="font-label-md text-label-md text-primary font-bold">오전 10:30</div>
              <div className="font-headline-sm text-headline-sm text-on-surface">상차 중</div>
              <div className="font-body-md text-body-md text-secondary mt-xs">물류창고에서 화물을 싣고 있습니다.</div>
            </div>
            {/* Step 3: Transit */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-surface border-2 border-surface-variant flex items-center justify-center z-10"></div>
              <div className="font-label-md text-label-md text-secondary-fixed-dim">대기</div>
              <div className="font-headline-sm text-headline-sm text-tertiary">운송 중</div>
            </div>
            {/* Step 4: Completion */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-surface border-2 border-surface-variant flex items-center justify-center z-10"></div>
              <div className="font-label-md text-label-md text-secondary-fixed-dim">대기</div>
              <div className="font-headline-sm text-headline-sm text-tertiary">운송 완료</div>
            </div>
            {/* Active Line Overlay */}
            <div className="absolute left-[-2px] top-4 bottom-0 w-[2px] bg-primary-fixed z-0" style={{ height: '35%' }}></div>
          </div>
        </div>
        {/* Center: Smartphone Frame */}
        <div className="w-[375px] h-[812px] bg-background phone-frame flex flex-col mx-auto flex-shrink-0">
          <div className="notch"></div>
          {/* TopAppBar Container (Simulated inside phone) */}
          <div className="flex justify-between items-center px-margin-mobile py-md w-full bg-surface pt-[50px] z-50">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface" data-icon="menu">menu</span>
            </div>
            <div className="font-headline-sm-mobile text-headline-sm-mobile font-bold text-on-surface">
              Mov!n 운송인
            </div>
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface" data-icon="notifications">notifications</span>
            </div>
          </div>
          {/* Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-margin-mobile flex flex-col gap-md pb-[100px] bg-surface-container-lowest">
            <div className="font-label-md text-label-md text-secondary tracking-wide">진행 중인 운송</div>
            {/* Job Card 1 */}
            <div className="bg-surface rounded-xl border border-tertiary-fixed shadow-sm p-md flex flex-col gap-sm">
              <div className="flex justify-between items-start">
                <div className="font-headline-sm text-headline-sm text-on-surface">#LD-20394</div>
                <div className="bg-primary-container text-on-primary-container px-2 py-1 rounded text-[10px] font-bold">상차 중</div>
              </div>
              <div className="font-body-md text-body-md text-secondary flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                이천 알파 물류창고
              </div>
              <button className="mt-sm w-full bg-surface-variant hover:bg-surface-container-high text-on-surface font-label-md text-label-md py-2 rounded-lg transition-colors border border-tertiary-fixed">
                상세 보기
              </button>
            </div>
            <div className="font-label-md text-label-md text-secondary tracking-wide mt-md">운송 예정</div>
            {/* Job Card 2 */}
            <div className="bg-surface rounded-xl border border-tertiary-fixed shadow-sm p-md flex flex-col gap-sm opacity-70">
              <div className="flex justify-between items-start">
                <div className="font-headline-sm text-headline-sm text-on-surface">#LD-20395</div>
                <div className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold">대기</div>
              </div>
              <div className="font-body-md text-body-md text-secondary flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                부천 베타 물류센터
              </div>
            </div>
            {/* Job Card 3 */}
            <div className="bg-surface rounded-xl border border-tertiary-fixed shadow-sm p-md flex flex-col gap-sm opacity-70">
              <div className="flex justify-between items-start">
                <div className="font-headline-sm text-headline-sm text-on-surface">#LD-20396</div>
                <div className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold">대기</div>
              </div>
              <div className="font-body-md text-body-md text-secondary flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                인천항 터미널
              </div>
            </div>
          </div>
          {/* BottomNavBar Container (Simulated inside phone) */}
          <div className="absolute bottom-3 left-3 right-3 bg-surface rounded-xl shadow-lg border border-outline-variant flex justify-around items-center px-xs pb-safe py-2 z-50">
            <div className="flex flex-col items-center justify-center text-on-secondary-container hover:bg-surface-variant transition-all rounded-lg p-1 scale-90 active:scale-75 duration-200">
              <span className="material-symbols-outlined" data-icon="settings">settings</span>
              <span className="font-label-sm text-label-sm mt-1">설정</span>
            </div>
            <div className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 hover:bg-surface-variant transition-all scale-90 active:scale-75 duration-200">
              <span className="material-symbols-outlined" data-icon="home" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
              <span className="font-label-sm text-label-sm mt-1">홈</span>
            </div>
            <div className="flex flex-col items-center justify-center text-on-secondary-container hover:bg-surface-variant transition-all rounded-lg p-1 scale-90 active:scale-75 duration-200">
              <span className="material-symbols-outlined" data-icon="swap_calls">swap_calls</span>
              <span className="font-label-sm text-label-sm mt-1">회차</span>
            </div>
            <div className="flex flex-col items-center justify-center text-on-secondary-container hover:bg-surface-variant transition-all rounded-lg p-1 scale-90 active:scale-75 duration-200">
              <span className="material-symbols-outlined" data-icon="groups">groups</span>
              <span className="font-label-sm text-label-sm mt-1">후보</span>
            </div>
            <div className="flex flex-col items-center justify-center text-on-secondary-container hover:bg-surface-variant transition-all rounded-lg p-1 scale-90 active:scale-75 duration-200">
              <span className="material-symbols-outlined" data-icon="analytics">analytics</span>
              <span className="font-label-sm text-label-sm mt-1">실적</span>
            </div>
            <div className="flex flex-col items-center justify-center text-on-secondary-container hover:bg-surface-variant transition-all rounded-lg p-1 scale-90 active:scale-75 duration-200">
              <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
              <span className="font-label-sm text-label-sm mt-1">내 정보</span>
            </div>
          </div>
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-[#1a1c1c] rounded-full z-[100] opacity-50"></div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default CarrierScreen
