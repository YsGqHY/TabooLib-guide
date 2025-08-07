import React from 'react';
import {useLocation} from '@docusaurus/router';

// 创建Root wrapper来处理SSR问题
export default function Root({children}) {
  const location = useLocation();
  
  // 对于主页，应用特殊的body样式
  React.useEffect(() => {
    if (location.pathname === '/') {
      const style = document.createElement('style');
      style.innerHTML = `
        body {
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
        }
        #__docusaurus {
          margin: 0 !important;
          padding: 0 !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, [location.pathname]);

  return <>{children}</>;
}
