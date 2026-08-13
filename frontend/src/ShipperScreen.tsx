function ShipperScreen() {
  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16 bg-surface dark:bg-inverse-surface border-b border-outline-variant dark:border-outline">
        <div className="flex items-center">
          <span className="font-headline-md font-black text-on-surface dark:text-on-primary-fixed mr-xl">Mov!n</span>
          <div className="flex space-x-lg">
            <a className="text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed font-bold py-2" href="/shipper">Shipper</a>
            <a className="text-secondary dark:text-secondary-fixed py-2 hover:bg-surface-container dark:hover:bg-on-secondary-fixed-variant transition-colors" href="/carrier">Carrier</a>
          </div>
        </div>
        <div className="flex items-center space-x-md">
          <button className="scale-95 active:scale-90 transition-transform p-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface">notifications</span>
          </button>
          <button className="scale-95 active:scale-90 transition-transform p-2 rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface">settings</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden ml-md cursor-pointer hover:opacity-80 transition-opacity">
            <img className="w-full h-full object-cover" data-alt="A professional headshot of a logistics manager in a bright, modern corporate environment. Light, natural illumination highlighting a clean, friendly aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaPo4Ym8P0kQNGnZV8tofDIy-T1HUk2uabEQa_qnKq10D9P1_jPMiZfwAqAw80fFHDsCNlsVFZTpItuwyT-KzRZ3_i2ZEqgS0uMgooiXSNUzSTRw1dnGUuOjcLP5BcjC5CD6Qt6Mx4Aava68A2hs7aQ3H9Py0a5AJuMXm_CHvGOu2hnH37ZSWDX-vVAgDKeSi7sGJvGsQ46f5mTsqOY37DUiN1aJLzUC5HD6RpwNlVzvfurSbC5iKo" />
          </div>
        </div>
      </nav>
      {/* SideNavBar & Main Content Wrapper */}
      <div className="flex pt-16 min-h-screen">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-[280px] py-lg bg-on-secondary-fixed dark:bg-surface-container-highest shadow-sm z-40 hidden md:flex flex-col">
          <div className="px-lg mb-xl">
            <h2 className="font-headline-sm text-primary-fixed mb-1">Shipper Portal</h2>
            <p className="font-label-sm text-secondary-fixed-dim">Logistics Management</p>
          </div>
          <nav className="flex-1 space-y-2">
            <a className="flex items-center gap-md text-secondary-fixed-dim px-lg py-md hover:bg-on-secondary-fixed-variant transition-all scale-[0.98] active:scale-95" href="#">
              <span className="material-symbols-outlined">settings</span>
              <span className="font-label-md">Required Settings</span>
            </a>
            <a className="flex items-center gap-md bg-transparent text-primary-fixed border-l-4 border-primary-fixed px-lg py-md hover:bg-on-secondary-fixed-variant transition-all scale-[0.98] active:scale-95" href="#">
              <span className="material-symbols-outlined">add_box</span>
              <span className="font-label-md">Register Call</span>
            </a>
            <a className="flex items-center gap-md text-secondary-fixed-dim px-lg py-md hover:bg-on-secondary-fixed-variant transition-all scale-[0.98] active:scale-95" href="#">
              <span className="material-symbols-outlined">compare_arrows</span>
              <span className="font-label-md">Compare Conditions</span>
            </a>
            <a className="flex items-center gap-md text-secondary-fixed-dim px-lg py-md hover:bg-on-secondary-fixed-variant transition-all scale-[0.98] active:scale-95" href="#">
              <span className="material-symbols-outlined">assessment</span>
              <span className="font-label-md">Monthly Report</span>
            </a>
            <a className="flex items-center gap-md text-secondary-fixed-dim px-lg py-md hover:bg-on-secondary-fixed-variant transition-all scale-[0.98] active:scale-95" href="#">
              <span className="material-symbols-outlined">chat</span>
              <span className="font-label-md">Chat</span>
            </a>
            <a className="flex items-center gap-md text-secondary-fixed-dim px-lg py-md hover:bg-on-secondary-fixed-variant transition-all scale-[0.98] active:scale-95" href="#">
              <span className="material-symbols-outlined">person</span>
              <span className="font-label-md">My Info</span>
            </a>
          </nav>
        </aside>
        {/* Main Content Area */}
        <main className="flex-1 ml-0 md:ml-[280px] p-lg md:p-margin-desktop bg-background flex flex-col md:flex-row gap-lg">
          {/* Center Cards Canvas */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg auto-rows-min">
            {/* Blank Card 1 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg min-h-[300px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center">
              <span className="text-secondary font-body-md opacity-50">Content Canvas</span>
            </div>
            {/* Blank Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg min-h-[250px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center">
              <span className="text-secondary font-body-md opacity-50">Content Canvas</span>
            </div>
            {/* Blank Card 3 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg min-h-[250px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center">
              <span className="text-secondary font-body-md opacity-50">Content Canvas</span>
            </div>
            {/* Blank Card 4 */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-lg min-h-[250px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex items-center justify-center">
              <span className="text-secondary font-body-md opacity-50">Content Canvas</span>
            </div>
          </div>
          {/* Right Panel: Decision Summary */}
          <aside className="w-full md:w-[320px] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] p-lg flex flex-col h-fit sticky top-[88px]">
            <h3 className="font-headline-sm text-on-surface mb-lg">Decision Summary</h3>
            <div className="space-y-md flex-1">
              {/* Placeholder summary items */}
              <div className="flex items-start gap-sm">
                <div className="w-2 h-2 rounded-full bg-primary-container mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-container rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-surface-container rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex items-start gap-sm">
                <div className="w-2 h-2 rounded-full bg-surface-container-high mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-container rounded w-5/6 mb-2"></div>
                  <div className="h-3 bg-surface-container rounded w-2/3"></div>
                </div>
              </div>
              <div className="flex items-start gap-sm">
                <div className="w-2 h-2 rounded-full bg-surface-container-high mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-container rounded w-4/5 mb-2"></div>
                  <div className="h-3 bg-surface-container rounded w-1/3"></div>
                </div>
              </div>
            </div>
            <button className="mt-xl w-full bg-primary-container text-on-secondary-fixed font-label-md py-3 rounded-full hover:opacity-90 active:scale-95 transition-all border-b border-[#D4C000]">
              Confirm Action
            </button>
          </aside>
        </main>
      </div>
    </div>
  )
}

export default ShipperScreen
