// تنقّل بين الأدوات
const menu = document.getElementById('menu');
menu.addEventListener('click', e=>{
  if(e.target.tagName!=='BUTTON') return;
  document.querySelectorAll('.menu button').forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  const tool=e.target.dataset.tool;
  document.querySelectorAll('.tool').forEach(t=>t.style.display='none');
  document.getElementById(tool).style.display='block';
});

// مساعدة: إنشاء blob URL للتحميل
function makeDownload(blob, filename, linkEl){
  const url = URL.createObjectURL(blob);
  linkEl.href = url; linkEl.download = filename; linkEl.style.display='inline';
}

// معاينة الصور
function showPreview(file,inputId){
  const preview = document.getElementById(inputId);
  preview.innerHTML='';
  if(file){
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  }
}

// إعادة اختيار الملف
function resetFile(inputId, downloadId, statusId, previewId){
  const input = document.getElementById(inputId);
  const download = document.getElementById(downloadId);
  const status = document.getElementById(statusId);
  const preview = document.getElementById(previewId);
  input.value=''; download.style.display='none'; status.textContent=''; preview.innerHTML='';
}

// ===== Convert PNG <-> JPG / WebP =====
document.getElementById('convertFile').addEventListener('change', e=>showPreview(e.target.files[0],'convertPreview'));
document.getElementById('convertReset').addEventListener('click', ()=>resetFile('convertFile','convertDownload','convertStatus','convertPreview'));
document.getElementById('convertBtn').addEventListener('click', ()=>{
  const f = document.getElementById('convertFile').files[0]; if(!f) return alert('اختاري ملف');
  const status = document.getElementById('convertStatus'); status.textContent='جاري التحويل...';
  const reader = new FileReader();
  reader.onload = e=>{
    const img=new Image(); img.src=e.target.result;
    img.onload = ()=>{
      const c=document.createElement('canvas'); c.width=img.width; c.height=img.height;
      c.getContext('2d').drawImage(img,0,0);
      const ext = f.type==='image/png'?'jpeg':'png';
      c.toBlob(b=>{ makeDownload(b,'converted.'+ext,document.getElementById('convertDownload')); status.textContent='تم التحويل!'; }, f.type==='image/png'?'image/jpeg':'image/png');
    }
  }; reader.readAsDataURL(f);
});

// ===== Compress =====
document.getElementById('compressFile').addEventListener('change', e=>showPreview(e.target.files[0],'compressPreview'));
document.getElementById('compressReset').addEventListener('click', ()=>resetFile('compressFile','compressDownload','compressStatus','compressPreview'));
document.getElementById('compressBtn').addEventListener('click', ()=>{
  const f=document.getElementById('compressFile').files[0]; if(!f)return alert('اختاري ملف');
  const q=parseFloat(document.getElementById('quality').value)||0.6;
  const status=document.getElementById('compressStatus'); status.textContent='جاري الضغط...';
  const reader=new FileReader();
  reader.onload=e=>{ const img=new Image(); img.src=e.target.result; img.onload=()=>{
    const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; c.getContext('2d').drawImage(img,0,0);
    c.toBlob(b=>{ makeDownload(b,'compressed.jpg',document.getElementById('compressDownload')); status.textContent='تم الضغط!'; }, 'image/jpeg', q);
  }}; reader.readAsDataURL(f);
});

// ===== Resize =====
document.getElementById('resizeFile').addEventListener('change', e=>showPreview(e.target.files[0],'resizePreview'));
document.getElementById('resizeReset').addEventListener('click', ()=>resetFile('resizeFile','resizeDownload','resizeStatus','resizePreview'));
document.getElementById('resizeBtn').addEventListener('click', ()=>{
  const f=document.getElementById('resizeFile').files[0]; if(!f)return alert('اختاري ملف');
  const newW=parseInt(document.getElementById('newWidth').value)||800;
  const status=document.getElementById('resizeStatus'); status.textContent='جاري تغيير المقاس...';
  const reader=new FileReader(); reader.onload=e=>{ const img=new Image(); img.src=e.target.result; img.onload=()=>{
    const aspect=img.height/img.width; const newH=Math.round(newW*aspect);
    const c=document.createElement('canvas'); c.width=newW; c.height=newH; c.getContext('2d').drawImage(img,0,0,newW,newH);
    c.toBlob(b=>{ makeDownload(b,'resized.jpg',document.getElementById('resizeDownload')); status.textContent='تم تغيير المقاس!'; }, 'image/jpeg',0.85);
  }}; reader.readAsDataURL(f);
});

// ===== Image to PDF =====
document.getElementById('img2pdfFile').addEventListener('change', e=>showPreview(e.target.files[0],'img2pdfPreview'));
document.getElementById('img2pdfReset').addEventListener('click', ()=>resetFile('img2pdfFile','img2pdfDownload','img2pdfStatus','img2pdfPreview'));
document.getElementById('img2pdfBtn').addEventListener('click', async ()=>{
  const f=document.getElementById('img2pdfFile').files[0]; if(!f)return alert('اختاري ملف');
  const status=document.getElementById('img2pdfStatus'); status.textContent='جاري التحويل إلى PDF...';
  const { jsPDF }=window.jspdf;
  const reader=new FileReader(); reader.onload=e=>{
    const img=new Image(); img.src=e.target.result; img.onload=()=>{
      const pdf=new jsPDF({unit:'pt',format:'a4'});
      const maxW=595-40; const scale=Math.min(maxW/img.width,1);
      const w=img.width*scale; const h=img.height*scale;
      pdf.addImage(img,'JPEG',20,20,w,h);
      const blob=pdf.output('blob'); makeDownload(blob,'image.pdf',document.getElementById('img2pdfDownload')); status.textContent='تم التحويل!';
    }
  }; reader.readAsDataURL(f);
});

// ===== Merge PDF =====
document.getElementById('mergeBtn').addEventListener('click', async ()=>{
  const files=Array.from(document.getElementById('mergeFiles').files); if(files.length<2)return alert('اختاري ملفين على الأقل');
  const status=document.getElementById('mergeStatus'); status.textContent='جاري الدمج...';
  const { PDFDocument }=PDFLib;
  const mergedPdf=await PDFDocument.create();
  for(const file of files){
    const arrayBuffer=await file.arrayBuffer();
    const donor=await PDFDocument.load(arrayBuffer);
    const copied=await mergedPdf.copyPages(donor,Array.from({length:donor.getPageCount()},(v,i)=>i));
    copied.forEach(p=>mergedPdf.addPage(p));
  }
  const out=await mergedPdf.save();
  const blob=new Blob([out],{type:'application/pdf'});
  makeDownload(blob,'merged.pdf',document.getElementById('mergeDownload')); status.textContent='تم الدمج!';
});

// ===== webp =====
// إنشاء worker مرة واحدة عند تحميل الصفحة
// ===== تحويل إلى WebP =====
document.getElementById('webpFile').addEventListener('change', e =>
  showPreview(e.target.files[0], 'webpPreview')
);

document.getElementById('webpReset').addEventListener('click', () =>
  resetFile('webpFile', 'webpDownload', 'webpStatus', 'webpPreview')
);

document.getElementById('webpBtn').addEventListener('click', async () => {
  const file = document.getElementById('webpFile').files[0];
  const status = document.getElementById('webpStatus');
  const download = document.getElementById('webpDownload');

  if (!file) return alert('اختاري صورة أولاً');

  status.textContent = 'جاري التحويل...';

  try {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        blob => {
          const url = URL.createObjectURL(blob);
          download.href = url;
          download.style.display = 'block';
          download.textContent = 'تحميل الصورة بصيغة WebP';
          status.textContent = 'تم التحويل بنجاح!';
        },
        'image/webp',
        0.95
      );
    };
  } catch (err) {
    console.error(err);
    status.textContent = 'حدث خطأ أثناء التحويل';
  }
});



