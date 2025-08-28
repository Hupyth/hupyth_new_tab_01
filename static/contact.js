(function(){
  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  var form = document.getElementById('contact-form');
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();
    var status = document.getElementById('contact-status');
    status.hidden = false;
    if(!name || !validEmail(email) || !message){
      status.textContent = 'Please provide full and correct information.';
      return;
    }
    try{
      var res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({name, email, message})
      });
      var data = await res.json();
      status.textContent = data.ok ? 'Successful!' : 'Failed, please try again!.';
    }catch(err){
      status.textContent = 'Internet connection Error, please try again later!.';
    }
  });
})();
