const loading = gsap.timeline();

var webStorage = function () {
  if (sessionStorage.getItem('access')) {
    gsap.set('.js-mv-loading', {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
    });
    gsap.set('.js-mv-img', {
      opacity: 1,
    });

  } else {
    sessionStorage.setItem('access', 0);

    loading.fromTo('.js-mv-loading', {
      opacity: 0,
      y: 20,
      filter: 'blur(10px)',
    }, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 1,
      ease: 'power2.inOut',
      stagger: 0.08,
    });
    loading.fromTo('.js-mv-img', {
      opacity: 0,
    }, {
      duration: 1,
      opacity: 1,
      ease: 'power2.inOut',
    });

  }
}
webStorage();

let fadeIns = document.querySelectorAll('.js-fadeIn');

fadeIns.forEach((fadeIn) => {
  gsap.fromTo(
    fadeIn,
    {
      opacity: 0,
      y: 10,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: fadeIn,
        start: 'top 90%',
      },
    }
  );
});
let underLines = document.querySelectorAll('.js-underLine');

underLines.forEach((underLine) => {
  gsap.fromTo(
    underLine,
    {
      opacity: 0,
      clipPath: 'inset(0 100% 0 0)',
    },
    {
      opacity: 1,
      clipPath: 'inset(0 0 0 0)',
      duration: 0.6,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: underLine,
        start: 'top 90%',
      },
    }
  );
});