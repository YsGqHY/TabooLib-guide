import React, { useEffect } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import { IoArrowForward, IoBookOutline, IoTerminalOutline, IoGridOutline } from 'react-icons/io5';
import LanguageRedirect from '../components/LanguageRedirect';

function HomepageHeader() {
  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.badge}>社区文档</div>
          <h1 className={styles.title}>TabooLib</h1>
          <p className={styles.description}>
            跨平台服务端插件开发框架的社区文档
          </p>
          
          <div className={styles.cta}>
            <Link className={styles.primaryBtn} to="/intro">
              开始使用
              <IoArrowForward />
            </Link>
          </div>
          
          <div className={styles.quickAccess}>
            <Link to="https://tabooproject.org/" className={styles.quickItem}>
              <IoBookOutline />
              官方文档
            </Link>
            <Link to="/kether-list" className={styles.quickItem}>
              <IoTerminalOutline />
              Kether 语句
            </Link>
            <Link to="/plugin-catalog" className={styles.quickItem}>
              <IoGridOutline />
              插件目录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home(): JSX.Element {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      nav.navbar, 
      footer.footer, 
      .navbar-sidebar, 
      .theme-doc-sidebar-container, 
      .theme-doc-footer {
        display: none !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      #__docusaurus {
        margin: 0 !important;
        padding: 0 !important;
      }
      .main-wrapper {
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);
    
    const removeElements = () => {
      document.querySelector('nav.navbar')?.remove();
      document.querySelector('footer.footer')?.remove();
    };
    
    removeElements();
    
    const observer = new MutationObserver(removeElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  return (
    <div className={styles.homepage}>
      <HomepageHeader />
      <LanguageRedirect />
    </div>
  );
}