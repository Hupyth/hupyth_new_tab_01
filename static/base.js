(function(){
    var path = location.pathname.replace(/\/$/, "");
    var map = {
        "/home": "home",
        "/home/": "home",
        "/": "home",
        "/index": "home",
        "/about": "about",
        "/about/": "about",
        "/contact": "contact",
        "/contact/": "contact"
    };
    var key = map[path] || (path.startsWith("/about") ? "about" : (path.startsWith("/contact") ? "contact" : "home"));
    document.querySelectorAll('[data-active]').forEach(function(a){
        if(a.getAttribute('data-active') === key) {
            a.style.textDecoration = 'underline';
            a.style.fontWeight = 'bold';
        }
    });
})();

const elements = {
    auto_update: document.getElementById("auto-update")
};

function updateTime() {
    const now = new Date();
    const year = now.getFullYear();

    if (elements.auto_update) {
        elements.auto_update.textContent = `© ${year} New Tab — All rights reserved.`;
    }

    setTimeout(updateTime, 86400000);
}

document.addEventListener('DOMContentLoaded', function() {
    updateTime();
});
