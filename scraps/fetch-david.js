'use strict';
fetch('https://egoz.org.il/wp-json/wp/v2/fallen?slug=%d7%93%d7%95%d7%93-%d7%99%d7%94%d7%95%d7%93%d7%94-%d7%99%d7%a6%d7%97%d7%a7-%d7%96%d7%9c')
  .then((r) => r.json())
  .then((data) => {
    const html = data[0].content.rendered;
    console.log('len', html.length);
    console.log(html.slice(0, 2000));
  });
