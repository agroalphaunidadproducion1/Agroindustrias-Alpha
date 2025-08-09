const users = [
  { "usuario": "admin", "clave": "admin123", "rol": "admin" },
  { "usuario": "tecnico", "clave": "tec123", "rol": "tecnico" },
  { "usuario": "digitador1", "clave": "dig123", "rol": "digitador" },
  { "usuario": "grower1", "clave": "grow123", "rol": "grower" }
];
let currentUser = null;
if (location.pathname.endsWith('index.html')) {
  document.getElementById('loginForm').onsubmit = e => {
    e.preventDefault();
    let u = document.getElementById('usuario').value;
    let p = document.getElementById('clave').value;
    let user = users.find(x => x.usuario === u && x.clave === p);
    if (!user) {
      document.getElementById('error').innerText = 'Credenciales inválidas';
      return;
    }
    localStorage.setItem('user', JSON.stringify(user));
    location.href = 'dashboard.html';
  };
}
if (location.pathname.endsWith('dashboard.html')) {
  currentUser = JSON.parse(localStorage.getItem('user'));
  if (!currentUser) location.href = 'index.html';
  document.getElementById('userName').innerText = currentUser.usuario;
  const links = [
    {label:'Fitosanidad',page:'fitosanidad.html'},
    {label:'Riego',page:'riego.html'},
    {label:'Cosecha',page:'cosecha.html'}
  ];
  let ul = document.getElementById('menu');
  links.forEach(l=> {
    let li = document.createElement('li');
    li.innerHTML = `<a href="${l.page}">${l.label}</a>`;
    ul.appendChild(li);
  });
}
function logout() {
  localStorage.removeItem('user');
  location.href = 'index.html';
}