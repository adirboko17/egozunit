'use strict';

fetch('https://egoz.org.il/projects/egoz-embassadors/')
  .then(function (r) { return r.text(); })
  .then(function (html) {
    var re = /https?:\/\/egoz\.org\.il\/wp-content\/uploads\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)/gi;
    var found = html.match(re) || [];
    var unique = [];
    found.forEach(function (u) {
      if (unique.indexOf(u) === -1) unique.push(u);
    });
    unique.forEach(function (u) { console.log(u); });
  });
