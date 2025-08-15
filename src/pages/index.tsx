import React, { useEffect } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import { IoArrowForward, IoBookOutline, IoTerminalOutline, IoGridOutline } from 'react-icons/io5';
import LanguageRedirect from '../components/LanguageRedirect';
import CustomAnnouncement from '../components/CustomAnnouncement';

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
    // 只在客户端运行，避免SSR问题
    if (typeof window === 'undefined') return;
    
    // 添加body类名，样式已在styles.module.css中定义
    document.body.classList.add('homepage-mode');

    return () => {
      // 清理时移除body类名
      document.body.classList.remove('homepage-mode');
    };
  }, []);
  
  return (
    <div className={styles.homepage}>
      <CustomAnnouncement 
        content={
          <>
            📢 笨蛋文档QQ群由于不可抗力因素（群员恶意举报，恶意发言）目前被封禁，请移至备用群 <strong>874877925</strong>
          </>
        }
      />
      <HomepageHeader />
      <LanguageRedirect />
    </div>
  );
}