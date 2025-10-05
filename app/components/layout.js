// components/layout.js

import Navbar from './Navbar';

export default function Layout({ children, pageType }) {
  const layoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  };

  const mainStyle = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '70px', 
  };

  return (
    <div style={layoutStyle}>
      <Navbar pageType={pageType} />
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}