const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
function mediaFallback(img){img.style.display='none';img.nextElementSibling.style.display='flex'}
function videoFallback(v){v.style.display='none';v.nextElementSibling.style.display='block'}
