import React from 'react';
import FeatureCard from '../../../components/common/FeatureCard';

export default function FeatureSection() {
  // ข้อมูลการ์ดทั้ง 3 ใบตามดีไซน์ในภาพ image_7f8256.png
  const features = [
    {
      icon: 'search',
      title: 'ตรวจสอบครอบคลุม',
      description: 'สแกนหาช่องโหว่พื้นฐานจนถึงระดับสูง เช่น SQL Injection, XSS, และช่องโหว่ของเซิร์ฟเวอร์'
    },
    {
      icon: 'bar_chart',
      title: 'ผลลัพธ์เข้าใจง่าย',
      description: 'ประเมินผลคะแนนความปลอดภัย (Security Score) เพื่อให้คุณเข้าใจภาพรวมความเสี่ยงได้ในทันที'
    },
    {
      icon: 'verified_user',
      title: 'ปลอดภัยเชื่อถือได้',
      description: 'เราจะไม่จัดเก็บข้อมูลเว็บไซต์ของคุณ เพื่อรักษาความเป็นส่วนตัวสูงสุด'
    }
  ];

  return (
    <section id="features" className="w-full py-12 pb-24 bg-white relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* จัดโครงสร้าง Grid: จอมือถือขึ้น 1 คอลัมน์ / จอคอมใหญ่ขึ้น 3 คอลัมน์ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch justify-center">
          {features.map((item, index) => (
            <FeatureCard
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
            />
          ))}
        </div>

      </div>
    </section>
  );
}