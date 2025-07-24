function includeHTML(id, file) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      document.getElementById(id).innerHTML = data;
    });
}

window.addEventListener('DOMContentLoaded', () => {
  includeHTML('header', '/assets/header.html');
  includeHTML('footer', '/assets/footer.html');
}); 