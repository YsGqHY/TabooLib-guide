import React from 'react';
import styles from './styles.module.css';

interface CustomAnnouncementProps {
  content: React.ReactNode;
  className?: string;
}

export default function CustomAnnouncement({ content, className }: CustomAnnouncementProps) {
  return (
    <div className={`${styles.announcementBar} ${className || ''}`} role="banner">
      <div className={styles.announcementContent}>
        {content}
      </div>
    </div>
  );
}
