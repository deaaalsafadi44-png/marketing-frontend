export const getCompanyLogo = (companyName) => {
  // نقوم بتنظيف الاسم من أي مسافات زائدة
  const name = companyName?.trim();

  const logos = {
    "laffah": "/logos/laffah.png",
    "syrian united co": "/logos/syrian_united.png",
    "healthy family": "/logos/healthy_family.png",
    // يمكنك إضافة المزيد هنا مستقبلاً
  };

  // إذا لم يجد شعاراً، يعيد صورة افتراضية أو اللوغو الخاص بك
  return logos[name] || "/laffah.png"; 
};